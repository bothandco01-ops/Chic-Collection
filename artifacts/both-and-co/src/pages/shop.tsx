import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListProducts, 
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/pages/home";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Shop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);

  const { data: products, isLoading } = useListProducts(
    category === "all" ? {} : { category },
    { query: { queryKey: getListProductsQueryKey(category === "all" ? {} : { category }) } }
  );

  return (
    <Layout>
      <div className="bg-card py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-serif italic text-4xl md:text-5xl text-foreground mb-6">The Collection</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-light">
            Discover our curated selection of luxury heels and oversized glasses. Each piece is designed to make a statement.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h3 className="font-medium text-lg mb-6 tracking-wide border-b border-border pb-4">Categories</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setCategory("all")}
                className={`block text-sm tracking-wide transition-colors ${category === "all" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                All Pieces
              </button>
              <button 
                onClick={() => setCategory("heels")}
                className={`block text-sm tracking-wide transition-colors ${category === "heels" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Luxury Heels
              </button>
              <button 
                onClick={() => setCategory("glasses")}
                className={`block text-sm tracking-wide transition-colors ${category === "glasses" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
              >
                Oversized Glasses
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[3/4] w-full rounded-none bg-muted" />
                  <Skeleton className="h-4 w-2/3 bg-muted" />
                  <Skeleton className="h-4 w-1/3 bg-muted" />
                </div>
              ))
            ) : products?.length === 0 ? (
              <div className="col-span-full py-20 text-center text-muted-foreground">
                No products found in this category.
              </div>
            ) : (
              products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
