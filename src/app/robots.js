export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: [{ userAgent: "*", allow: ["/", "/cars", "/cars/"], disallow: ["/dashboard", "/bookings", "/owner", "/admin", "/checkout"] }],
    ...(base ? { sitemap: `${base.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
