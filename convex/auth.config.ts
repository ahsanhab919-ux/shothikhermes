const siteUrl =
  process.env.CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
  process.env.NEXT_PUBLIC_CONVEX_URL?.replace(".convex.cloud", ".convex.site") ||
  "";

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "shothik-publishing",
    },
  ],
};
