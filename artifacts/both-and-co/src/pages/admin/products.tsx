import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminProducts,
  getListAdminProductsQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  Product,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";
import { Link, Redirect } from "wouter";
import { ChevronLeft, Plus, Pencil, Trash2, X, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const productSchema = z.object({
  name: z.string().min(2, "Name required"),
  description: z.string().optional(),
  price: z.number({ coerce: true }).min(1, "Price required"),
  category: z.enum(["heels", "glasses"]),
  imageUrl: z.string().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
  sizes: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

function ImageUploader({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"upload" | "url">(value?.startsWith("http") ? "url" : "upload");
  const [urlInput, setUrlInput] = useState(value?.startsWith("http") ? value : "");
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const preview = value || undefined;

  return (
    <div className="space-y-3">
      <div className="flex gap-0 border border-border">
        <button
          type="button"
          onClick={() => setTab("upload")}
          className={`flex-1 py-2 text-xs tracking-widest uppercase transition-colors ${tab === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex-1 py-2 text-xs tracking-widest uppercase transition-colors ${tab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Paste URL
        </button>
      </div>

      {tab === "upload" ? (
        <div
          className={`relative border-2 border-dashed transition-colors duration-200 cursor-pointer ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          data-testid="image-upload-zone"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Product preview" className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <p className="text-white text-xs tracking-widest uppercase">Click to replace</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange(""); }}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Click or drag image here</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP accepted</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              onChange(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            data-testid="input-image-url"
          />
          {urlInput && (
            <div className="relative border border-border overflow-hidden h-32">
              <img
                src={urlInput}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const isSignedIn = !!user;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products, isLoading } = useListAdminProducts({
    query: { queryKey: getListAdminProductsQueryKey(), enabled: isAdmin },
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "", description: "", price: 0, category: "heels",
      imageUrl: "", inStock: true, featured: false, sizes: "",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ name: "", description: "", price: 0, category: "heels", imageUrl: "", inStock: true, featured: false, sizes: "" });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    form.reset({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category: product.category as "heels" | "glasses",
      imageUrl: product.imageUrl || "",
      inStock: product.inStock,
      featured: product.featured,
      sizes: product.sizes || "",
    });
    setShowForm(true);
  };

  const onSubmit = (data: ProductForm) => {
    const payload = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category: data.category,
      imageUrl: data.imageUrl,
      inStock: data.inStock ?? true,
      featured: data.featured ?? false,
      sizes: data.sizes,
    };

    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    };

    if (editing) {
      updateProduct.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product updated" }); },
        onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: payload }, {
        onSuccess: () => { invalidate(); setShowForm(false); toast({ title: "Product created" }); },
        onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteProduct.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        toast({ title: "Product deleted" });
      },
      onError: () => toast({ title: "Failed to delete product", variant: "destructive" }),
    });
  };

  if (!isLoaded) {
    return <Layout><div className="max-w-6xl mx-auto px-4 py-16"><Skeleton className="h-10 w-48 mb-10" /></div></Layout>;
  }

  if (!isSignedIn) return <Redirect to="/sign-in" />;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <div className="bg-card border border-border p-10">
            <h2 className="font-serif italic text-3xl mb-4">Admin Access Required</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your account does not have admin privileges. To gain access, a Replit admin must set your Clerk user's <span className="font-mono text-xs bg-muted px-1 py-0.5">publicMetadata.role</span> to <span className="font-mono text-xs bg-muted px-1 py-0.5">"admin"</span> in the Clerk dashboard.
            </p>
            <Link href="/"><Button variant="outline" className="rounded-none border-border">Return Home</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg p-8 relative my-8">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-serif text-xl mb-8">{editing ? "Edit Product" : "Add New Product"}</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Product Name</FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-border bg-background" data-testid="input-product-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Price (₦)</FormLabel>
                      <FormControl><Input {...field} type="number" className="rounded-none border-border bg-background" data-testid="input-product-price" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Category</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary h-10" data-testid="select-product-category">
                          <option value="heels">Heels</option>
                          <option value="glasses">Glasses</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Description</FormLabel>
                    <FormControl><Textarea {...field} rows={2} className="rounded-none border-border bg-background resize-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Product Image</FormLabel>
                    <FormControl>
                      <ImageUploader value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="sizes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Sizes (comma-separated)</FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-border bg-background" placeholder="36,37,38,39,40 or One Size" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex gap-6 pt-1">
                  <FormField control={form.control} name="inStock" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="accent-primary w-4 h-4" data-testid="checkbox-in-stock" />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground m-0 cursor-pointer">In Stock</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="accent-primary w-4 h-4" data-testid="checkbox-featured" />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground m-0 cursor-pointer">Featured on Homepage</FormLabel>
                    </FormItem>
                  )} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    className="flex-1 rounded-none py-5 tracking-widest uppercase text-xs"
                    disabled={createProduct.isPending || updateProduct.isPending}
                    data-testid="button-save-product"
                  >
                    {createProduct.isPending || updateProduct.isPending
                      ? "Saving..."
                      : editing ? "Update Product" : "Add Product"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-none border-border px-6">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <p className="text-xs tracking-[0.4em] uppercase text-primary mb-1">Admin</p>
              <h1 className="font-serif italic text-4xl">Products</h1>
            </div>
          </div>
          <Button onClick={openCreate} className="rounded-none px-6 py-4 tracking-widest uppercase text-xs" data-testid="button-add-product">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="bg-card border border-border p-16 text-center">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-6">No products yet. Add your first product.</p>
            <Button onClick={openCreate} className="rounded-none px-8 tracking-widest uppercase text-xs">
              <Plus className="h-4 w-4 mr-2" /> Add Product
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-products">
                <thead>
                  <tr className="border-b border-border">
                    {["Product", "Category", "Price", "Stock", "Featured", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => (
                    <tr
                      key={product.id}
                      className={`${idx < products.length - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}
                      data-testid={`product-row-${product.id}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 overflow-hidden flex-shrink-0 bg-secondary">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{product.name}</span>
                            {product.sizes && <p className="text-xs text-muted-foreground mt-0.5">{product.sizes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground capitalize">{product.category}</td>
                      <td className="px-5 py-4 font-medium text-primary">₦{product.price.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-1 ${product.inStock ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}>
                          {product.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {product.featured
                          ? <span className="text-xs text-primary">Featured</span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEdit(product)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Edit product"
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete product"
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
