import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Luxora database...");

  // Seed Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@luxora.com" },
    update: {},
    create: {
      name: "Luxora Administrator",
      email: "admin@luxora.com",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", adminUser.email);

  // Seed Customer User
  const customerPassword = await bcrypt.hash("customer123", 10);
  const customerUser = await prisma.user.upsert({
    where: { email: "customer@luxora.com" },
    update: {},
    create: {
      name: "Sophia Carter",
      email: "customer@luxora.com",
      passwordHash: customerPassword,
      role: "CUSTOMER",
    },
  });
  console.log("Created customer user:", customerUser.email);

  // Seed Categories
  const categoriesData = [
    { name: "Women", slug: "women", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" },
    { name: "Men", slug: "men", imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80" },
    { name: "Shoes", slug: "shoes", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80" },
    { name: "Bags", slug: "bags", imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80" },
    { name: "Accessories", slug: "accessories", imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=400&q=80" },
    { name: "Beauty", slug: "beauty", imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80" },
    { name: "Home & Living", slug: "home-living", imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80" },
    { name: "Gifts", slug: "gifts", imageUrl: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=400&q=80" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, imageUrl: cat.imageUrl },
      create: cat,
    });
    categories[cat.slug] = created.id;
  }
  console.log("Seeded categories.");

  // Seed Products
  const productsData = [
    // Best Sellers
    {
      name: "Sony WH-1000XM5 Wireless Headphones",
      slug: "sony-wh-1000xm5",
      description: "Industry-leading noise canceling headphones with two processors and 8 microphones for unprecedented sound clarity and call quality.",
      price: 299.0,
      comparePrice: 375.0,
      badge: "-20%",
      rating: 4.8,
      reviewCount: 1248,
      isBestSeller: true,
      categorySlug: "accessories",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Apple Watch Series 9 GPS 45mm",
      slug: "apple-watch-series-9",
      description: "Smarter, brighter, and mightier. Featuring Double tap gesture interaction and advanced health monitoring sensors.",
      price: 382.0,
      comparePrice: 449.0,
      badge: "-15%",
      rating: 4.9,
      reviewCount: 856,
      isBestSeller: true,
      categorySlug: "accessories",
      imageUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Bleu de Chanel Parfum 100ml",
      slug: "bleu-de-chanel-parfum",
      description: "An aromatic, deeply woody fragrance. A captivating scent that embodies independence and determination.",
      price: 129.0,
      comparePrice: null,
      badge: null,
      rating: 4.9,
      reviewCount: 2410,
      isBestSeller: true,
      categorySlug: "beauty",
      imageUrl: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Nike Air Force 1 '07 Men's Shoes",
      slug: "nike-air-force-1-07",
      description: "The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on classic leather structure.",
      price: 88.0,
      comparePrice: 118.0,
      badge: "-25%",
      rating: 4.7,
      reviewCount: 652,
      isBestSeller: true,
      categorySlug: "shoes",
      imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    },

    // Flash Sale
    {
      name: "Leather Handbag",
      slug: "leather-handbag-luxury",
      description: "Handcrafted calfskin leather handbag with brushed gold-toned brass hardware and spacious double compartments.",
      price: 69.0,
      comparePrice: 99.0,
      badge: "-30%",
      rating: 4.9,
      reviewCount: 312,
      isFlashSale: true,
      categorySlug: "bags",
      imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Galaxy Buds2 Pro",
      slug: "galaxy-buds2-pro",
      description: "Seamless 24-bit Hi-Fi sound with intelligent Active Noise Cancellation and ergonomic secure fit.",
      price: 129.0,
      comparePrice: 169.0,
      badge: "-25%",
      rating: 4.6,
      reviewCount: 440,
      isFlashSale: true,
      categorySlug: "accessories",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Oversized Hoodie",
      slug: "oversized-hoodie-cotton",
      description: "Heavyweight organic French terry cotton hoodie featuring a relaxed drop-shoulder silhouette.",
      price: 44.0,
      comparePrice: 69.0,
      badge: "-35%",
      rating: 4.8,
      reviewCount: 190,
      isFlashSale: true,
      categorySlug: "women",
      imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Fossil Chronograph Watch",
      slug: "fossil-chronograph-watch",
      description: "Black stainless steel case with textured dial, precision quartz movement, and genuine leather strap.",
      price: 119.0,
      comparePrice: 199.0,
      badge: "-40%",
      rating: 4.7,
      reviewCount: 520,
      isFlashSale: true,
      categorySlug: "accessories",
      imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    },

    // New Arrivals
    {
      name: "Mini Shoulder Bag",
      slug: "mini-shoulder-bag",
      description: "Compact structured baguette bag with magnetic flap closure and detachable chain shoulder strap.",
      price: 89.0,
      comparePrice: null,
      badge: "New",
      rating: 4.9,
      reviewCount: 48,
      isNewArrival: true,
      categorySlug: "bags",
      imageUrl: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Adidas Samba OG",
      slug: "adidas-samba-og",
      description: "Born on the pitch, the Samba is a timeless icon of street style crafted with full grain leather upper.",
      price: 198.0,
      comparePrice: null,
      badge: "Trending",
      rating: 4.9,
      reviewCount: 890,
      isNewArrival: true,
      categorySlug: "shoes",
      imageUrl: "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Jo Malone Peony & Blush Suede",
      slug: "jo-malone-peony",
      description: "The essence of charm. Peonies in voluptuous bloom, exquisitely fragile, flirtatious with a juicy bite of red apple.",
      price: 135.0,
      comparePrice: null,
      badge: "New",
      rating: 4.8,
      reviewCount: 115,
      isNewArrival: true,
      categorySlug: "beauty",
      imageUrl: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Denim Jacket",
      slug: "classic-denim-jacket",
      description: "Vintage washed rigid denim jacket featuring button-front chest pockets and side welt pockets.",
      price: 179.0,
      comparePrice: null,
      badge: "New",
      rating: 4.7,
      reviewCount: 82,
      isNewArrival: true,
      categorySlug: "men",
      imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Ray-Ban Wayfarer",
      slug: "ray-ban-wayfarer",
      description: "The classic Original Wayfarer Classic sunglasses, universally recognized style with high contrast UV lenses.",
      price: 149.0,
      comparePrice: null,
      badge: "Trending",
      rating: 4.9,
      reviewCount: 1430,
      isNewArrival: true,
      categorySlug: "accessories",
      imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    },
    {
      name: "Travel Backpack",
      slug: "travel-backpack-canvas",
      description: "Water-resistant commuter backpack with padded 16-inch laptop compartment and hidden anti-theft pocket.",
      price: 129.0,
      comparePrice: null,
      badge: "New",
      rating: 4.8,
      reviewCount: 64,
      isNewArrival: true,
      categorySlug: "bags",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const item of productsData) {
    const categoryId = categories[item.categorySlug];
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        price: item.price,
        comparePrice: item.comparePrice,
        badge: item.badge,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isBestSeller: item.isBestSeller || false,
        isFlashSale: item.isFlashSale || false,
        isNewArrival: item.isNewArrival || false,
      },
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        price: item.price,
        comparePrice: item.comparePrice,
        badge: item.badge,
        rating: item.rating,
        reviewCount: item.reviewCount,
        isBestSeller: item.isBestSeller || false,
        isFlashSale: item.isFlashSale || false,
        isNewArrival: item.isNewArrival || false,
        categoryId: categoryId,
        images: {
          create: [
            { url: item.imageUrl, alt: item.name, isPrimary: true },
          ],
        },
        variants: {
          create: [
            { sku: `${item.slug}-default`, stock: 50, reserved: 0 },
          ],
        },
      },
    });
    console.log("Seeded product:", product.name);
  }

  // Seed Sample Coupons
  await prisma.coupon.upsert({
    where: { code: "LUXORA20" },
    update: {},
    create: {
      code: "LUXORA20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderAmount: 100,
      isActive: true,
    },
  });
  console.log("Seeded coupon LUXORA20");

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
