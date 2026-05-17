import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminDeliveryZones,
  getListAdminDeliveryZonesQueryKey,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  DeliveryZone,
} from "@workspace/api-client-react";
import { AdminShell } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { ChevronLeft, Pencil, Trash2, Plus, Check, X, MapPin, Truck } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { isUserAdmin } from "@/lib/admin";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT (Abuja)", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

export default function AdminDelivery() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editActive, setEditActive] = useState(true);

  const [newState, setNewState] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const { data: zones, isLoading } = useListAdminDeliveryZones({
    query: { queryKey: getListAdminDeliveryZonesQueryKey(), enabled: isAdmin },
  });

  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();

  const refetch = () => queryClient.invalidateQueries({ queryKey: getListAdminDeliveryZonesQueryKey() });

  if (!isLoaded) {
    return <AdminShell><div className="max-w-3xl mx-auto px-4 py-16"><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-64 w-full" /></div></AdminShell>;
  }
  if (!user) return <Redirect to="/sign-in" />;
  if (!isAdmin) {
    return (
      <AdminShell>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <h2 className="font-serif italic text-3xl mb-4">Access Denied</h2>
        </div>
      </AdminShell>
    );
  }

  const startEdit = (z: DeliveryZone) => {
    setEditingId(z.id);
    setEditState(z.state);
    setEditPrice(String(z.price));
    setEditActive(z.isActive);
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateZone.mutate(
      { id: editingId, data: { state: editState, price: Number(editPrice), isActive: editActive } },
      {
        onSuccess: () => { refetch(); setEditingId(null); toast({ title: "Delivery zone updated" }); },
        onError: () => toast({ title: "Failed to update zone", variant: "destructive" }),
      }
    );
  };

  const handleAdd = () => {
    if (!newState || !newPrice) {
      toast({ title: "Please fill in state and price", variant: "destructive" });
      return;
    }
    createZone.mutate(
      { data: { state: newState, price: Number(newPrice), isActive: true } },
      {
        onSuccess: () => {
          refetch();
          setNewState("");
          setNewPrice("");
          setShowAdd(false);
          toast({ title: `Delivery zone added for ${newState}` });
        },
        onError: () => toast({ title: "Failed to add zone", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteZone.mutate(
      { id },
      {
        onSuccess: () => { refetch(); setConfirmDeleteId(null); toast({ title: "Delivery zone removed" }); },
        onError: () => toast({ title: "Failed to delete zone", variant: "destructive" }),
      }
    );
  };

  const existingStates = new Set((zones || []).map((z) => z.state));
  const availableStates = NIGERIAN_STATES.filter((s) => !existingStates.has(s));

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin">
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-1">Admin</p>
            <h1 className="font-serif italic text-3xl md:text-4xl">Delivery Pricing</h1>
          </div>
        </div>

        <div className="bg-card border border-border p-5 mb-6">
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">How delivery pricing works</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set a delivery price per state below. When a customer selects their state at checkout, the matching fee is automatically added to their order total. States not listed here default to free delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Add zone form */}
        <div className="bg-card border border-border mb-6">
          {showAdd ? (
            <div className="p-5">
              <h3 className="font-serif text-lg mb-4">Add Delivery Zone</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">State</label>
                  <select
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full bg-background border border-border text-foreground text-sm px-3 py-2.5 focus:outline-none focus:border-primary"
                    data-testid="select-new-state"
                  >
                    <option value="">Select state...</option>
                    {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">Delivery Fee (₦)</label>
                  <Input
                    type="number"
                    min={0}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="e.g. 3000"
                    className="rounded-none border-border bg-background"
                    data-testid="input-new-price"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleAdd} disabled={createZone.isPending} className="bg-primary text-primary-foreground rounded-none flex-1" data-testid="button-add-zone">
                    <Plus className="h-4 w-4 mr-1" /> {createZone.isPending ? "Adding..." : "Add Zone"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-none">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary hover:bg-muted/30 transition-colors border-dashed border border-border"
              data-testid="button-show-add-zone"
            >
              <Plus className="h-4 w-4" /> Add Delivery Zone
            </button>
          )}
        </div>

        {/* Zones table */}
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : !zones || zones.length === 0 ? (
          <div className="bg-card border border-dashed border-border p-16 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No delivery zones configured yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add your first zone above — all other states will be free.</p>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-delivery-zones">
                <thead>
                  <tr className="border-b border-border">
                    {["State", "Delivery Fee", "Active", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {zones.map((zone, idx) => (
                    <tr key={zone.id} className={`${idx < zones.length - 1 ? "border-b border-border" : ""} hover:bg-muted/10`} data-testid={`zone-row-${zone.id}`}>
                      {editingId === zone.id ? (
                        <>
                          <td className="px-5 py-3">
                            <select
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                              className="bg-background border border-border text-foreground text-sm px-2 py-1.5 focus:outline-none focus:border-primary w-full"
                            >
                              <option value={editState}>{editState}</option>
                              {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground text-sm">₦</span>
                              <Input
                                type="number"
                                min={0}
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="rounded-none border-border bg-background w-28 h-8 text-sm"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <button
                              type="button"
                              onClick={() => setEditActive(!editActive)}
                              className={`relative w-10 h-5 transition-colors ${editActive ? "bg-primary" : "bg-muted"}`}
                            >
                              <div className={`absolute top-0.5 ${editActive ? "left-[22px]" : "left-0.5"} w-4 h-4 bg-white transition-all`} />
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
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
                          <td className="px-5 py-4 font-medium">{zone.state}</td>
                          <td className="px-5 py-4 text-primary font-medium">
                            {zone.price === 0 ? <span className="text-muted-foreground italic">Free</span> : `₦${zone.price.toLocaleString()}`}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => updateZone.mutate({ id: zone.id, data: { isActive: !zone.isActive } }, { onSuccess: refetch })}
                              className={`relative w-10 h-5 transition-colors ${zone.isActive ? "bg-primary" : "bg-muted"}`}
                              title={zone.isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
                            >
                              <div className={`absolute top-0.5 ${zone.isActive ? "left-[22px]" : "left-0.5"} w-4 h-4 bg-white transition-all`} />
                            </button>
                          </td>
                          <td className="px-5 py-4">
                            {confirmDeleteId === zone.id ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Delete?</span>
                                <button onClick={() => handleDelete(zone.id)} className="text-xs text-destructive hover:underline">Yes</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-muted-foreground hover:underline">No</button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => startEdit(zone)} className="p-1.5 hover:bg-muted transition-colors" title="Edit" data-testid={`button-edit-zone-${zone.id}`}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => setConfirmDeleteId(zone.id)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors" title="Delete" data-testid={`button-delete-zone-${zone.id}`}>
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
