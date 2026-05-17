import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, Users, Settings as SettingsIcon, Truck } from "lucide-react";
import { Layout } from "@/components/layout";

const TABS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <Layout>
      <div className="border-b border-border bg-card/40 sticky top-16 z-30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <nav className="flex gap-1 overflow-x-auto scrollbar-none" data-testid="admin-nav">
            {TABS.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href !== "/admin" && location.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${
                    active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`admin-tab-${label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </Layout>
  );
}
