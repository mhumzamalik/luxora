import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_STORE_URL || "http://localhost:3000";

  const staticRoutes = [
    "",
    "/products",
    "/account",
    "/auth/login",
    "/auth/signup",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/returns",
    "/shipping",
    "/faq",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/products" ? "daily" : "monthly",
    priority: route === "" ? 1.0 : 0.8,
  }));
}
