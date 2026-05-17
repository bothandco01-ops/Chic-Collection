import { ReactNode } from "react";
import { Link } from "wouter";
import { ShoppingBag, Menu, X, User } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Show, useClerk } from "@clerk/react";

export function Layout({ children }: { children: ReactNode }) {
  const { data: cartItems } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  
  const { signOut } = useClerk();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-serif italic font-bold text-xl tracking-wider">BOTH & CO.</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/shop" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Shop</Link>
              <Link href="/about" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">About</Link>
              <Link href="/services" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Services</Link>
              <Link href="/faq" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">FAQ</Link>
              <Link href="/contact" className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Contact</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Show when="signed-in">
              <Link href="/account">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
              <Button variant="ghost" className="hidden md:inline-flex" onClick={() => signOut({ redirectUrl: "/" })}>
                Log out
              </Button>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className="hidden md:inline-flex text-sm font-medium transition-colors hover:text-primary">
                Sign In
              </Link>
            </Show>
            
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-full">
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t border-border py-12 md:py-16">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-serif italic font-bold text-2xl tracking-wider block mb-4">BOTH & CO.</span>
            <p className="text-muted-foreground max-w-sm">
              Luxury Nigerian womenswear accessories. Elevated, sensual, and unapologetically feminine.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shop?category=heels" className="hover:text-foreground transition-colors">Heels</Link></li>
              <li><Link href="/shop?category=glasses" className="hover:text-foreground transition-colors">Glasses</Link></li>
              <li><Link href="/shop" className="hover:text-foreground transition-colors">All Products</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/services" className="hover:text-foreground transition-colors">Services</Link></li>
              <li><Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BOTH & CO. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground transition-colors">Instagram</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
