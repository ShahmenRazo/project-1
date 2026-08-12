import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/_next/",
          "/login",
          "/reset-password",
          "/onboarding",
          "/dashboard",
          "/groups",
          "/profile",
          "/join",
          "/invite",
        ],
      },
    ],
    sitemap: "https://kitstartai.com/sitemap.xml",
  };
}
