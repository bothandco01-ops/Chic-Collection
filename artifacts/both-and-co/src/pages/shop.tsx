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

      {/* Category filter — horizontal tabs on all screen sizes */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {[
              { value: "all", label: "All Pieces" },
              { value: "heels", label: "Luxury Heels" },
              { value: "glasses", label: "Oversized Glasses" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`flex-shrink-0 px-5 py-4 text-xs tracking-widest uppercase transition-colors border-b-2 ${
                  category === value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-none bg-muted" />
                <Skeleton className="h-3 w-2/3 bg-muted" />
                <Skeleton className="h-3 w-1/3 bg-muted" />
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
    </Layout>
  );
}
