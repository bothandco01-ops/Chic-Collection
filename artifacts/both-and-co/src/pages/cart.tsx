import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  getGetCartQueryKey,
  useRemoveCartItem,
  useUpdateCartItem,
  useClearCart,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionId } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cartItems, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() },
  });

  const removeItem = useRemoveCartItem();
  const updateItem = useUpdateCartItem();
  const clearCart = useClearCart();

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  ) || 0;

  const handleRemove = (id: number) => {
    removeItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
    });
  };

  const handleQuantity = (id: number, qty: number) => {
    if (qty < 1) return;
    updateItem.mutate({ id, data: { quantity: qty } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
      },
    });
  };

  const handleClear = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: "Cart cleared" });
      },
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20">
          <Skeleton className="h-10 w-48 mb-10" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full mb-4" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-32 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="font-serif italic text-3xl mb-4">Your bag is empty</h2>
          <p className="text-muted-foreground mb-10">Add some beautiful pieces to get started.</p>
          <Link href="/shop">
            <Button className="rounded-none px-10 py-5 tracking-widest uppercase text-xs">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="font-serif italic text-4xl md:text-5xl mb-3">Your Bag</h1>
            <div className="h-px w-16 bg-primary" />
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-destructive tracking-widest uppercase transition-colors"
            data-testid="button-clear-cart"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-0">
            {cartItems.map((item, idx) => (
              <div
                key={item.id}
                className={`flex gap-6 py-8 ${idx < cartItems.length - 1 ? "border-b border-border" : ""}`}
                data-testid={`cart-item-${item.id}`}
              >
                <div className="w-24 h-28 flex-shrink-0 overflow-hidden bg-card">
                  {item.product?.imageUrl ? (
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif text-lg mb-1">{item.product?.name}</h3>
                    {item.size && (
                      <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                        Size: {item.size}
                      </p>
                    )}
                    <p className="text-primary font-medium">
                      ₦{((item.product?.price || 0) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        onClick={() => handleQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-decrease-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-4 text-sm" data-testid={`quantity-${item.id}`}>{item.quantity}</span>
                      <button
                        onClick={() => handleQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid={`button-increase-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border p-8 sticky top-24">
              <h3 className="font-serif text-xl mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span data-testid="text-subtotal">₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Delivery</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span data-testid="text-total">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <Link href="/checkout">
                <Button
                  className="w-full rounded-none py-5 tracking-widest uppercase text-xs"
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                </Button>
              </Link>
              <Link href="/shop">
                <Button
                  variant="ghost"
                  className="w-full mt-3 rounded-none text-xs tracking-widest uppercase text-muted-foreground"
                >
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
