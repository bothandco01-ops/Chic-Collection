import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListFaq, getListFaqQueryKey,
  useCreateFaqEntry, useUpdateFaqEntry, useDeleteFaqEntry,
  useListServices, getListServicesQueryKey,
  useCreateService, useUpdateService, useDeleteService,
  useListAdminContent, getListAdminContentQueryKey,
  useUpsertPageContent, getGetPageContentQueryKey,
  FaqEntry, Service,
} from "@workspace/api-client-react";
import { AdminShell } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Redirect } from "wouter";
import { Link } from "wouter";
import { ChevronLeft, Plus, Pencil, Trash2, Check, X, FileText, HelpCircle, Layers, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUserAdmin } from "@/lib/admin";

const TABS = [
  { id: "faq", label: "FAQ", icon: HelpCircle },
  { id: "about", label: "About", icon: BookOpen },
  { id: "services", label: "Services", icon: Layers },
  { id: "policies", label: "Policies", icon: FileText },
];

const POLICY_SLUGS = [
  { slug: "returns-policy", label: "Returns Policy" },
  { slug: "terms-of-service", label: "Terms of Service" },
  { slug: "privacy-policy", label: "Privacy Policy" },
];

const DEFAULT_ABOUT = {
  headline: "Born from the Desire to Stand Out",
  para1: "BOTH & CO. was founded with a singular vision: to bring editorial-quality luxury accessories to Nigerian women who refuse to settle for ordinary.",
  para2: "We believe that a pair of perfectly crafted heels or an oversized pair of glasses is not just an accessory — it is a statement, a mood, an armour. Every piece in our collection is curated with obsessive attention to quality, silhouette, and the feeling it evokes.",
  para3: "We are for the woman who walks into a room and changes its atmosphere. Who dresses for herself first, and the world second.",
  value1Title: "Uncompromising Quality",
  value1Text: "Every piece is hand-selected and inspected. We carry only what we would wear ourselves.",
  value2Title: "Feminine Power",
  value2Text: "We celebrate femininity in all its forms — sensual, strong, quiet, loud. There is no wrong way to be a woman.",
  value3Title: "Nigerian Pride",
  value3Text: "We are building something beautiful for Nigerian women, by people who understand and love this culture deeply.",
};

