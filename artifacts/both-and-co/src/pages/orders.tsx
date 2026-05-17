import { useQueryClient } from "@tanstack/react-query";
import {
  useListOrders,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Show } from "@clerk/react";
import { Package } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Payment", color: "bg-yellow-900/40 text-yellow-300 border-yellow-800" },
  payment_uploaded: { label: "Payment Uploaded", color: "bg-blue-900/40 text-blue-300 border-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-900/40 text-green-300 border-green-800" },
  shipped: { label: "Shipped", color: "bg-purple-900/40 text-purple-300 border-purple-800" },
  delivered: { label: "Delivered", color: "bg-primary/20 text-primary border-primary/40" },
  cancelled: { label: "Cancelled", color: "bg-destructive/20 text-destructive border-destructive/40" },
};

export default function Orders() {
  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() },
  });

  return (
    <Layout>
      <Show when="signed-out">
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <Package className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="font-serif italic text-3xl mb-4">Sign in to view orders</h2>
          <p className="text-muted-foreground mb-10">Your order history is available when you are signed in.</p>
          <Link href="/sign-in">
            <Button className="rounded-none px-10 py-5 tracking-widest uppercase text-xs">Sign In</Button>
          </Link>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h1 className="font-serif italic text-4xl md:text-5xl mb-3">My Orders</h1>
            <div className="h-px w-16 bg-primary" />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
              <h3 className="font-serif text-2xl mb-4">No orders yet</h3>
              <p className="text-muted-foreground mb-8">When you place an order, it will appear here.</p>
              <Link href="/shop">
                <Button className="rounded-none px-10 py-5 tracking-widest uppercase text-xs">Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-0">
              {orders.map((order, idx) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div
                    key={order.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between py-8 gap-4 ${idx < orders.length - 1 ? "border-b border-border" : ""}`}
                    data-testid={`order-${order.id}`}
                  >
                    <div>
                      <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">
                        Order #{order.id} · {new Date(order.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <p className="font-serif text-lg mb-2">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-primary font-medium">₦{order.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 text-xs tracking-widest uppercase border ${status.color}`}>
                        {status.label}
                      </span>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="rounded-none text-xs tracking-widest uppercase border-border">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Show>
    </Layout>
  );
}
