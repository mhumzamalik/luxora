import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Lightweight per-process in-memory cache with stampede protection ─────────
// Homepage data is cached for 30s. We revalidate periodically so countdown
// timers and flash-sale active state stay accurate while keeping latency sub-5ms.
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CachedEntry {
  data: HomepagePayload;
  expiresAt: number;
}

let cached: CachedEntry | null = null;
let inFlightFetch: Promise<HomepagePayload> | null = null;

// ─── Types returned to the client ────────────────────────────────────────────
export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

export interface HomeProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  badge: string | null;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  images: ProductImage[];
  stock: number;
}

export interface FlashSaleProduct {
  id: string;
  name: string;
  slug: string;
  /** Sale price from FlashSaleItem.salePrice — NOT Product.price */
  price: number;
  /** Original Product.price — shown crossed-out */
  comparePrice: number;
  badge: string;
  image: string;
  images: ProductImage[];
  stock: number;
  category: string;
  rating: number;
  reviewCount: number;
}

export interface FlashSaleData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: FlashSaleProduct[];
}

export interface DBBanner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  linkUrl: string | null;
  ctaText: string | null;
  position: number;
}

export interface HomepagePayload {
  bestSellers: HomeProduct[];
  flashSale: FlashSaleData | null;
  newArrivals: HomeProduct[];
  categories: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    productCount: number;
  }[];
  heroBanners: DBBanner[];
  promoBanners: DBBanner[];
}

