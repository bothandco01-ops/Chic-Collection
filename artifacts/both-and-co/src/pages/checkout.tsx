import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  getGetCartQueryKey,
  useCreateOrder,
  useSubmitPaymentProof,
  getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionId } from "@/lib/session";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/react";
import { Copy, CheckCircle, Upload } from "lucide-react";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(11, "Valid phone number required"),
  address: z.string().min(10, "Full address required"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useUser();

  const [orderId, setOrderId] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: cartItems, isLoading } = useGetCart({
    query: { queryKey: getGetCartQueryKey() },
  });

  const createOrder = useCreateOrder();
  const submitProof = useSubmitPaymentProof();

  const totalAmount = cartItems?.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  ) || 0;

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!cartItems || cartItems.length === 0) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    const orderItems = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product?.price || 0,
      size: item.size || undefined,
    }));

    createOrder.mutate({
      data: {
        guestEmail: data.email,
        guestName: data.fullName,
        totalAmount,
        shippingAddress: data.address,
        phone: data.phone,
        notes: data.notes,
        sessionId,
        items: orderItems,
      },
    }, {
      onSuccess: (order) => {
        setOrderId(order.id);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to place order. Please try again.", variant: "destructive" });
      },
    });
  };

  const handleSubmitProof = () => {
    if (!orderId || !proofFile) {
      toast({ title: "Please upload your payment proof", variant: "destructive" });
      return;
    }
    setProofUploading(true);
    submitProof.mutate({ id: orderId, data: { paymentProofUrl: proofFile } }, {
      onSuccess: () => {
        setOrderComplete(true);
        setProofUploading(false);
      },
      onError: () => {
        setProofUploading(false);
        toast({ title: "Failed to upload proof. Please try again.", variant: "destructive" });
      },
    });
  };

  if (orderComplete) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="font-serif italic text-4xl mb-4">Order Received</h2>
          <p className="text-muted-foreground mb-2">Order #{orderId}</p>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Thank you for your order. We will verify your payment within 24 hours and notify you via WhatsApp or email once confirmed.
          </p>
          <Button
            onClick={() => setLocation("/shop")}
            className="rounded-none px-10 py-5 tracking-widest uppercase text-xs"
          >
            Continue Shopping
          </Button>
        </div>
      </Layout>
    );
  }

  if (orderId) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <h1 className="font-serif italic text-4xl mb-3">Complete Payment</h1>
          <div className="h-px w-16 bg-primary mb-10" />

          <div className="bg-card border border-border p-8 mb-8">
            <h3 className="font-serif text-xl mb-6">Bank Transfer Details</h3>
            <div className="space-y-4">
              {[
                { label: "Bank Name", value: "First Bank Nigeria" },
                { label: "Account Name", value: "BOTH & CO. LIMITED" },
                { label: "Account Number", value: "3012345678" },
                { label: "Amount", value: `₦${totalAmount.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{label}</p>
                    <p className="font-medium text-lg" data-testid={`text-bank-${label.toLowerCase().replace(/ /g, "-")}`}>{value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(value, label)}
                    className="text-muted-foreground hover:text-primary transition-colors p-2"
                    data-testid={`button-copy-${label.toLowerCase().replace(/ /g, "-")}`}
                  >
                    {copiedField === label ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-background border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Please transfer the exact amount above and use your order number <strong className="text-foreground">#{orderId}</strong> as your transfer description. Upload your payment screenshot below after transferring.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border p-8">
            <h3 className="font-serif text-xl mb-6">Upload Payment Proof</h3>
            <div
              className="border-2 border-dashed border-border rounded-none p-10 text-center cursor-pointer hover:border-primary transition-colors relative"
              onClick={() => document.getElementById("proof-upload")?.click()}
              data-testid="upload-payment-proof"
            >
              <input
                id="proof-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              {proofFile ? (
                <div>
                  <img src={proofFile} alt="Payment proof" className="max-h-48 mx-auto object-contain mb-4" />
                  <p className="text-sm text-primary">Image uploaded — click to change</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Click to upload your payment screenshot</p>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG accepted</p>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6 rounded-none py-5 tracking-widest uppercase text-xs"
              onClick={handleSubmitProof}
              disabled={!proofFile || proofUploading}
              data-testid="button-submit-proof"
            >
              {proofUploading ? "Submitting..." : "Submit Payment Proof"}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-20">
          <Skeleton className="h-10 w-48 mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="mb-12">
          <h1 className="font-serif italic text-4xl md:text-5xl mb-3">Checkout</h1>
          <div className="h-px w-16 bg-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h3 className="font-serif text-xl mb-8">Shipping Details</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-none border-border bg-card" data-testid="input-full-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" className="rounded-none border-border bg-card" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="080XXXXXXXX" className="rounded-none border-border bg-card" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Delivery Address</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Street address, city, state" className="rounded-none border-border bg-card resize-none" data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Order Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} className="rounded-none border-border bg-card resize-none" data-testid="input-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full rounded-none py-5 tracking-widest uppercase text-xs"
                  disabled={createOrder.isPending}
                  data-testid="button-place-order"
                >
                  {createOrder.isPending ? "Placing Order..." : "Place Order & Pay by Transfer"}
                </Button>
              </form>
            </Form>
          </div>

          <div>
            <h3 className="font-serif text-xl mb-8">Order Summary</h3>
            <div className="bg-card border border-border p-6">
              <div className="space-y-4 mb-6">
                {cartItems?.map((item) => (
                  <div key={item.id} className="flex gap-4" data-testid={`checkout-item-${item.id}`}>
                    <div className="w-16 h-20 overflow-hidden flex-shrink-0 bg-secondary">
                      {item.product?.imageUrl && (
                        <img src={item.product.imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product?.name}</p>
                      {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm text-primary mt-1">₦{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-lg pt-2">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-6 p-4 border border-border text-xs text-muted-foreground leading-relaxed">
                Payment is by Nigerian bank transfer only. Bank details will be shown after placing your order.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
