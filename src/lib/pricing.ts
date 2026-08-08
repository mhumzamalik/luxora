export interface FlashSaleRelation {
  salePrice: number;
  flashSale: {
    id: string;
    title: string;
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
  };
}

export interface ProductWithFlashSales {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  comparePrice?: number | null;
  badge?: string | null;
  isFlashSale?: boolean;
  flashSaleItems?: FlashSaleRelation[];
  [key: string]: any;
}

export interface ResolvedPricing {
  price: number;
  comparePrice: number | null;
  badge: string | null;
  isFlashSale: boolean;
  flashSaleTitle?: string;
  flashSaleEndDate?: string;
  originalPrice: number;
}

/**
 * Resolves effective pricing for a product based on active Flash Sale campaigns.
 * If the product is currently in an active Flash Sale (isActive, within startDate and endDate),
 * the sale price, crossed-out original price, calculated discount badge, and flash sale metadata are returned.
 */
export function resolveProductPricing<T extends ProductWithFlashSales>(
  product: T,
  now: Date = new Date()
): T & ResolvedPricing {
  const activeSaleItem = product.flashSaleItems?.find((item) => {
    const sale = item.flashSale;
    if (!sale || !sale.isActive) return false;
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);
    return start <= now && end >= now;
  });

  if (activeSaleItem) {
    const salePrice = activeSaleItem.salePrice;
    const originalPrice = product.price;
    const comparePrice = product.comparePrice || originalPrice;
    const discountPercent = originalPrice > salePrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

    return {
      ...product,
      price: salePrice,
      comparePrice,
      badge: discountPercent > 0 ? `-${discountPercent}%` : product.badge || "-20%",
      isFlashSale: true,
      flashSaleTitle: activeSaleItem.flashSale.title,
      flashSaleEndDate: new Date(activeSaleItem.flashSale.endDate).toISOString(),
      originalPrice,
    };
  }

  return {
    ...product,
    price: product.price,
    comparePrice: product.comparePrice || null,
    badge: product.badge || null,
    isFlashSale: Boolean(product.isFlashSale),
    originalPrice: product.price,
  };
}