// ─── Consolidated High-Performance Query ─────────────────────────────────────
// Executes all homepage sections (FlashSale, BestSellers, NewArrivals, Categories,
// Hero Banners, Promo Banners) in a single optimized database query with
// CTEs and sub-queries, completely eliminating relation N+1 roundtrips.
async function fetchHomepageData(): Promise<{ payload: HomepagePayload; timings: Record<string, number> }> {
  const timings: Record<string, number> = {};
  const tStart = performance.now();

  // Stage 4: Prisma Connection Check
  const tConn0 = performance.now();
  await prisma.$connect();
  const tConn1 = performance.now();
  timings["4_prisma_connection_acquisition"] = Number((tConn1 - tConn0).toFixed(2));

  // Stage 5: $queryRaw Execution
  const now = new Date();
  const tQuery0 = performance.now();
  const results: Array<Record<string, unknown>> = await prisma.$queryRaw`
    WITH active_flash_sale AS (
      SELECT 
        fs.id,
        fs.title,
        fs.start_date AS "startDate",
        fs.end_date AS "endDate",
        fs.is_active AS "isActive",
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.id,
              'name', p.name,
              'slug', p.slug,
              'price', fsi.sale_price::float8,
              'comparePrice', p.price::float8,
              'badge', CASE 
                WHEN p.price > fsi.sale_price THEN '-' || ROUND(((p.price - fsi.sale_price) / p.price * 100)::numeric) || '%'
                ELSE COALESCE(p.badge, '-20%')
              END,
              'image', COALESCE(
                (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
                (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1),
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
              ),
              'images', COALESCE(
                (
                  SELECT json_agg(
                    json_build_object(
                      'id', pi.id,
                      'url', pi.url,
                      'alt', pi.alt,
                      'isPrimary', pi.is_primary
                    ) ORDER BY pi.is_primary DESC, pi.id ASC
                  )
                  FROM product_images pi
                  WHERE pi.product_id = p.id
                ),
                '[]'::json
              ),
              'stock', COALESCE((SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id), 0)::int,
              'category', COALESCE(c.name, 'General'),
              'rating', p.rating::float8,
              'reviewCount', p.review_count::int
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) AS products,
        COALESCE(array_agg(p.id) FILTER (WHERE p.id IS NOT NULL), ARRAY[]::text[]) AS flash_product_ids
      FROM flash_sales fs
      LEFT JOIN flash_sale_items fsi ON fsi.flash_sale_id = fs.id
      LEFT JOIN products p ON p.id = fsi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE fs.is_active = true AND fs.start_date <= ${now} AND fs.end_date >= ${now}
      GROUP BY fs.id, fs.title, fs.start_date, fs.end_date, fs.is_active
      ORDER BY fs.end_date ASC
      LIMIT 1
    ),
    best_sellers AS (
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price::float8 AS price,
        p.compare_price::float8 AS "comparePrice",
        COALESCE(p.badge, 'Best Seller') AS badge,
        p.rating::float8 AS rating,
        p.review_count::int AS "reviewCount",
        COALESCE(c.name, 'General') AS category,
        COALESCE(
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1),
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
        ) AS image,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary
              ) ORDER BY pi.is_primary DESC, pi.id ASC
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images,
        COALESCE((SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id), 0)::int AS stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_best_seller = true
        AND NOT (p.id = ANY(COALESCE((SELECT flash_product_ids FROM active_flash_sale), ARRAY[]::text[])))
      ORDER BY p.updated_at DESC
      LIMIT 8
    ),
    new_arrivals AS (
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price::float8 AS price,
        p.compare_price::float8 AS "comparePrice",
        COALESCE(p.badge, 'New') AS badge,
        p.rating::float8 AS rating,
        p.review_count::int AS "reviewCount",
        COALESCE(c.name, 'General') AS category,
        COALESCE(
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1),
          (SELECT pi.url FROM product_images pi WHERE pi.product_id = p.id LIMIT 1),
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
        ) AS image,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pi.id,
                'url', pi.url,
                'alt', pi.alt,
                'isPrimary', pi.is_primary
              ) ORDER BY pi.is_primary DESC, pi.id ASC
            )
            FROM product_images pi
            WHERE pi.product_id = p.id
          ),
          '[]'::json
        ) AS images,
        COALESCE((SELECT SUM(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id), 0)::int AS stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_new_arrival = true
        AND NOT (p.id = ANY(COALESCE((SELECT flash_product_ids FROM active_flash_sale), ARRAY[]::text[])))
      ORDER BY p.created_at DESC
      LIMIT 8
    ),
    categories_data AS (
      SELECT 
        c.id,
        c.name,
        c.slug,
        c."imageUrl" AS image,
        (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id) AS "productCount"
      FROM categories c
      ORDER BY c.created_at ASC
      LIMIT 12
    ),
    banners_data AS (
      SELECT
        b.id,
        b.title,
        b.subtitle,
        b.description,
        b.image_url AS "imageUrl",
        b.mobile_image_url AS "mobileImageUrl",
        b.link_url AS "linkUrl",
        b.cta_text AS "ctaText",
        b.position,
        b.type
      FROM banners b
      WHERE b.is_active = true
        AND (b.start_date IS NULL OR b.start_date <= ${now})
        AND (b.end_date IS NULL OR b.end_date >= ${now})
      ORDER BY b.position ASC, b.created_at DESC
    )
    SELECT 
      (
        SELECT row_to_json(afs.*)
        FROM (
          SELECT 
            id,
            title,
            to_char("startDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "startDate",
            to_char("endDate" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "endDate",
            "isActive",
            products
          FROM active_flash_sale
        ) afs
      ) AS "flashSale",
      COALESCE((SELECT json_agg(bs.*) FROM best_sellers bs), '[]'::json) AS "bestSellers",
      COALESCE((SELECT json_agg(na.*) FROM new_arrivals na), '[]'::json) AS "newArrivals",
      COALESCE((SELECT json_agg(cd.*) FROM categories_data cd), '[]'::json) AS "categories",
      COALESCE((SELECT json_agg(bd.*) FROM banners_data bd WHERE bd.type = 'HERO'), '[]'::json) AS "heroBanners",
      COALESCE((SELECT json_agg(bd.*) FROM banners_data bd WHERE bd.type = 'PROMO'), '[]'::json) AS "promoBanners"
  `;
  const tQuery1 = performance.now();
  timings["5_queryRaw_execution"] = Number((tQuery1 - tQuery0).toFixed(2));

  // Stage 7: Result processing
  const tProc0 = performance.now();
  const row = results[0] || {};
  const payload: HomepagePayload = {
    bestSellers: (row.bestSellers || []) as HomeProduct[],
    flashSale: (row.flashSale || null) as FlashSaleData | null,
    newArrivals: (row.newArrivals || []) as HomeProduct[],
    categories: (row.categories || []) as HomepagePayload["categories"],
    heroBanners: (row.heroBanners || []) as DBBanner[],
    promoBanners: (row.promoBanners || []) as DBBanner[],
  };
  const tProc1 = performance.now();
  timings["7_result_processing"] = Number((tProc1 - tProc0).toFixed(2));
  timings["total_fetch_time"] = Number((performance.now() - tStart).toFixed(2));

  return { payload, timings };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const tRoute0 = performance.now();
  const stageTimings: Record<string, number> = {};

  try {
    const now = Date.now();

    // Stage 1 & 2: Request enters & Cache lookup
    const tCache0 = performance.now();
    stageTimings["1_request_enters_route"] = 0;
    if (cached && now < cached.expiresAt) {
      stageTimings["2_cache_lookup"] = Number((performance.now() - tCache0).toFixed(3));
      stageTimings["status"] = 200;
      console.log(`[HOMEPAGE TIMINGS - CACHE HIT]`, {
        stageTimings,
        totalTimeMs: (performance.now() - tRoute0).toFixed(2),
      });

      const tRes0 = performance.now();
      const res = NextResponse.json(cached.data, {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
      stageTimings["9_response_creation"] = Number((performance.now() - tRes0).toFixed(3));
      return res;
    }
    stageTimings["2_cache_lookup"] = Number((performance.now() - tCache0).toFixed(3));

    // Stage 3: In-flight Promise lookup
    const tInFlight0 = performance.now();
    let isReusedInFlight = false;
    if (!inFlightFetch) {
      inFlightFetch = fetchHomepageData()
        .then(({ payload, timings }) => {
          Object.assign(stageTimings, timings);
          const tCacheWrite0 = performance.now();
          cached = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS };
          stageTimings["10_cache_write"] = Number((performance.now() - tCacheWrite0).toFixed(3));
          return payload;
        })
        .finally(() => {
          inFlightFetch = null;
        });
    } else {
      isReusedInFlight = true;
    }
    stageTimings["3_inflight_promise_lookup"] = Number((performance.now() - tInFlight0).toFixed(3));

    const data = await inFlightFetch;

    // Stage 8 & 9: JSON Serialization & Response Creation
    const tSer0 = performance.now();
    const payloadStr = JSON.stringify(data);
    stageTimings["8_json_serialization"] = Number((performance.now() - tSer0).toFixed(3));
    stageTimings["payload_size_kb"] = Number((payloadStr.length / 1024).toFixed(2));

    const tRes0 = performance.now();
    const response = NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Cache": isReusedInFlight ? "IN_FLIGHT_HIT" : "MISS",
      },
    });
    stageTimings["9_response_creation"] = Number((performance.now() - tRes0).toFixed(3));
    stageTimings["11_total_response_time"] = Number((performance.now() - tRoute0).toFixed(2));

    console.log(`[HOMEPAGE TIMINGS - ${isReusedInFlight ? "IN_FLIGHT_HIT" : "MISS"}]`, stageTimings);

    return response;
  } catch (error) {
    console.error("GET /api/homepage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch homepage data" },
      { status: 500 }
    );
  }
}

