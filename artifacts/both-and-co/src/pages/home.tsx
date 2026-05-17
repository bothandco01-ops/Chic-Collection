import { useQueryClient } from "@tanstack/react-query";
import { 
  useListProducts, 
  getListProductsQueryKey, 
  Product 
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredProducts, isLoading } = useListProducts(
    { featured: "true" }, 
    { query: { queryKey: getListProductsQueryKey({ featured: "true" }) } }
  );

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/placeholder-heels.png" 
            alt="Luxury Heels" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-20">
          <h1 className="font-serif italic text-5xl md:text-7xl lg:text-8xl tracking-wider text-foreground mb-6 drop-shadow-lg">
            Elevated. Sensual. Unapologetic.
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-2xl mx-auto font-light tracking-wide">
            Luxury Nigerian womenswear accessories crafted for the stylish, confident woman.
          </p>
          <Link href="/shop">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-12 py-6 text-sm tracking-[0.2em] uppercase transition-all duration-300">
              Explore Collection
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background px-4 md:px-8">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-none bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
              ))
            ) : featuredProducts?.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-24 bg-card px-4 md:px-8">
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
                <span className="text-white/80 uppercase tracking-widest text-xs border-b border-white/30 pb-1 pb-1 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
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

      {/* Brand Story Teaser */}
      <section className="py-32 bg-background px-4 md:px-8 text-center">
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
    </Layout>
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
