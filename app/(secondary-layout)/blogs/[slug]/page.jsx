import ArticleDetailClient from "@/components/(secondary-layout)/(blogs-page)/ArticleDetailClient";

export default async function ArticleDetail({ params }) {
  // In Next.js 15+, params is a Promise
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;


  // Return client component with the resolved slug
  return <ArticleDetailClient slug={slug} />;
}
