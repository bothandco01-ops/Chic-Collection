import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingBag, User, X, MessageCircle, Menu, LogOut } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Show, useClerk, useUser } from "@clerk/react";

const WHATSAPP_NUMBER = "2348001234567";
const WHATSAPP_MESSAGE = "Hello, I have a question about BOTH & CO.";

function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-card border border-border shadow-2xl w-72 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-[#25D366] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-medium text-sm leading-tight">BOTH & CO.</p>
                <p className="text-white/80 text-xs">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-5">
            <div className="bg-muted rounded-sm px-4 py-3 mb-5">
              <p className="text-sm text-foreground leading-relaxed">
                Hi there! Have a question about an order, sizing, or a piece you love? We are here to help.
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs tracking-widest uppercase text-center py-3 transition-colors"
            >
              Start Chat
            </a>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe5d] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        {open ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
      </button>
    </div>
  );
}

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

function MobileMenu({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [location] = useLocation();

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-72 max-w-full h-full bg-background border-l border-border flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <span className="font-serif italic font-bold text-lg tracking-wider">BOTH & CO.</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-8 px-6 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`block py-3 text-sm tracking-widest uppercase border-b border-border/40 transition-colors ${
                location === href ? "text-primary" : "text-foreground hover:text-primary"
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="pt-6 space-y-3">
            {user ? (
              <>
                <Link href="/account" onClick={onClose} className="flex items-center gap-3 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <User className="h-4 w-4" />
                  My Account
                </Link>
                <Link href="/orders" onClick={onClose} className="flex items-center gap-3 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ShoppingBag className="h-4 w-4" />
                  My Orders
                </Link>
                <button
                  onClick={() => { signOut({ redirectUrl: "/" }); onClose(); }}
                  className="flex items-center gap-3 py-3 text-sm text-muted-foreground hover:text-destructive transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={onClose}
                  className="block w-full border border-border py-3 text-xs tracking-widest uppercase text-center hover:border-primary hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={onClose}
                  className="block w-full bg-primary text-primary-foreground py-3 text-xs tracking-widest uppercase text-center hover:bg-primary/90 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { data: cartItems } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const cartCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex gap-6 md:gap-10">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-serif italic font-bold text-xl tracking-wider">BOTH & CO.</span>
            </Link>
            <nav className="hidden md:flex gap-6">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Show when="signed-in">
              <Link href="/account" className="hidden md:flex">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
              <Button variant="ghost" className="hidden md:inline-flex text-sm" onClick={() => signOut({ redirectUrl: "/" })}>
                Sign Out
              </Button>
            </Show>
            <Show when="signed-out">
              <Link href="/sign-in" className="hidden md:inline-flex text-sm font-medium transition-colors hover:text-primary">
                Sign In
              </Link>
              <Link href="/sign-up" className="hidden md:inline-flex">
                <span className="border border-primary text-primary px-4 py-1.5 text-xs tracking-widest uppercase hover:bg-primary hover:text-primary-foreground transition-colors">
                  Create Account
                </span>
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

            <button
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && <MobileMenu onClose={() => setMobileMenuOpen(false)} />}

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
      <WhatsAppWidget />
    </div>
  );
}
