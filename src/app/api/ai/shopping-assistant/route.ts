import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

const requestSchema = z.object({
  prompt: z.string().min(2, "Prompt is too short").max(500, "Prompt cannot exceed 500 characters"),
  category: z.string().optional(),
  maxPrice: z.number().positive().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting check (15 requests / min per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimit = checkRateLimit(`ai-assistant:${ip}`, 15, 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many AI assistant requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    // 2. Validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, category, maxPrice, size, color } = validation.data;

    // 3. Query actual product database for source of truth context
    const whereCondition: Prisma.ProductWhereInput = {};

    if (maxPrice) {
      whereCondition.price = { lte: maxPrice };
    }

    if (category) {
      whereCondition.category = {
        OR: [
          { slug: { contains: category.toLowerCase() } },
          { name: { contains: category, mode: "insensitive" } },
        ],
      };
    }

    // Fetch matching products (max 15 to stay within OpenAI token limits)
    // Include active flashSaleItems so the AI surfaces real PKR sale prices
    const now = new Date();
    const dbProducts = await prisma.product.findMany({
      where: whereCondition,
      take: 15,
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        comparePrice: true,
        description: true,
        rating: true,
        reviewCount: true,
        badge: true,
        category: {
          select: { name: true, slug: true },
        },
        images: {
          select: { url: true, isPrimary: true },
          take: 2,
        },
        variants: {
          select: { size: true, color: true, stock: true },
        },
        flashSaleItems: {
          where: {
            flashSale: {
              isActive: true,
              startDate: { lte: now },
              endDate: { gte: now },
            },
          },
          select: {
            salePrice: true,
            flashSale: { select: { title: true, endDate: true } },
          },
          take: 1,
        },
      },
    });

    if (dbProducts.length === 0) {
      return NextResponse.json({
        message:
          "I couldn't find any products in our catalog matching those exact criteria. Please try broadening your search or adjusting price limits.",
        products: [],
      });
    }

    // Helper: format PKR amounts for the AI catalog context string
    const formatPKR = (amount: number) =>
      `\u20a8${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(amount)}`;

    // Prepare catalog context string for AI model
    // All prices are PKR — explicitly labeled so the AI never confuses them with USD
    const catalogContext = dbProducts
      .map((p) => {
        const sizes = Array.from(new Set(p.variants.map((v) => v.size).filter(Boolean))).join(", ");
        const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean))).join(", ");
        const inStock = p.variants.some((v) => v.stock > 0);

        // Use flash sale price if an active sale exists, otherwise use regular price
        const activeSale = p.flashSaleItems?.[0];
        const regularPrice = p.price;
        const comparePrice = p.comparePrice;

        const priceInfo = activeSale
          ? `Flash Sale Price: ${formatPKR(Number(activeSale.salePrice))} PKR (Original: ${formatPKR(regularPrice)} PKR, Sale: "${activeSale.flashSale.title}")`
          : comparePrice && Number(comparePrice) > regularPrice
          ? `Price: ${formatPKR(regularPrice)} PKR (Compare-at: ${formatPKR(Number(comparePrice))} PKR)`
          : `Price: ${formatPKR(regularPrice)} PKR`;

        return `[ID: ${p.id}] Name: "${p.name}" | ${priceInfo} | Currency: PKR | Category: "${
          p.category?.name || "General"
        }" | Sizes: [${sizes || "One Size"}] | Colors: [${colors || "Standard"}] | In Stock: ${
          inStock ? "Yes" : "No"
        } | Rating: ${p.rating}/5 (${p.reviewCount} reviews) | Description: ${p.description.slice(0, 150)}...`;
      })
      .join("\n");

    const apiKey = process.env.OPENAI_API_KEY;

    // If OpenAI API Key is provided, perform AI completion
    if (apiKey && apiKey.startsWith("sk-") && !apiKey.includes("your-openai")) {
      try {
        const openai = new OpenAI({ apiKey });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are LUXORA's personal luxury AI Shopping Assistant serving customers in Pakistan.
Your goal is to provide concise, elegant, and helpful product recommendations strictly using the official LUXORA product catalog provided below.

CURRENCY RULES — STRICTLY ENFORCED:
- LUXORA operates exclusively in Pakistan. ALL prices are in Pakistani Rupees (PKR / \u20a8).
- NEVER use $, USD, dollars, or any other currency symbol or name.
- NEVER convert prices. Use the exact PKR values from the catalog as-is.
- When a customer mentions a budget (e.g., "under 5000", "below 10k", "around 20,000"), ALWAYS interpret it as PKR.
  Examples:
    "under 5000"           \u2192 PKR 5,000 budget
    "below 10k"            \u2192 PKR 10,000 budget
    "between 5k and 15k"   \u2192 PKR 5,000\u201315,000 range
    "around 20,000"        \u2192 approximately PKR 20,000
- When recommending products, show prices formatted as \u20a8X,XXX (e.g., \u20a88,500).
- If a product has a Flash Sale price in the catalog, quote the Flash Sale price and mention the sale name.
  Example: "Currently on Flash Sale at \u20a88,999 (original \u20a812,000)."
- NEVER invent, calculate, or convert any price. Only use the exact PKR values from the catalog.

CRITICAL CONSTRAINTS:
1. NEVER invent or mention any products, prices, sizes, or features not present in the catalog context.
2. Select 1 to 4 matching product IDs from the catalog that best satisfy the customer prompt.
3. Output MUST be valid JSON with two fields:
   - "reply": (string) Elegant 2-4 sentence customer response explaining why these items suit them. Always quote prices in \u20a8 PKR format.
   - "recommendedProductIds": (array of strings) The exact product IDs from the catalog.

LUXORA Catalog Context (all prices are in PKR):
${catalogContext}`,
            },
            {
              role: "user",
              content: `Customer request: "${prompt}". ${maxPrice ? `Budget maximum: ${formatPKR(maxPrice)} PKR.` : ""} ${
                size ? `Size requested: ${size}.` : ""
              } ${color ? `Color requested: ${color}.` : ""}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 400,
        });

        const rawContent = completion.choices[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          const recommendedIds: string[] = parsed.recommendedProductIds || [];
          const reply: string = parsed.reply || "Here are our top recommended items for you:";

          const matchedProducts = dbProducts.filter((p) => recommendedIds.includes(p.id));
          const finalProducts = matchedProducts.length > 0 ? matchedProducts : dbProducts.slice(0, 3);

          return NextResponse.json({
            message: reply,
            products: finalProducts,
          });
        }
      } catch (openAiErr) {
        Sentry.captureException(openAiErr, {
          tags: { operation: "ai_shopping_assistant_openai_call" },
        });
        // Fall back gracefully to rule-based matching if OpenAI fails
      }
    }

    // Graceful fallback algorithm when OpenAI API key is unconfigured or unavailable
    const promptLower = prompt.toLowerCase();
    const rankedProducts = dbProducts.filter((p) => {
      const matchName = p.name.toLowerCase().includes(promptLower);
      const matchCat = p.category?.name.toLowerCase().includes(promptLower);
      const matchDesc = p.description.toLowerCase().includes(promptLower);
      return matchName || matchCat || matchDesc;
    });

    const recommended = rankedProducts.length > 0 ? rankedProducts.slice(0, 4) : dbProducts.slice(0, 4);

    return NextResponse.json({
      message: `Based on your request "${prompt}", here are our curated luxury recommendations directly from our inventory:`,
      products: recommended,
    });
  } catch (error: unknown) {
    Sentry.captureException(error, {
      tags: { operation: "ai_shopping_assistant" },
    });

    return NextResponse.json(
      { error: "An error occurred while processing your AI shopping request." },
      { status: 500 }
    );
  }
}
