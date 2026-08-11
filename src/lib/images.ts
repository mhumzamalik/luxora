/**
 * Standardized Product Image Helpers
 * Ensures consistent image ordering and primary image selection across Admin & Customer UI.
 */

export interface ImageLike {
  url: string;
  alt?: string | null;
  isPrimary?: boolean | null;
}

export interface ProductLike {
  image?: string | null;
  images?: ImageLike[] | null;
}

export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80";

/**
 * Returns the primary image URL for a product.
 * Selection priority:
 * 1. Image with `isPrimary: true` inside `product.images`
 * 2. First image in `product.images`
 * 3. Legacy `product.image` string
 * 4. Neutral fallback placeholder
 */
export function getPrimaryImage(product?: ProductLike | null): string {
  if (!product) return FALLBACK_IMAGE;

  if (Array.isArray(product.images) && product.images.length > 0) {
    const primary = product.images.find((img) => Boolean(img?.isPrimary));
    if (primary?.url && primary.url.trim()) {
      return primary.url.trim();
    }
    const first = product.images.find((img) => Boolean(img?.url && img.url.trim()));
    if (first?.url && first.url.trim()) {
      return first.url.trim();
    }
  }

  if (product.image && typeof product.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  return FALLBACK_IMAGE;
}

/**
 * Returns the images array sorted with the primary image first.
 */
export function getOrderedImages(product?: ProductLike | null): ImageLike[] {
  if (!product || !Array.isArray(product.images) || product.images.length === 0) {
    const primaryUrl = getPrimaryImage(product);
    return [{ url: primaryUrl, isPrimary: true }];
  }

  const validImages = product.images.filter((img) => img && typeof img.url === "string" && img.url.trim());
  if (validImages.length === 0) {
    return [{ url: FALLBACK_IMAGE, isPrimary: true }];
  }

  const primaryIndex = validImages.findIndex((img) => Boolean(img.isPrimary));
  if (primaryIndex > 0) {
    const primary = validImages[primaryIndex];
    const rest = validImages.filter((_, idx) => idx !== primaryIndex);
    return [primary, ...rest];
  }

  return validImages;
}

/**
 * Validates whether an image URL is a valid web URL or local upload path.
 */
export function isValidImageUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim();
  if (!trimmed) return false;

  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("file:")
  ) {
    return false;
  }

  // Allow local uploaded files e.g. /uploads/123.jpg or base64 data URLs if uploaded
  if (trimmed.startsWith("/") || trimmed.startsWith("data:image/")) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
