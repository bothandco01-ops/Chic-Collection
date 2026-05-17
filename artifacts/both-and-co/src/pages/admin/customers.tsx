import { useState, useMemo } from "react";
import { useListAdminCustomers, getListAdminCustomersQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { AdminShell } from "@/components/admin-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/react";
import { isUserAdmin } from "@/lib/admin";
import { Mail, Phone, Search, Users } from "lucide-react";

export default function AdminCustomers() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const [q, setQ] = useState("");

  const { data: customers, isLoading } = useListAdminCustomers({
    query: { queryKey: getListAdminCustomersQueryKey(), enabled: isAdmin },
  });

  const filtered = useMemo(() => {
    if (!customers) return [];
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => (c.email + " " + (c.name || "") + " " + (c.phone || "")).toLowerCase().includes(s));
  }, [customers, q]);

  if (!isLoaded) {
    return <AdminShell><div className="max-w-6xl mx-auto px-4 py-16"><Skeleton className="h-10 w-48" /></div></AdminShell>;
  }
  if (!user) return <Redirect to="/sign-in" />;
  if (!isAdmin) {
    return <AdminShell><div className="max-w-lg mx-auto px-4 py-32 text-center"><h2 className="font-serif italic text-3xl mb-4">Admin Access Required</h2></div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="mb-8">
          <p className="text-xs tracking-[0.4em] uppercase text-primary mb-2">Admin</p>
          <h1 className="font-serif italic text-3xl md:text-5xl">Customers</h1>
          <div className="h-px w-16 bg-primary mt-3" />
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, phone"
            className="rounded-none border-border bg-card pl-10"
            data-testid="input-customer-search"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border p-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{q ? "No customers match your search." : "No customers yet. They'll appear here after their first order."}</p>
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-card border border-border overflow-hidden">
              <table className="w-full text-sm" data-testid="table-customers">
                <thead>
                  <tr className="border-b border-border">
                    {["Customer", "Contact", "Orders", "Total Spent", "Last Order"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, idx) => (
                    <tr key={c.email} className={`${idx < filtered.length - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}>
                      <td className="px-5 py-4">
                        <div className="font-medium">{c.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground text-sm">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="hover:text-primary inline-flex items-center gap-2"><Phone className="h-3 w-3" />{c.phone}</a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-4 font-medium">{c.totalOrders}</td>
                      <td className="px-5 py-4 font-medium text-primary">₦{c.totalSpent.toLocaleString()}</td>
                      <td className="px-5 py-4 text-muted-foreground text-sm">{c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("en-NG") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((c) => (
                <div key={c.email} className="bg-card border border-border p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{c.name || "—"}</p>
                      <a href={`mailto:${c.email}`} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 mt-1"><Mail className="h-3 w-3" />{c.email}</a>
                    </div>
                    <p className="text-primary font-medium text-sm">₦{c.totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>{c.totalOrders} order{c.totalOrders === 1 ? "" : "s"}</span>
                    {c.phone && <a href={`tel:${c.phone}`} className="hover:text-primary">{c.phone}</a>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
