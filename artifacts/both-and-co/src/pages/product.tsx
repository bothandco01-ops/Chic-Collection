import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetProduct, 
  getGetProductQueryKey,
  useAddToCart,
  getGetCartQueryKey
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(
    productId,
    { query: { queryKey: getGetProductQueryKey(productId), enabled: !!productId } }
  );

  const addToCart = useAddToCart();
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const availableSizes = product?.sizes ? product.sizes.split(",").map(s => s.trim()) : [];

  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const fallback = product.category === "heels" ? "/placeholder-heels.png" : "/placeholder-glasses.png";
    const set = new Set<string>();
    if (product.imageUrl) set.add(product.imageUrl);
    (product.imageUrls || []).forEach((u) => { if (u) set.add(u); });
    const arr = Array.from(set);
    return arr.length > 0 ? arr : [fallback];
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    if (availableSizes.length > 0 && !selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive"
      });
      return;
    }

    addToCart.mutate(
      { 
        data: { 
          productId: product.id, 
          quantity, 
          size: selectedSize || undefined,
          sessionId: getSessionId()
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({
            title: "Added to bag",
            description: `${product.name} has been added to your bag.`
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12">
          <Skeleton className="w-full md:w-1/2 aspect-[3/4] rounded-none bg-muted" />
          <div className="w-full md:w-1/2 space-y-6 pt-8">
            <Skeleton className="h-10 w-3/4 bg-muted" />
            <Skeleton className="h-6 w-1/4 bg-muted" />
            <Skeleton className="h-32 w-full bg-muted mt-8" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="py-32 text-center">
          <h2 className="text-2xl font-serif italic mb-4">Product Not Found</h2>
          <Link href="/shop">
            <Button variant="outline" className="rounded-none">Return to Shop</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 lg:gap-24">
        {/* Product Image Gallery */}
        <div className="w-full md:w-1/2">
          <div className="aspect-[3/4] overflow-hidden bg-card mb-3">
            <img
              src={gallery[activeImage] || gallery[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
              data-testid="product-main-image"
            />
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-2" data-testid="product-thumbnails">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden bg-card border transition-colors ${i === activeImage ? "border-primary" : "border-border hover:border-primary/50"}`}
                  data-testid={`product-thumb-${i}`}
                >
                  <img src={src} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="w-full md:w-1/2 flex flex-col pt-8 md:pt-16">
          <div className="mb-2 text-xs tracking-widest uppercase text-muted-foreground">
            {product.category}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">{product.name}</h1>
          <p className="text-xl text-primary font-light mb-8">₦{product.price.toLocaleString()}</p>
          
          <div className="prose prose-invert max-w-none mb-10 text-muted-foreground font-light leading-relaxed">
            <p>{product.description || "No description available for this piece."}</p>
          </div>

          <div className="space-y-8 mb-10">
            {availableSizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm uppercase tracking-widest font-medium">Select Size</h3>
                  <button className="text-xs text-muted-foreground underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 min-w-[3rem] px-4 border ${selectedSize === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/50'} transition-colors rounded-none font-medium`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm uppercase tracking-widest font-medium mb-4">Quantity</h3>
              <div className="flex items-center border border-border w-32 h-12">
                <button 
                  className="flex-1 h-full text-lg hover:text-primary transition-colors disabled:opacity-50"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="flex-1 text-center font-medium">{quantity}</span>
                <button 
                  className="flex-1 h-full text-lg hover:text-primary transition-colors"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-none h-14 uppercase tracking-widest text-xs"
            onClick={handleAddToCart}
            disabled={!product.inStock || addToCart.isPending}
          >
            {addToCart.isPending ? "Adding..." : product.inStock ? "Add to Bag" : "Sold Out"}
          </Button>

          <div className="mt-12 space-y-6 pt-10 border-t border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
                <span className="text-lg">🚚</span>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Standard Delivery</h4>
                <p className="text-xs text-muted-foreground">3-5 business days across Nigeria.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center shrink-0">
                <span className="text-lg">✨</span>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Authenticity Guaranteed</h4>
                <p className="text-xs text-muted-foreground">Every piece is verified for quality.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
