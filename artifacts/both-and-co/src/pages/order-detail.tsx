import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Payment", color: "bg-yellow-900/40 text-yellow-300 border-yellow-800" },
  payment_uploaded: { label: "Payment Uploaded", color: "bg-blue-900/40 text-blue-300 border-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-900/40 text-green-300 border-green-800" },
  shipped: { label: "Shipped", color: "bg-purple-900/40 text-purple-300 border-purple-800" },
  delivered: { label: "Delivered", color: "bg-primary/20 text-primary border-primary/40" },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive border-destructive/40" },
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || "0", 10);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: { queryKey: getGetOrderQueryKey(orderId), enabled: !!orderId },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-20">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-48 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-32 text-center">
          <h2 className="font-serif italic text-3xl mb-4">Order not found</h2>
          <Link href="/orders">
            <Button className="rounded-none px-10 py-5 tracking-widest uppercase text-xs">Back to Orders</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/orders">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-8">
            <ChevronLeft className="h-4 w-4" />
            Back to Orders
          </button>
        </Link>

        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif italic text-4xl mb-1">Order #{order.id}</h1>
              <p className="text-muted-foreground text-sm">
                Placed {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span className={`px-4 py-2 text-xs tracking-widest uppercase border self-start ${status.color}`}>
              {status.label}
            </span>
          </div>
          <div className="h-px bg-primary w-16" />
        </div>

        <div className="bg-card border border-border p-8 mb-8">
          <h3 className="font-serif text-lg mb-6">Items Ordered</h3>
          <div className="space-y-6">
            {order.items?.map((item) => (
              <div key={item.id} className="flex gap-4" data-testid={`order-item-${item.id}`}>
                <div className="w-16 h-20 flex-shrink-0 overflow-hidden bg-secondary">
                  {item.product?.imageUrl && (
                    <img src={item.product.imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{item.product?.name}</p>
                  {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  <p className="text-sm text-primary mt-1">₦{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-6 pt-4 flex justify-between font-medium">
            <span>Total</span>
            <span data-testid="text-order-total">₦{order.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-6">
            <h3 className="font-serif text-lg mb-4">Shipping Details</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>{order.guestName || "—"}</p>
              <p>{order.guestEmail || "—"}</p>
              <p>{order.phone || "—"}</p>
              <p className="mt-2">{order.shippingAddress || "—"}</p>
            </div>
          </div>

          <div className="bg-card border border-border p-6">
            <h3 className="font-serif text-lg mb-4">Payment Status</h3>
            {order.status === "pending" && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">Transfer to:</p>
                <p className="text-sm font-medium">First Bank Nigeria</p>
                <p className="text-sm text-muted-foreground">BOTH & CO. LIMITED</p>
                <p className="text-xl font-mono font-bold text-primary mt-2">3012345678</p>
                <p className="text-sm font-medium mt-2">₦{order.totalAmount.toLocaleString()}</p>
                <Link href={`/checkout`}>
                  <Button variant="outline" size="sm" className="rounded-none mt-4 text-xs tracking-widest uppercase border-border">
                    Upload Payment Proof
                  </Button>
                </Link>
              </div>
            )}
            {order.status !== "pending" && (
              <div>
                <span className={`px-3 py-1 text-xs tracking-widest uppercase border ${status.color}`}>
                  {status.label}
                </span>
                {order.paymentProofUrl && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Payment proof submitted</p>
                    <img src={order.paymentProofUrl} alt="Payment proof" className="max-h-32 object-contain" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
