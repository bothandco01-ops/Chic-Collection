import { useEffect, useMemo, useState } from "react";
import {
  useListProducts,
  getListProductsQueryKey,
  Product,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteSettings, getSectionsConfig, getHeroBanners } from "@/lib/settings";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const settings = useSiteSettings();
  const sections = getSectionsConfig(settings);
  const banners = getHeroBanners(settings);
  const { data: allFeatured, isLoading } = useListProducts(
    { featured: "true" },
    { query: { queryKey: getListProductsQueryKey({ featured: "true" }) } }
  );

  const featured = useMemo(() => {
    const list = allFeatured || [];
    const order = settings.featuredProductIds || [];
    if (order.length === 0) return list.slice(0, 4);
    const byId = new Map(list.map((p) => [p.id, p]));
    const ordered: Product[] = [];
    for (const id of order) {
      const p = byId.get(id);
      if (p) { ordered.push(p); byId.delete(id); }
    }
    // Append remaining featured (in case admin hasn't ordered all)
    for (const p of byId.values()) ordered.push(p);
    return ordered.slice(0, 4);
  }, [allFeatured, settings.featuredProductIds]);

  return (
    <Layout>
      <HeroCarousel banners={banners} />

      {sections.featuredProducts && (
        <section className="py-24 bg-background px-4 md:px-8" data-testid="section-featured">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-16">
              <div>
                <h2 className="font-serif italic text-3xl md:text-5xl text-foreground mb-4">Featured Pieces</h2>
                <div className="h-px w-24 bg-primary" />
              </div>
              <Link href="/shop">
                <Button variant="link" className="text-muted-foreground hover:text-primary tracking-widest uppercase text-xs">
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[3/4] w-full rounded-none bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                    <Skeleton className="h-4 w-1/3 bg-muted" />
                  </div>
                ))
              ) : featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {sections.categoriesShowcase && (
        <section className="py-24 bg-card px-4 md:px-8" data-testid="section-categories">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <Link href="/shop?category=heels" className="group relative aspect-[4/5] overflow-hidden block">
                <img
                  src="/placeholder-heels.png"
                  alt="Heels Category"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <h3 className="font-serif italic text-4xl text-white mb-4">Heels</h3>
                  <span className="text-white/80 uppercase tracking-widest text-xs border-b border-white/30 pb-1 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    Shop Category
                  </span>
                </div>
              </Link>

              <Link href="/shop?category=glasses" className="group relative aspect-[4/5] overflow-hidden block">
                <img
                  src="/placeholder-glasses.png"
                  alt="Glasses Category"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                  <h3 className="font-serif italic text-4xl text-white mb-4">Glasses</h3>
                  <span className="text-white/80 uppercase tracking-widest text-xs border-b border-white/30 pb-1 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                    Shop Category
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {sections.brandStory && (
        <section className="py-32 bg-background px-4 md:px-8 text-center" data-testid="section-brand-story">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif italic text-3xl md:text-5xl text-foreground mb-8">The Philosophy</h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-10">
              We believe luxury is a feeling, not just a price tag. Every piece in our collection is meticulously curated to embody the strength, grace, and sensuality of the modern Nigerian woman.
            </p>
            <Link href="/about">
              <Button variant="outline" className="border-border text-foreground hover:bg-muted rounded-none px-8 tracking-widest uppercase text-xs">
                Read Our Story
              </Button>
            </Link>
          </div>
        </section>
      )}
    </Layout>
  );
}

function HeroCarousel({ banners }: { banners: ReturnType<typeof getHeroBanners> }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;
  const banner = banners[index] || banners[0];

  return (
    <section className="relative h-[80vh] min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden" data-testid="hero-carousel">
      {banners.map((b, i) => (
        <div
          key={i}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={b.imageUrl || "/placeholder-heels.png"}
            alt={b.title}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20" key={index}>
        <h1 className="font-serif italic text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wider text-foreground mb-6 drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          {banner.title}
        </h1>
        <p className="text-base md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto font-light tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-700">
          {banner.subtitle}
        </p>
        <Link href={banner.ctaLink || "/shop"}>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 md:px-12 py-6 text-sm tracking-[0.2em] uppercase transition-all duration-300">
            {banner.ctaText || "Explore Collection"}
          </Button>
        </Link>
      </div>

      {count > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-background/40 hover:bg-background/70 backdrop-blur border border-border/40 transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-background/40 hover:bg-background/70 backdrop-blur border border-border/40 transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-1 transition-all ${i === index ? "w-8 bg-primary" : "w-4 bg-foreground/30 hover:bg-foreground/50"}`}
                aria-label={`Go to banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/${product.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-card mb-3">
        <img
          src={product.imageUrl || (product.category === 'heels' ? '/placeholder-heels.png' : '/placeholder-glasses.png')}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-background/90 text-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest">
            Sold Out
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground tracking-wide leading-snug line-clamp-1">{product.name}</h3>
        <p className="text-primary text-sm font-medium">₦{product.price.toLocaleString()}</p>
      </div>
    </Link>
  );
}
