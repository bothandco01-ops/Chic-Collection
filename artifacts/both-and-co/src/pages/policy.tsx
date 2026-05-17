import { useParams, Link } from "wouter";
import { useGetPageContent, getGetPageContentQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const PAGE_LABELS: Record<string, string> = {
  "returns-policy": "Returns Policy",
  "terms-of-service": "Terms of Service",
  "privacy-policy": "Privacy Policy",
};

export default function PolicyPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = useGetPageContent(slug || "", {
    query: { queryKey: getGetPageContentQueryKey(slug || ""), enabled: !!slug },
  });

  const label = PAGE_LABELS[slug || ""] || "Policy";

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <Skeleton className="h-10 w-56 mb-8" />
          <div className="space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
        </div>
      </Layout>
    );
  }

  if (!page || !page.body) {
    return (
      <Layout>
        <div className="max-w-xl mx-auto px-4 py-32 text-center">
          <h1 className="font-serif italic text-4xl mb-4">{label}</h1>
          <p className="text-muted-foreground mb-10">This policy has not been published yet. Check back soon.</p>
          <Link href="/"><Button variant="outline" className="rounded-none">Return Home</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-12">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-4">Legal</p>
          <h1 className="font-serif italic text-4xl md:text-5xl mb-4">{page.title || label}</h1>
          <div className="h-px w-16 bg-primary" />
        </div>
        <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">
          {page.body}
        </div>
      </div>
    </Layout>
  );
}
