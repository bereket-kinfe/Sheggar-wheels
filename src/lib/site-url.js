export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const deploymentUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  const url =
    configuredUrl ||
    (deploymentUrl
      ? deploymentUrl.startsWith("http")
        ? deploymentUrl
        : `https://${deploymentUrl}`
      : "http://localhost:3000");

  return new URL(url).origin;
}
