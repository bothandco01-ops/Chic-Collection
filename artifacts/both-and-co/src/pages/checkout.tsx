import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCart,
  getGetCartQueryKey,
  useCreateOrder,
  useSubmitPaymentProof,
  getListOrdersQueryKey,
  useListDeliveryZones,
  getListDeliveryZonesQueryKey,
  useValidateCoupon,
  Order,
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
import { Copy, CheckCircle, Upload, Printer, Tag, X } from "lucide-react";
import { useSiteSettings } from "@/lib/settings";
import { InvoiceModal } from "@/components/invoice";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(11, "Valid phone number required"),
  address: z.string().min(5, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(1, "Please select your state"),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const sessionId = getSessionId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const settings = useSiteSettings();

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const validateCoupon = useValidateCoupon();

  const { data: cartItems, isLoading } = useGetCart({ query: { queryKey: getGetCartQueryKey() } });
  const { data: deliveryZones } = useListDeliveryZones({ query: { queryKey: getListDeliveryZonesQueryKey(), staleTime: 60_000 } });

  const createOrder = useCreateOrder();
  const submitProof = useSubmitPaymentProof();

  const subtotal = cartItems?.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0) || 0;

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    validateCoupon.mutate(
      { data: { code: couponInput.trim(), orderAmount: subtotal } },
      {
        onSuccess: (result) => {
          setAppliedCoupon(result);
          setCouponInput("");
          setCouponError("");
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.error || err?.message || "Invalid coupon code";
          setCouponError(msg);
        },
      }
    );
  };

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.primaryEmailAddress?.emailAddress || "",
      phone: "", address: "", city: "", state: "", notes: "",
    },
  });

  const selectedState = form.watch("state");

  const deliveryFee = useMemo(() => {
    if (!selectedState || !deliveryZones) return 0;
    const zone = deliveryZones.find((z) => z.state === selectedState && z.isActive);
    return zone?.price ?? 0;
  }, [selectedState, deliveryZones]);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const grandTotal = Math.max(0, subtotal + deliveryFee - discountAmount);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProofFile(reader.result as string);
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
    const shippingAddress = `${data.address}, ${data.city}, ${data.state}`;
    createOrder.mutate({
      data: {
        guestEmail: data.email,
        guestName: data.fullName,
        totalAmount: grandTotal,
        deliveryState: data.state,
        shippingAddress,
        phone: data.phone,
        notes: data.notes,
        sessionId,
        couponCode: appliedCoupon?.code,
        items: orderItems,
      },
    }, {
      onSuccess: (order) => {
        setCompletedOrder(order);
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      },
      onError: () => toast({ title: "Failed to place order. Please try again.", variant: "destructive" }),
    });
  };

  const handleSubmitProof = () => {
    if (!completedOrder || !proofFile) {
      toast({ title: "Please upload your payment proof", variant: "destructive" });
      return;
    }
    setProofUploading(true);
    submitProof.mutate({ id: completedOrder.id, data: { paymentProofUrl: proofFile } }, {
      onSuccess: (updatedOrder) => {
        setCompletedOrder(updatedOrder);
        setOrderComplete(true);
        setProofUploading(false);
      },
      onError: () => {
        setProofUploading(false);
        toast({ title: "Failed to upload proof. Please try again.", variant: "destructive" });
      },
    });
  };

  if (orderComplete && completedOrder) {
    return (
      <Layout>
        {showInvoice && <InvoiceModal order={completedOrder} onClose={() => setShowInvoice(false)} />}
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <CheckCircle className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="font-serif italic text-4xl mb-4">Order Received</h2>
          <p className="text-muted-foreground mb-1">Order {completedOrder.invoiceNumber || `#${completedOrder.id}`}</p>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Thank you for your order. We will verify your payment within 24 hours and notify you via WhatsApp or email once confirmed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setShowInvoice(true)} variant="outline" className="rounded-none px-8 py-5 tracking-widest uppercase text-xs gap-2">
              <Printer className="h-4 w-4" /> View Receipt
            </Button>
            <Button onClick={() => setLocation("/shop")} className="rounded-none px-10 py-5 tracking-widest uppercase text-xs">
              Continue Shopping
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (completedOrder) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12 md:py-16">
          <h1 className="font-serif italic text-3xl md:text-4xl mb-3">Complete Payment</h1>
          <div className="h-px w-16 bg-primary mb-10" />

          <div className="bg-card border border-border p-6 md:p-8 mb-8">
            <h3 className="font-serif text-xl mb-6">Bank Transfer Details</h3>
            <div className="space-y-4">
              {[
                { label: "Bank Name", value: settings.bankName },
                { label: "Account Name", value: settings.accountName },
                { label: "Account Number", value: settings.accountNumber },
                { label: "Subtotal", value: `₦${subtotal.toLocaleString()}` },
                ...(deliveryFee > 0 ? [{ label: "Delivery Fee", value: `₦${deliveryFee.toLocaleString()}` }] : []),
                { label: "Total Amount", value: `₦${grandTotal.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">{label}</p>
                    <p className={`font-medium ${label === "Total Amount" ? "text-xl text-primary" : "text-lg"}`}>{value}</p>
                  </div>
                  <button onClick={() => copyToClipboard(value, label)} className="text-muted-foreground hover:text-primary transition-colors p-2">
                    {copiedField === label ? <CheckCircle className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-background border border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Transfer the exact amount and use <strong className="text-foreground">{completedOrder.invoiceNumber || `#${completedOrder.id}`}</strong> as your reference. Upload your screenshot below.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border p-6 md:p-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl">Upload Payment Proof</h3>
              <span className="text-xs text-primary tracking-widest uppercase">Required</span>
            </div>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              You must upload a screenshot of your bank transfer before your order can be confirmed.
            </p>
            <div
              className={`border-2 border-dashed p-10 text-center cursor-pointer transition-colors relative ${proofFile ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
              onClick={() => document.getElementById("proof-upload")?.click()}
              data-testid="upload-payment-proof"
            >
              <input id="proof-upload" type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              {proofFile ? (
                <div>
                  <img src={proofFile} alt="Payment proof" className="max-h-48 mx-auto object-contain mb-4" />
                  <p className="text-sm text-primary">Screenshot uploaded — click to change</p>
                </div>
              ) : (
                <div>
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-foreground text-sm font-medium">Click to upload your payment screenshot</p>
                  <p className="text-xs text-muted-foreground mt-2">JPG or PNG — this is required to process your order</p>
                </div>
              )}
            </div>
            <Button
              className="w-full mt-6 rounded-none py-5 tracking-widest uppercase text-xs"
              onClick={handleSubmitProof}
              disabled={!proofFile || proofUploading}
              data-testid="button-submit-proof"
            >
              {proofUploading ? "Submitting..." : proofFile ? "Confirm & Submit Payment Proof" : "Upload Screenshot to Continue"}
            </Button>
            {!proofFile && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                The button above will activate once you upload your screenshot.
              </p>
            )}
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
            <div className="space-y-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 md:mb-12">
          <h1 className="font-serif italic text-4xl md:text-5xl mb-3">Checkout</h1>
          <div className="h-px w-16 bg-primary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left: form */}
          <div>
            <h3 className="font-serif text-xl mb-6 md:mb-8">Shipping Details</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Full Name <span className="text-primary">*</span></FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-border bg-card" data-testid="input-full-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Email Address <span className="text-primary">*</span></FormLabel>
                    <FormControl><Input {...field} type="email" className="rounded-none border-border bg-card" data-testid="input-email" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Phone Number <span className="text-primary">*</span></FormLabel>
                    <FormControl><Input {...field} type="tel" placeholder="080XXXXXXXX" className="rounded-none border-border bg-card" data-testid="input-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Street Address <span className="text-primary">*</span></FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. 14 Adeola Odeku Street" className="rounded-none border-border bg-card" data-testid="input-address" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">City / Area <span className="text-primary">*</span></FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. Victoria Island" className="rounded-none border-border bg-card" data-testid="input-city" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">State <span className="text-primary">*</span></FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full bg-card border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-primary h-10"
                          data-testid="select-state"
                        >
                          <option value="">Select state</option>
                          {NIGERIAN_STATES.map((s) => {
                            const zone = deliveryZones?.find((z) => z.state === s && z.isActive);
                            return (
                              <option key={s} value={s}>
                                {s}{zone ? ` — ₦${zone.price.toLocaleString()}` : ""}
                              </option>
                            );
                          })}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Special Instructions / Notes</FormLabel>
                    <FormControl><Textarea {...field} rows={3} placeholder="e.g. preferred delivery time, gift message, special requests..." className="rounded-none border-border bg-card resize-none" data-testid="input-notes" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
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

          {/* Right: summary */}
          <div>
            <h3 className="font-serif text-xl mb-6 md:mb-8">Order Summary</h3>
            <div className="bg-card border border-border p-5 md:p-6">
              <div className="space-y-4 mb-6">
                {cartItems?.map((item) => (
                  <div key={item.id} className="flex gap-4" data-testid={`checkout-item-${item.id}`}>
                    <div className="w-14 h-18 md:w-16 md:h-20 overflow-hidden flex-shrink-0 bg-secondary">
                      {item.product?.imageUrl && <img src={item.product.imageUrl} alt={item.product?.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product?.name}</p>
                      {item.size && <p className="text-xs text-muted-foreground">Size: {item.size}</p>}
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm text-primary mt-1">₦{((item.product?.price || 0) * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="border-t border-border pt-4 mb-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-mono font-semibold text-primary tracking-wider">{appliedCoupon.code}</span>
                      <span className="text-xs text-muted-foreground">
                        — {appliedCoupon.type === "percentage" ? `${appliedCoupon.value}% off` : `₦${appliedCoupon.value.toLocaleString()} off`}
                      </span>
                    </div>
                    <button
                      onClick={() => { setAppliedCoupon(null); setCouponError(""); }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove coupon"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">Coupon Code</label>
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                        placeholder="Enter code"
                        className="rounded-none border-border bg-background text-sm uppercase flex-1"
                        data-testid="input-coupon"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={!couponInput.trim() || validateCoupon.isPending}
                        className="rounded-none text-xs tracking-widest uppercase whitespace-nowrap"
                        data-testid="button-apply-coupon"
                      >
                        {validateCoupon.isPending ? "..." : "Apply"}
                      </Button>
                    </div>
                    {couponError && <p className="text-xs text-destructive mt-1.5">{couponError}</p>}
                  </div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                {selectedState ? (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery ({selectedState})</span>
                    <span className={deliveryFee === 0 ? "text-green-400" : ""}>
                      {deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-sm text-muted-foreground italic">
                    <span>Delivery</span>
                    <span>Select state above</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₦{appliedCoupon.discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-checkout-total">₦{grandTotal.toLocaleString()}</span>
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
