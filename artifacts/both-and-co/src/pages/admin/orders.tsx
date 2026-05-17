import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminOrders,
  getListAdminOrdersQueryKey,
  useUpdateOrderStatus,
  OrderStatusUpdateStatus,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { ChevronLeft, Eye, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusOptions = ["pending", "payment_uploaded", "confirmed", "shipped", "delivered", "cancelled"];
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Payment", color: "text-yellow-400 border-yellow-800" },
  payment_uploaded: { label: "Payment Uploaded", color: "text-blue-400 border-blue-800" },
  confirmed: { label: "Confirmed", color: "text-green-400 border-green-800" },
  shipped: { label: "Shipped", color: "text-purple-400 border-purple-800" },
  delivered: { label: "Delivered", color: "text-primary border-primary/40" },
  cancelled: { label: "Cancelled", color: "text-destructive border-destructive/40" },
};

export default function AdminOrders() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingProof, setViewingProof] = useState<string | null>(null);

  const { data: orders, isLoading } = useListAdminOrders(
    statusFilter !== "all" ? { status: statusFilter } : {},
    {
      query: {
        queryKey: getListAdminOrdersQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}),
        enabled: isAdmin,
      },
    }
  );

  const updateStatus = useUpdateOrderStatus();

  const handleStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate(
      { id: orderId, data: { status: status as OrderStatusUpdateStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminOrdersQueryKey() });
          toast({ title: `Order #${orderId} updated to ${statusConfig[status]?.label}` });
        },
        onError: () => {
          toast({ title: "Failed to update order status", variant: "destructive" });
        },
      }
    );
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <h2 className="font-serif italic text-3xl mb-4">Access Denied</h2>
          <Link href="/"><Button className="rounded-none">Return Home</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {viewingProof && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setViewingProof(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-primary" onClick={() => setViewingProof(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={viewingProof} alt="Payment proof" className="max-w-full max-h-[85vh] object-contain" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/admin">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-1">Admin</p>
            <h1 className="font-serif italic text-4xl">Orders</h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {["all", ...statusOptions].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors border ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-foreground"
              }`}
              data-testid={`filter-${s}`}
            >
              {s === "all" ? "All Orders" : (statusConfig[s]?.label || s)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="bg-card border border-border p-16 text-center text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-admin-orders">
                <thead>
                  <tr className="border-b border-border">
                    {["Order", "Customer", "Items", "Amount", "Date", "Status", "Proof", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, idx) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <tr
                        key={order.id}
                        className={`${idx < orders.length - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}
                        data-testid={`admin-order-${order.id}`}
                      >
                        <td className="px-5 py-4 font-medium">#{order.id}</td>
                        <td className="px-5 py-4 text-muted-foreground">
                          <div>{order.guestName || "User"}</div>
                          <div className="text-xs">{order.guestEmail || ""}</div>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{order.items?.length || 0}</td>
                        <td className="px-5 py-4 font-medium">₦{order.totalAmount.toLocaleString()}</td>
                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-NG")}
                        </td>
                        <td className={`px-5 py-4 text-xs ${status.color}`}>
                          {status.label}
                        </td>
                        <td className="px-5 py-4">
                          {order.paymentProofUrl ? (
                            <button
                              onClick={() => setViewingProof(order.paymentProofUrl!)}
                              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                              data-testid={`button-view-proof-${order.id}`}
                            >
                              <Eye className="h-3 w-3" /> View
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-card border border-border text-xs px-2 py-1 text-foreground focus:outline-none focus:border-primary"
                            data-testid={`select-status-${order.id}`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
