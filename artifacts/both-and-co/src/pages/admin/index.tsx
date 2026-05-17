import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Link, Redirect } from "wouter";
import { AdminShell } from "@/components/admin-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { ShoppingBag, Package, CheckCircle, TrendingUp, Clock, ChevronRight, Info } from "lucide-react";
import { isUserAdmin } from "@/lib/admin";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Payment", color: "text-yellow-400" },
  payment_uploaded: { label: "Payment Uploaded", color: "text-blue-400" },
  confirmed: { label: "Confirmed", color: "text-green-400" },
  shipped: { label: "Shipped", color: "text-purple-400" },
  delivered: { label: "Delivered", color: "text-primary" },
  cancelled: { label: "Cancelled", color: "text-destructive" },
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const isSignedIn = !!user;
  const isAdmin = isUserAdmin(user);

  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey(), enabled: isAdmin },
  });

  if (!isLoaded) {
    return (
      <AdminShell>
        <div className="max-w-6xl mx-auto px-4 py-16">
          <Skeleton className="h-10 w-48 mb-10" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  if (!isAdmin) {
    return (
      <AdminShell>
        <div className="max-w-xl mx-auto px-4 py-32">
          <div className="bg-card border border-border p-10">
            <div className="flex items-start gap-4 mb-6">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-xl mb-2">Admin Access Required</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Your account does not have admin privileges. Contact the site owner to grant you access.
                </p>
              </div>
            </div>

            <div className="border border-border p-5 space-y-4 text-sm">
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">How to grant admin access</p>
              <ol className="space-y-3 text-muted-foreground leading-relaxed list-none">
                <li className="flex gap-3">
                  <span className="text-primary font-medium flex-shrink-0">1.</span>
                  Open your <strong className="text-foreground">Replit project</strong>, click the integrations/secrets panel and open the Clerk dashboard.
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-medium flex-shrink-0">2.</span>
                  Go to <strong className="text-foreground">Users</strong>, find your account, and click it.
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-medium flex-shrink-0">3.</span>
                  Scroll to <strong className="text-foreground">Public metadata</strong> and set it to:
                </li>
              </ol>
              <pre className="bg-background border border-border px-4 py-3 text-xs font-mono text-primary overflow-x-auto">
{`{ "role": "admin" }`}
              </pre>
              <li className="flex gap-3 list-none text-muted-foreground">
                <span className="text-primary font-medium flex-shrink-0">4.</span>
                Save, then sign out and sign back in on this site.
              </li>
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/">
                <button className="border border-border px-5 py-3 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors">
                  Return Home
                </button>
              </Link>
              <Link href="/sign-in">
                <button className="bg-primary text-primary-foreground px-5 py-3 text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors">
                  Sign In Again
                </button>
              </Link>
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-2">Admin</p>
            <h1 className="font-serif italic text-4xl md:text-5xl">Dashboard</h1>
            <div className="h-px w-16 bg-primary mt-3" />
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders">
              <button className="border border-border px-6 py-3 text-xs tracking-widest uppercase hover:border-primary hover:text-primary transition-colors" data-testid="link-admin-orders">
                Manage Orders
              </button>
            </Link>
            <Link href="/admin/products">
              <button className="bg-primary text-primary-foreground px-6 py-3 text-xs tracking-widest uppercase hover:bg-primary/90 transition-colors" data-testid="link-admin-products">
                Manage Products
              </button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: <Package className="h-5 w-5" />, sub: "All time" },
              { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: <Clock className="h-5 w-5" />, sub: "Need attention" },
              { label: "Confirmed", value: stats?.confirmedOrders ?? 0, icon: <CheckCircle className="h-5 w-5" />, sub: "Approved" },
              { label: "Revenue", value: `₦${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: <TrendingUp className="h-5 w-5" />, sub: "Confirmed orders" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border p-6" data-testid={`stat-${stat.label.toLowerCase().replace(/ /g, "-")}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs tracking-widest uppercase text-muted-foreground">{stat.label}</span>
                  <span className="text-primary">{stat.icon}</span>
                </div>
                <p className="font-serif text-2xl md:text-3xl mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-xl">Recent Orders</h3>
            <Link href="/admin/orders">
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="bg-card border border-border overflow-hidden">
              {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <table className="w-full text-sm" data-testid="table-recent-orders">
                  <thead>
                    <tr className="border-b border-border">
                      {["Order", "Customer", "Date", "Amount", "Status"].map((h) => (
                        <th key={h} className={`text-left px-6 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal ${h === "Customer" || h === "Date" ? "hidden md:table-cell" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recentOrders ?? []).map((order, idx) => {
                      const status = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <tr key={order.id} className={`${idx < (stats.recentOrders ?? []).length - 1 ? "border-b border-border" : ""} hover:bg-muted/30 transition-colors`}>
                          <td className="px-6 py-4">
                            <Link href="/admin/orders">
                              <span className="font-medium hover:text-primary transition-colors cursor-pointer">#{order.id}</span>
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{order.guestName || "Registered user"}</td>
                          <td className="px-6 py-4 text-muted-foreground hidden md:table-cell">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                          <td className="px-6 py-4 font-medium">₦{order.totalAmount.toLocaleString()}</td>
                          <td className={`px-6 py-4 text-xs ${status.color}`}>{status.label}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground text-sm">No orders yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
