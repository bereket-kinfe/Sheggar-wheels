import cars from "./car-details.json";
import { getSiteUrl } from "../lib/site-url";

export default function sitemap() {
  const base = getSiteUrl();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cars`, changeFrequency: "daily", priority: 0.9 },
    ...cars.map((car) => ({
      url: `${base}/cars/${car.id}`,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
  ];
}
