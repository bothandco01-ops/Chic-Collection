import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminCoupons,
  getListAdminCouponsQueryKey,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  Coupon,
} from "@workspace/api-client-react";
import { AdminShell } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { Plus, Pencil, Trash2, Check, X, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUserAdmin } from "@/lib/admin";

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "percentage" | "fixed",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
};

export default function AdminDiscounts() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: coupons, isLoading } = useListAdminCoupons({
    query: { queryKey: getListAdminCouponsQueryKey(), enabled: isAdmin },
  });

  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const refetch = () => queryClient.invalidateQueries({ queryKey: getListAdminCouponsQueryKey() });

  if (!isLoaded) {
    return <AdminShell><div className="max-w-4xl mx-auto px-4 py-16"><Skeleton className="h-10 w-64 mb-6" /><Skeleton className="h-64 w-full" /></div></AdminShell>;
  }
  if (!user) return <Redirect to="/sign-in" />;
  if (!isAdmin) {
    return <AdminShell><div className="max-w-lg mx-auto px-4 py-32 text-center"><h2 className="font-serif italic text-3xl mb-4">Access Denied</h2></div></AdminShell>;
  }

  const handleAdd = () => {
    if (!form.code || !form.value) {
      toast({ title: "Code and discount value are required", variant: "destructive" });
      return;
    }
    createCoupon.mutate(
      {
        data: {
          code: form.code,
          type: form.type,
          value: Number(form.value),
          ...(form.minOrderAmount ? { minOrderAmount: Number(form.minOrderAmount) } : {}),
          ...(form.maxUses ? { maxUses: Number(form.maxUses) } : {}),
          ...(form.expiresAt ? { expiresAt: form.expiresAt } : {}),
          isActive: true,
        },
      },
      {
        onSuccess: () => {
          refetch();
          setForm(EMPTY_FORM);
          setShowAdd(false);
          toast({ title: "Coupon created" });
        },
        onError: (err: any) => {
          toast({ title: err?.message || "Failed to create coupon", variant: "destructive" });
        },
      }
    );
  };

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setEditForm({
      code: c.code,
      type: c.type as "percentage" | "fixed",
      value: String(c.value),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : "",
      maxUses: c.maxUses ? String(c.maxUses) : "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateCoupon.mutate(
      {
        id: editingId,
        data: {
          code: editForm.code,
          type: editForm.type,
          value: Number(editForm.value),
          minOrderAmount: editForm.minOrderAmount ? Number(editForm.minOrderAmount) : undefined,
          maxUses: editForm.maxUses ? Number(editForm.maxUses) : undefined,
          expiresAt: editForm.expiresAt || undefined,
        },
      },
      {
        onSuccess: () => { refetch(); setEditingId(null); toast({ title: "Coupon updated" }); },
        onError: () => toast({ title: "Failed to update coupon", variant: "destructive" }),
      }
    );
  };

  const toggleActive = (c: Coupon) => {
    updateCoupon.mutate(
      { id: c.id, data: { isActive: !c.isActive } },
      { onSuccess: refetch }
    );
  };

  const handleDelete = (id: number) => {
    deleteCoupon.mutate(
      { id },
      {
        onSuccess: () => { refetch(); setConfirmDeleteId(null); toast({ title: "Coupon deleted" }); },
        onError: () => toast({ title: "Failed to delete coupon", variant: "destructive" }),
      }
    );
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );

  const TypeSelect = ({ value, onChange }: { value: string; onChange: (v: "percentage" | "fixed") => void }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as "percentage" | "fixed")}
      className="w-full bg-background border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-primary"
    >
      <option value="percentage">Percentage (%)</option>
      <option value="fixed">Fixed Amount (₦)</option>
    </select>
  );

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-1">Admin</p>
            <h1 className="font-serif italic text-3xl md:text-4xl">Discounts & Coupons</h1>
          </div>
          {!showAdd && (
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-primary text-primary-foreground rounded-none text-xs tracking-widest uppercase"
            >
              <Plus className="h-4 w-4 mr-2" /> New Coupon
            </Button>
          )}
        </div>

        <div className="bg-card border border-border p-5 mb-6">
          <div className="flex items-start gap-3">
            <Tag className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">How coupons work</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Customers enter the coupon code at checkout. Percentage coupons reduce the subtotal by that percent. Fixed coupons deduct a set naira amount. You can set minimum order requirements and usage limits.
              </p>
            </div>
          </div>
        </div>

        {showAdd && (
          <div className="bg-card border border-border p-6 mb-6">
            <h3 className="font-serif text-lg mb-5">New Coupon</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="Coupon Code">
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER20"
                  className="rounded-none border-border bg-background uppercase"
                />
              </Field>
              <Field label="Discount Type">
                <TypeSelect value={form.type} onChange={(v) => setForm((f) => ({ ...f, type: v }))} />
              </Field>
              <Field label={form.type === "percentage" ? "Discount %" : "Discount Amount (₦)"}>
                <Input
                  type="number"
                  min={1}
                  max={form.type === "percentage" ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder={form.type === "percentage" ? "e.g. 20" : "e.g. 5000"}
                  className="rounded-none border-border bg-background"
                />
              </Field>
              <Field label="Min Order Amount (₦) — optional">
                <Input
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                  placeholder="e.g. 30000"
                  className="rounded-none border-border bg-background"
                />
              </Field>
              <Field label="Max Uses — optional">
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  placeholder="Unlimited if blank"
                  className="rounded-none border-border bg-background"
                />
              </Field>
              <Field label="Expiry Date — optional">
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className="rounded-none border-border bg-background"
                />
              </Field>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                disabled={createCoupon.isPending}
                className="bg-primary text-primary-foreground rounded-none text-xs tracking-widest uppercase"
              >
                <Plus className="h-4 w-4 mr-1" />
                {createCoupon.isPending ? "Creating..." : "Create Coupon"}
              </Button>
              <Button variant="outline" onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }} className="rounded-none">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : !coupons || coupons.length === 0 ? (
          <div className="bg-card border border-dashed border-border p-16 text-center">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No coupons yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first coupon above.</p>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Code", "Type", "Discount", "Min Order", "Uses", "Expires", "Active", ""].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs tracking-widest uppercase text-muted-foreground font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon, idx) => (
                    <tr
                      key={coupon.id}
                      className={`${idx < coupons.length - 1 ? "border-b border-border" : ""} hover:bg-muted/10`}
                    >
                      {editingId === coupon.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={editForm.code}
                              onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                              className="rounded-none border-border bg-background h-8 text-sm uppercase w-28"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <TypeSelect value={editForm.type} onChange={(v) => setEditForm((f) => ({ ...f, type: v }))} />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={editForm.value}
                              onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))}
                              className="rounded-none border-border bg-background h-8 text-sm w-20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={editForm.minOrderAmount}
                              onChange={(e) => setEditForm((f) => ({ ...f, minOrderAmount: e.target.value }))}
                              placeholder="None"
                              className="rounded-none border-border bg-background h-8 text-sm w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={editForm.maxUses}
                              onChange={(e) => setEditForm((f) => ({ ...f, maxUses: e.target.value }))}
                              placeholder="Unlimited"
                              className="rounded-none border-border bg-background h-8 text-sm w-24"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="date"
                              value={editForm.expiresAt}
                              onChange={(e) => setEditForm((f) => ({ ...f, expiresAt: e.target.value }))}
                              className="rounded-none border-border bg-background h-8 text-sm w-32"
                            />
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">—</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={saveEdit} className="p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors" title="Save">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-muted transition-colors" title="Cancel">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4">
                            <span className="font-mono font-semibold tracking-wider text-primary">{coupon.code}</span>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground text-xs uppercase tracking-wide">
                            {coupon.type === "percentage" ? "%" : "Fixed ₦"}
                          </td>
                          <td className="px-4 py-4 font-medium">
                            {coupon.type === "percentage" ? `${coupon.value}%` : `₦${coupon.value.toLocaleString()}`}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground text-xs">
                            {coupon.minOrderAmount ? `₦${coupon.minOrderAmount.toLocaleString()}` : <span className="italic">None</span>}
                          </td>
                          <td className="px-4 py-4 text-xs">
                            <span className="text-muted-foreground">{coupon.usedCount}</span>
                            {coupon.maxUses !== null && (
                              <span className="text-muted-foreground"> / {coupon.maxUses}</span>
                            )}
                            {coupon.maxUses === null && <span className="text-muted-foreground"> / unlimited</span>}
                          </td>
                          <td className="px-4 py-4 text-xs text-muted-foreground">
                            {coupon.expiresAt
                              ? new Date(coupon.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                              : <span className="italic">Never</span>}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => toggleActive(coupon)}
                              className="text-muted-foreground hover:text-primary transition-colors"
                              title={coupon.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                            >
                              {coupon.isActive
                                ? <ToggleRight className="h-6 w-6 text-primary" />
                                : <ToggleLeft className="h-6 w-6" />}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            {confirmDeleteId === coupon.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Delete?</span>
                                <button onClick={() => handleDelete(coupon.id)} className="text-xs text-destructive hover:underline">Yes</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-muted-foreground hover:underline">No</button>
                              </div>
                            ) : (
                              <div className="flex gap-1">
                                <button onClick={() => startEdit(coupon)} className="p-1.5 hover:bg-muted transition-colors" title="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setConfirmDeleteId(coupon.id)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors" title="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
