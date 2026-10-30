import cars from "./car-details.json";
export default function sitemap() {
  // Replace the placeholder origin with the deployed canonical origin before release.
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://example.invalid";
  return [{ url: base, changeFrequency: "weekly", priority: 1 }, { url: `${base}/cars`, changeFrequency: "daily", priority: 0.9 }, ...cars.map(car => ({ url: `${base}/cars/${car.id}`, changeFrequency: "weekly", priority: 0.7 }))];
}
