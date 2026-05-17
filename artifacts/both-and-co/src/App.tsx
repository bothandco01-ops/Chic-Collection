import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Shop from "@/pages/shop";
import ProductDetail from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Orders from "@/pages/orders";
import OrderDetail from "@/pages/order-detail";
import About from "@/pages/about";
import ServicesPage from "@/pages/services";
import Faq from "@/pages/faq";
import Contact from "@/pages/contact";
import Account from "@/pages/account";
import AdminDashboard from "@/pages/admin/index";
import AdminOrders from "@/pages/admin/orders";
import AdminProducts from "@/pages/admin/products";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(340 60% 55%)",
    colorForeground: "hsl(30 20% 95%)",
    colorMutedForeground: "hsl(30 10% 70%)",
    colorDanger: "hsl(0 62.8% 30.6%)",
    colorBackground: "hsl(12 8% 10%)",
    colorInput: "hsl(340 30% 25%)",
    colorInputForeground: "hsl(30 20% 95%)",
    colorNeutral: "hsl(340 30% 25%)",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#1f1918] rounded-none border border-[#522c35] w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "font-serif text-[#fdf8f4] text-2xl italic tracking-wide",
    headerSubtitle: "text-[#aa9b96] font-light",
    socialButtonsBlockButtonText: "text-[#fdf8f4] font-medium tracking-wide",
    formFieldLabel: "text-[#fdf8f4] tracking-wide",
    footerActionLink: "text-[#db3e6c] hover:text-[#fdf8f4] transition-colors",
    footerActionText: "text-[#aa9b96]",
    dividerText: "text-[#aa9b96]",
    identityPreviewEditButton: "text-[#db3e6c]",
    formFieldSuccessText: "text-[#db3e6c]",
    alertText: "text-[#fdf8f4]",
    logoBox: "mb-6",
    logoImage: "w-48 h-auto object-contain",
    socialButtonsBlockButton: "border-[#522c35] rounded-none hover:bg-[#2b2524] text-[#fdf8f4]",
    formButtonPrimary: "bg-[#db3e6c] hover:bg-[#c22e5a] text-[#fdf8f4] rounded-none uppercase tracking-widest text-xs py-3",
    formFieldInput: "bg-[#2b2524] border-[#522c35] text-[#fdf8f4] rounded-none focus:ring-[#db3e6c]",
    footerAction: "mt-4",
    dividerLine: "bg-[#522c35]",
    alert: "bg-[#2b2524] border-[#522c35]",
    otpCodeFieldInput: "bg-[#2b2524] border-[#522c35] text-[#fdf8f4] rounded-none focus:ring-[#db3e6c]",
    formFieldRow: "mb-4",
    main: "px-8 py-10",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientLocal = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientLocal.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientLocal]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your BOTH & CO. account",
          },
        },
        signUp: {
          start: {
            title: "Join BOTH & CO.",
            subtitle: "Create your account to start shopping",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/shop" component={Shop} />
            <Route path="/shop/:id" component={ProductDetail} />
            <Route path="/cart" component={Cart} />
            <Route path="/checkout" component={Checkout} />
            <Route path="/orders" component={Orders} />
            <Route path="/orders/:id" component={OrderDetail} />
            <Route path="/about" component={About} />
            <Route path="/services" component={ServicesPage} />
            <Route path="/faq" component={Faq} />
            <Route path="/contact" component={Contact} />
            <Route path="/account" component={Account} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/orders" component={AdminOrders} />
            <Route path="/admin/products" component={AdminProducts} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