// ---- FAQ Section ----
function FaqSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: faqs, isLoading } = useListFaq({ query: { queryKey: getListFaqQueryKey() } });
  const createFaq = useCreateFaqEntry();
  const updateFaq = useUpdateFaqEntry();
  const deleteFaq = useDeleteFaqEntry();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const refetch = () => queryClient.invalidateQueries({ queryKey: getListFaqQueryKey() });

  const startEdit = (f: FaqEntry) => { setEditingId(f.id); setEditQ(f.question); setEditA(f.answer); };

  const saveEdit = () => {
    if (!editingId) return;
    updateFaq.mutate({ id: editingId, data: { question: editQ, answer: editA } }, {
      onSuccess: () => { refetch(); setEditingId(null); toast({ title: "FAQ updated" }); },
      onError: () => toast({ title: "Failed to update FAQ", variant: "destructive" }),
    });
  };

  const handleAdd = () => {
    if (!newQ || !newA) { toast({ title: "Question and answer are required", variant: "destructive" }); return; }
    createFaq.mutate({ data: { question: newQ, answer: newA, order: (faqs?.length || 0) } }, {
      onSuccess: () => { refetch(); setNewQ(""); setNewA(""); setShowAdd(false); toast({ title: "FAQ entry added" }); },
      onError: () => toast({ title: "Failed to add FAQ entry", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteFaq.mutate({ id }, {
      onSuccess: () => { refetch(); setConfirmDeleteId(null); toast({ title: "FAQ entry deleted" }); },
      onError: () => toast({ title: "Failed to delete FAQ entry", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {(faqs || []).map((faq) => (
            <div key={faq.id} className="bg-card border border-border p-4">
              {editingId === faq.id ? (
                <div className="space-y-3">
                  <Input value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="Question" className="rounded-none border-border bg-background text-sm" />
                  <Textarea value={editA} onChange={(e) => setEditA(e.target.value)} placeholder="Answer" rows={3} className="rounded-none border-border bg-background text-sm resize-none" />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="rounded-none bg-primary text-primary-foreground text-xs"><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                    <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="rounded-none text-xs"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1">{faq.question}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(faq)} className="p-1.5 hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    {confirmDeleteId === faq.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button onClick={() => handleDelete(faq.id)} className="text-destructive hover:underline">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-muted-foreground hover:underline">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(faq.id)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="bg-card border border-border p-5 space-y-3">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">New FAQ Entry</p>
          <Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question" className="rounded-none border-border bg-background text-sm" data-testid="input-faq-question" />
          <Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Answer" rows={3} className="rounded-none border-border bg-background text-sm resize-none" data-testid="input-faq-answer" />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={createFaq.isPending} className="rounded-none bg-primary text-primary-foreground text-xs tracking-widest uppercase" data-testid="button-add-faq">
              <Plus className="h-3.5 w-3.5 mr-1" /> {createFaq.isPending ? "Adding..." : "Add Entry"}
            </Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-none text-xs"><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors border border-dashed border-border" data-testid="button-show-add-faq">
          <Plus className="h-4 w-4" /> Add FAQ Entry
        </button>
      )}
    </div>
  );
}

// ---- About Section ----
function AboutSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: content } = useListAdminContent({ query: { queryKey: getListAdminContentQueryKey() } });
  const upsert = useUpsertPageContent();

  const existing = content?.find((c) => c.slug === "about");
  const parsed = existing?.body ? (() => { try { return JSON.parse(existing.body); } catch { return DEFAULT_ABOUT; } })() : DEFAULT_ABOUT;

  const [fields, setFields] = useState({ ...DEFAULT_ABOUT, ...parsed });
  useEffect(() => {
    if (existing?.body) {
      try { const p = JSON.parse(existing.body); setFields({ ...DEFAULT_ABOUT, ...p }); } catch { /* ignore */ }
    }
  }, [existing?.body]);

  const set = (k: keyof typeof DEFAULT_ABOUT, v: string) => setFields((f: typeof DEFAULT_ABOUT) => ({ ...f, [k]: v }));

  const handleSave = () => {
    upsert.mutate({ slug: "about", data: { title: "About", body: JSON.stringify(fields) } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminContentQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPageContentQueryKey("about") });
        toast({ title: "About page saved" });
      },
      onError: () => toast({ title: "Failed to save about page", variant: "destructive" }),
    });
  };

  const Field = ({ label, k, rows = 1 }: { label: string; k: keyof typeof DEFAULT_ABOUT; rows?: number }) => (
    <div>
      <label className="text-xs tracking-widest uppercase text-muted-foreground block mb-2">{label}</label>
      {rows === 1 ? (
        <Input value={fields[k]} onChange={(e) => set(k, e.target.value)} className="rounded-none border-border bg-card text-sm" />
      ) : (
        <Textarea value={fields[k]} onChange={(e) => set(k, e.target.value)} rows={rows} className="rounded-none border-border bg-card text-sm resize-none" />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-5 space-y-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">Hero</p>
        <Field label="Main Headline" k="headline" />
      </div>
      <div className="bg-card border border-border p-5 space-y-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">Brand Story Paragraphs</p>
        <Field label="Paragraph 1" k="para1" rows={3} />
        <Field label="Paragraph 2" k="para2" rows={3} />
        <Field label="Paragraph 3" k="para3" rows={3} />
      </div>
      <div className="bg-card border border-border p-5 space-y-4">
        <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">Our Values</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([["value1Title", "value1Text"], ["value2Title", "value2Text"], ["value3Title", "value3Text"]] as Array<[keyof typeof DEFAULT_ABOUT, keyof typeof DEFAULT_ABOUT]>).map(([tKey, bKey], i) => (
            <div key={i} className="space-y-2 p-3 border border-border">
              <Input value={fields[tKey]} onChange={(e) => set(tKey, e.target.value)} placeholder="Title" className="rounded-none border-border bg-background text-sm font-medium" />
              <Textarea value={fields[bKey]} onChange={(e) => set(bKey, e.target.value)} rows={3} placeholder="Description" className="rounded-none border-border bg-background text-xs resize-none" />
            </div>
          ))}
        </div>
      </div>
      <Button onClick={handleSave} disabled={upsert.isPending} className="rounded-none bg-primary text-primary-foreground px-8 tracking-widest uppercase text-xs" data-testid="button-save-about">
        {upsert.isPending ? "Saving..." : "Save About Page"}
      </Button>
    </div>
  );
}

// ---- Services Section ----
function ServicesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: services, isLoading } = useListServices({ query: { queryKey: getListServicesQueryKey() } });
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const refetch = () => queryClient.invalidateQueries({ queryKey: getListServicesQueryKey() });

  const startEdit = (s: Service) => { setEditingId(s.id); setEditTitle(s.title); setEditDesc(s.description); setEditIcon(s.icon || ""); };

  const saveEdit = () => {
    if (!editingId) return;
    updateService.mutate({ id: editingId, data: { title: editTitle, description: editDesc, icon: editIcon || undefined } }, {
      onSuccess: () => { refetch(); setEditingId(null); toast({ title: "Service updated" }); },
      onError: () => toast({ title: "Failed to update service", variant: "destructive" }),
    });
  };

  const handleAdd = () => {
    if (!newTitle || !newDesc) { toast({ title: "Title and description required", variant: "destructive" }); return; }
    createService.mutate({ data: { title: newTitle, description: newDesc, icon: newIcon || undefined } }, {
      onSuccess: () => { refetch(); setNewTitle(""); setNewDesc(""); setNewIcon(""); setShowAdd(false); toast({ title: "Service added" }); },
      onError: () => toast({ title: "Failed to add service", variant: "destructive" }),
    });
  };

  const handleDelete = (id: number) => {
    deleteService.mutate({ id }, {
      onSuccess: () => { refetch(); setConfirmDeleteId(null); toast({ title: "Service deleted" }); },
      onError: () => toast({ title: "Failed to delete service", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {(services || []).map((s) => (
            <div key={s.id} className="bg-card border border-border p-4">
              {editingId === s.id ? (
                <div className="space-y-3">
                  <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Service title" className="rounded-none border-border bg-background text-sm" />
                  <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description" rows={3} className="rounded-none border-border bg-background text-sm resize-none" />
                  <Input value={editIcon} onChange={(e) => setEditIcon(e.target.value)} placeholder="Icon (emoji or text, e.g. scissors)" className="rounded-none border-border bg-background text-sm" />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm" className="rounded-none bg-primary text-primary-foreground text-xs"><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                    <Button onClick={() => setEditingId(null)} size="sm" variant="outline" className="rounded-none text-xs"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-0.5">{s.icon && <span className="mr-2">{s.icon}</span>}{s.title}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{s.description}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => startEdit(s)} className="p-1.5 hover:bg-muted transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    {confirmDeleteId === s.id ? (
                      <div className="flex items-center gap-1 text-xs">
                        <button onClick={() => handleDelete(s.id)} className="text-destructive hover:underline">Yes</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-muted-foreground hover:underline">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(s.id)} className="p-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="bg-card border border-border p-5 space-y-3">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">New Service</p>
          <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Service title" className="rounded-none border-border bg-background text-sm" />
          <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description" rows={3} className="rounded-none border-border bg-background text-sm resize-none" />
          <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} placeholder="Icon (optional)" className="rounded-none border-border bg-background text-sm" />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={createService.isPending} className="rounded-none bg-primary text-primary-foreground text-xs tracking-widest uppercase">
              <Plus className="h-3.5 w-3.5 mr-1" /> {createService.isPending ? "Adding..." : "Add Service"}
            </Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="rounded-none text-xs"><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-primary hover:bg-muted/20 transition-colors border border-dashed border-border">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      )}
    </div>
  );
}

// ---- Policies Section ----
function PoliciesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: content } = useListAdminContent({ query: { queryKey: getListAdminContentQueryKey() } });
  const upsert = useUpsertPageContent();
  const [activePolicy, setActivePolicy] = useState(POLICY_SLUGS[0].slug);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (content) {
      const initial: Record<string, string> = {};
      for (const p of POLICY_SLUGS) {
        const found = content.find((c) => c.slug === p.slug);
        initial[p.slug] = found?.body || "";
      }
      setDrafts(initial);
    }
  }, [content]);

  const handleSave = (slug: string) => {
    const label = POLICY_SLUGS.find((p) => p.slug === slug)?.label || slug;
    upsert.mutate({ slug, data: { title: label, body: drafts[slug] || "" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminContentQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPageContentQueryKey(slug) });
        toast({ title: `${label} saved` });
      },
      onError: () => toast({ title: "Failed to save policy", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {POLICY_SLUGS.map((p) => (
          <button
            key={p.slug}
            onClick={() => setActivePolicy(p.slug)}
            className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors border ${
              activePolicy === p.slug ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {POLICY_SLUGS.map((p) => activePolicy === p.slug && (
        <div key={p.slug} className="bg-card border border-border p-5 space-y-4">
          <p className="text-xs tracking-widest uppercase text-muted-foreground font-medium">{p.label}</p>
          <p className="text-xs text-muted-foreground">Write your policy below. Use blank lines between paragraphs. This will appear at <strong className="text-foreground">/policy/{p.slug}</strong></p>
          <Textarea
            value={drafts[p.slug] || ""}
            onChange={(e) => setDrafts((d) => ({ ...d, [p.slug]: e.target.value }))}
            rows={16}
            placeholder={`Write your ${p.label} here...`}
            className="rounded-none border-border bg-background text-sm resize-none font-mono"
            data-testid={`textarea-${p.slug}`}
          />
          <Button onClick={() => handleSave(p.slug)} disabled={upsert.isPending} className="rounded-none bg-primary text-primary-foreground px-8 tracking-widest uppercase text-xs" data-testid={`button-save-${p.slug}`}>
            {upsert.isPending ? "Saving..." : `Save ${p.label}`}
          </Button>
        </div>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function AdminContent() {
  const { user, isLoaded } = useUser();
  const isAdmin = isUserAdmin(user);
  const [tab, setTab] = useState("faq");

  if (!isLoaded) {
    return <AdminShell><div className="max-w-4xl mx-auto px-4 py-16"><Skeleton className="h-10 w-48 mb-6" /><Skeleton className="h-64 w-full" /></div></AdminShell>;
  }
  if (!user) return <Redirect to="/sign-in" />;
  if (!isAdmin) {
    return <AdminShell><div className="max-w-lg mx-auto px-4 py-32 text-center"><h2 className="font-serif italic text-3xl mb-4">Access Denied</h2></div></AdminShell>;
  }

  return (
    <AdminShell>
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/admin">
            <button className="text-muted-foreground hover:text-foreground transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          </Link>
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-primary mb-1">Admin</p>
            <h1 className="font-serif italic text-3xl md:text-4xl">Content</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs tracking-widest uppercase whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`content-tab-${id}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "faq" && <FaqSection />}
        {tab === "about" && <AboutSection />}
        {tab === "services" && <ServicesSection />}
        {tab === "policies" && <PoliciesSection />}
      </div>
    </AdminShell>
  );
}
