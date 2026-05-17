import { useRef } from "react";
import { Order, useGetPageContent, getGetPageContentQueryKey } from "@workspace/api-client-react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatInvoiceNumber(id: number, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  return `BC-${year}-${id.toString().padStart(5, "0")}`;
}

interface ReceiptTemplate {
  tagline: string;
  address: string;
  footerMessage: string;
  footerSubtext: string;
}

const RECEIPT_DEFAULTS: ReceiptTemplate = {
  tagline: "Luxury Nigerian Womenswear Accessories",
  address: "Lagos, Nigeria",
  footerMessage: "Thank you for shopping with BOTH & CO.",
  footerSubtext: "For enquiries, please contact us via WhatsApp.",
};

function parseReceiptTemplate(body: string | undefined): ReceiptTemplate {
  if (!body) return RECEIPT_DEFAULTS;
  try { return { ...RECEIPT_DEFAULTS, ...JSON.parse(body) }; } catch { return RECEIPT_DEFAULTS; }
}

function InvoiceDocument({ order, template }: { order: Order; template: ReceiptTemplate }) {
  const subtotal = (order.items || []).reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = order.deliveryFee ?? 0;
  const total = subtotal + deliveryFee;
  const invoiceNumber = order.invoiceNumber || formatInvoiceNumber(order.id, order.createdAt);

  const statusLabel: Record<string, string> = {
    pending: "Awaiting Payment",
    payment_uploaded: "Payment Uploaded",
    confirmed: "Payment Confirmed",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <div id="invoice-print-area" className="bg-white text-gray-900 p-8 min-h-screen font-sans max-w-3xl mx-auto print:p-6 print:max-w-none">
      {/* Header */}
      <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-gray-200">
        <div>
          <div className="font-serif italic font-bold text-3xl text-gray-900 tracking-wider mb-1">BOTH &amp; CO.</div>
          <p className="text-gray-500 text-sm">{template.tagline}</p>
          <p className="text-gray-500 text-sm">{template.address}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800 uppercase tracking-widest mb-2">Invoice</div>
          <p className="text-sm text-gray-600 font-mono font-semibold">{invoiceNumber}</p>
          <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* Customer + Status */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-semibold">Billed To</p>
          <p className="font-semibold text-gray-800">{order.guestName || "—"}</p>
          <p className="text-gray-600 text-sm">{order.guestEmail || "—"}</p>
          <p className="text-gray-600 text-sm">{order.phone || "—"}</p>
          {order.shippingAddress && (
            <p className="text-gray-600 text-sm mt-1 leading-relaxed">{order.shippingAddress}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-semibold">Payment Status</p>
          <span className={`inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-sm ${
            order.status === "confirmed" || order.status === "delivered" || order.status === "shipped"
              ? "bg-green-100 text-green-700"
              : order.status === "cancelled"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}>
            {statusLabel[order.status] || order.status}
          </span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold w-1/2">Item</th>
            <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Size</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Qty</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Unit Price</th>
            <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, i) => (
            <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              <td className="px-4 py-3 font-medium text-gray-800">{item.product?.name || `Product #${item.productId}`}</td>
              <td className="px-4 py-3 text-gray-500">{item.size || "—"}</td>
              <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
              <td className="px-4 py-3 text-right text-gray-600">₦{item.price.toLocaleString()}</td>
              <td className="px-4 py-3 text-right font-medium text-gray-800">₦{(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-72 space-y-2 border-t border-gray-200 pt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>₦{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery{order.deliveryState ? ` (${order.deliveryState})` : ""}</span>
            <span>{deliveryFee === 0 ? "Free" : `₦${deliveryFee.toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-300 pt-3 mt-2">
            <span>Total</span>
            <span>₦{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-gray-50 border border-gray-200 p-5 mb-10">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 font-semibold">Payment Method</p>
        <p className="text-sm text-gray-700">Bank Transfer — First Bank Nigeria</p>
        <p className="text-sm text-gray-600">Account: BOTH &amp; CO. LIMITED</p>
        <p className="text-sm text-gray-500 mt-2">Reference: {invoiceNumber}</p>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-semibold">Notes</p>
          <p className="text-sm text-gray-600 leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
        <p className="font-serif italic text-base text-gray-600 mb-1">{template.footerMessage}</p>
        <p>{template.footerSubtext} Invoice #{invoiceNumber}</p>
      </div>
    </div>
  );
}

interface InvoiceModalProps {
  order: Order;
  onClose: () => void;
}

export function InvoiceModal({ order, onClose }: InvoiceModalProps) {
  const printArea = useRef<HTMLDivElement>(null);

  const { data: templateData } = useGetPageContent("receipt-template", {
    query: {
      queryKey: getGetPageContentQueryKey("receipt-template"),
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });
  const template = parseReceiptTemplate(templateData?.body);

  const handlePrint = () => {
    const el = printArea.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${order.invoiceNumber || order.id}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', system-ui, sans-serif; color: #111; background: #fff; }
          @media print { @page { margin: 1cm; } }
        </style>
      </head>
      <body>${el.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto" onClick={onClose}>
      <div className="min-h-full flex items-start justify-center py-8 px-2" onClick={(e) => e.stopPropagation()}>
        {/* Controls */}
        <div className="fixed top-4 right-4 z-10 flex gap-2">
          <Button onClick={handlePrint} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none gap-2 text-xs tracking-widest uppercase">
            <Printer className="h-4 w-4" /> Print / Download PDF
          </Button>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-background/80 hover:bg-background text-foreground border border-border">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={printArea} className="w-full max-w-3xl shadow-2xl mt-10">
          <InvoiceDocument order={order} template={template} />
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;
