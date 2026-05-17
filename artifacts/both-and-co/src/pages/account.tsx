import { useUser, useClerk, Show } from "@clerk/react";
import { Link, Redirect } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Package, LogOut } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Payment", color: "text-yellow-400" },
  payment_uploaded: { label: "Payment Uploaded", color: "text-blue-400" },
  confirmed: { label: "Confirmed", color: "text-green-400" },
  shipped: { label: "Shipped", color: "text-purple-400" },
  delivered: { label: "Delivered", color: "text-primary" },
  cancelled: { label: "Cancelled", color: "text-destructive" },
};

export default function Account() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() },
  });

  return (
    <Layout>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
      <Show when="signed-in">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h1 className="font-serif italic text-4xl md:text-5xl mb-3">My Account</h1>
            <div className="h-px w-16 bg-primary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-1">
              <div className="bg-card border border-border p-8">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4 overflow-hidden">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName || ""} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-serif text-xl mb-1">{user?.fullName || "Guest"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
                </div>
                <div className="space-y-2">
                  <Link href="/orders">
                    <button className="w-full flex items-center gap-3 py-3 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" data-testid="link-my-orders">
                      <Package className="h-4 w-4" />
                      My Orders
                    </button>
                  </Link>
                  {user?.publicMetadata?.role === "admin" && (
                    <Link href="/admin">
                      <button className="w-full flex items-center gap-3 py-3 px-4 text-sm text-primary hover:bg-muted transition-colors" data-testid="link-admin-dashboard">
                        Admin Dashboard
                      </button>
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="w-full flex items-center gap-3 py-3 px-4 text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                    data-testid="button-sign-out"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-serif text-xl mb-6">Recent Orders</h3>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="bg-card border border-border p-10 text-center">
                  <Package className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-6">You have not placed any orders yet.</p>
                  <Link href="/shop">
                    <Button className="rounded-none px-8 py-4 tracking-widest uppercase text-xs">Shop Now</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-0">
                  {orders.slice(0, 5).map((order, idx) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <div
                        key={order.id}
                        className={`flex justify-between items-center py-5 ${idx < Math.min(orders.length, 5) - 1 ? "border-b border-border" : ""}`}
                        data-testid={`account-order-${order.id}`}
                      >
                        <div>
                          <p className="text-sm font-medium">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt).toLocaleDateString("en-NG")} · ₦{order.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-xs ${status.color}`}>{status.label}</span>
                          <Link href={`/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="rounded-none text-xs tracking-widest uppercase">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {orders.length > 5 && (
                    <div className="pt-4">
                      <Link href="/orders">
                        <Button variant="outline" className="rounded-none text-xs tracking-widest uppercase border-border">
                          View All Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Show>
    </Layout>
  );
}
