import { prisma } from "@/lib/prisma";

async function main() {
  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection warm.\n");

  const slug = "women-s-chic-summer-resort-dress";
  const now = new Date();

  // Phase 1
  const t0 = performance.now();
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true, name: true },
  });
  console.log("Phase1 product scalar:", (performance.now() - t0).toFixed(1) + "ms | name=" + product?.name);
  if (!product) return;

  // Phase 2 — measure each individually (sequential, for profiling)
  const queries = [
    { name: "category",       fn: () => prisma.category.findUnique({ where: { id: product.categoryId }, select: { id: true, name: true, slug: true } }) },
    { name: "images",         fn: () => prisma.productImage.findMany({ where: { productId: product.id }, select: { id: true, url: true, alt: true, isPrimary: true } }) },
    { name: "variants",       fn: () => prisma.productVariant.findMany({ where: { productId: product.id }, select: { id: true, size: true, color: true, colorHex: true, sku: true, stock: true, reserved: true, price: true } }) },
    { name: "reviews",        fn: () => prisma.review.findMany({ where: { productId: product.id }, select: { id: true, rating: true, title: true, comment: true, createdAt: true, user: { select: { id: true, name: true, image: true } } }, orderBy: { createdAt: "desc" } }) },
    { name: "flashSaleItems", fn: () => prisma.flashSaleItem.findMany({ where: { productId: product.id, flashSale: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } }, select: { salePrice: true, flashSale: { select: { id: true, title: true, startDate: true, endDate: true, isActive: true } } } }) },
    { name: "relatedProducts",fn: () => prisma.product.findMany({ where: { categoryId: product.categoryId, id: { not: product.id } }, take: 4, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, slug: true, price: true, comparePrice: true, badge: true, rating: true, reviewCount: true, categoryId: true, isFlashSale: true, category: { select: { id: true, name: true, slug: true } }, images: { select: { id: true, url: true, alt: true, isPrimary: true }, orderBy: { isPrimary: "desc" }, take: 3 }, flashSaleItems: { where: { flashSale: { isActive: true, startDate: { lte: now }, endDate: { gte: now } } }, select: { salePrice: true, flashSale: { select: { id: true, title: true, startDate: true, endDate: true, isActive: true } } } } } }) },
  ];

  console.log("\n--- Sequential individual timings (each is 1 round-trip) ---");
  for (const q of queries) {
    const t = performance.now();
    const result = await q.fn() as unknown[];
    const ms = (performance.now() - t).toFixed(1);
    const count = Array.isArray(result) ? result.length : (result ? 1 : 0);
    console.log(`  ${q.name.padEnd(16)}: ${ms}ms | rows=${count}`);
  }

  // Now measure all parallel
  console.log("\n--- Parallel (Promise.all of same 6 queries) ---");
  const tAll = performance.now();
  await Promise.all(queries.map(q => q.fn()));
  console.log("  Promise.all total:", (performance.now() - tAll).toFixed(1) + "ms");

  await prisma.$disconnect();
}

main().catch(console.error);
