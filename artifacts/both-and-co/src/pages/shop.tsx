import { useState, useMemo } from "react";
import { useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { ProductCard } from "@/pages/home";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X } from "lucide-react";

export default function Shop() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || "all";
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");

  const { data: products, isLoading } = useListProducts(
    {},
    { query: { queryKey: getListProductsQueryKey({}) } }
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    let result = products;
    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, category, search]);

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

      {/* Filter + search bar */}
      <div className="border-b border-border sticky top-16 z-20 bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0">
            {/* Category tabs */}
            <div className="flex gap-0 overflow-x-auto scrollbar-none shrink-0">
              {[
                { value: "all", label: "All Pieces" },
                { value: "heels", label: "Heels" },
                { value: "glasses", label: "Glasses" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className={`flex-shrink-0 px-4 md:px-5 py-4 text-xs tracking-widest uppercase transition-colors border-b-2 ${
                    category === value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`category-${value}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border mx-3 shrink-0 hidden sm:block" />

            {/* Search */}
            <div className="flex-1 flex items-center gap-2 min-w-0 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none min-w-0"
                data-testid="shop-search-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {search && (
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-6">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-none bg-muted" />
                <Skeleton className="h-3 w-2/3 bg-muted" />
                <Skeleton className="h-3 w-1/3 bg-muted" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              {search ? `No products found for "${search}".` : "No products found in this category."}
            </div>
          ) : (
            filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
