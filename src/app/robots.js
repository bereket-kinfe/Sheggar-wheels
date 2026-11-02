import { getSiteUrl } from "../lib/site-url";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/cars", "/cars/"], disallow: ["/dashboard", "/bookings", "/owner", "/admin", "/checkout"] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
