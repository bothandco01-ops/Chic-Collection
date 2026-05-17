import { useState } from "react";
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
import { Link } from "wouter";
import { ChevronLeft, Plus, Pencil, Trash2, X } from "lucide-react";
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

export default function AdminProducts() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
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

    if (editing) {
      updateProduct.mutate(
        { id: editing.id, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setShowForm(false);
            toast({ title: "Product updated" });
          },
          onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
        }
      );
    } else {
      createProduct.mutate(
        { data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setShowForm(false);
            toast({ title: "Product created" });
          },
          onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Product deleted" });
        },
        onError: () => toast({ title: "Failed to delete product", variant: "destructive" }),
      }
    );
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto px-4 py-32 text-center">
          <h2 className="font-serif italic text-3xl mb-4">Access Denied</h2>
          <Link href="/"><Button className="rounded-none">Return Home</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg p-8 relative my-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
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
                        <select {...field} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-product-category">
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
                    <FormControl><Textarea {...field} rows={3} className="rounded-none border-border bg-background resize-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Image URL</FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-border bg-background" placeholder="https://..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sizes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs tracking-widest uppercase text-muted-foreground">Sizes (comma-separated)</FormLabel>
                    <FormControl><Input {...field} className="rounded-none border-border bg-background" placeholder="36,37,38,39,40" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-6">
                  <FormField control={form.control} name="inStock" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="accent-primary" data-testid="checkbox-in-stock" />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground m-0">In Stock</FormLabel>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input type="checkbox" checked={field.value} onChange={field.onChange} className="accent-primary" data-testid="checkbox-featured" />
                      </FormControl>
                      <FormLabel className="text-sm text-muted-foreground m-0">Featured</FormLabel>
                    </FormItem>
                  )} />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 rounded-none py-5 tracking-widest uppercase text-xs" disabled={createProduct.isPending || updateProduct.isPending} data-testid="button-save-product">
                    {editing ? "Update Product" : "Add Product"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-none border-border">
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
        ) : (
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-products">
                <thead>
                  <tr className="border-b border-border">
                    {["Product", "Category", "Price", "Stock", "Featured", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs tracking-widest uppercase text-muted-foreground font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products?.map((product, idx) => (
                    <tr
                      key={product.id}
                      className={`${idx < (products?.length || 0) - 1 ? "border-b border-border" : ""} hover:bg-muted/20 transition-colors`}
                      data-testid={`product-row-${product.id}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <div className="w-10 h-12 overflow-hidden flex-shrink-0 bg-secondary">
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <span className="font-medium">{product.name}</span>
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
                        {product.featured ? <span className="text-xs text-primary">Featured</span> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-3">
                          <button
                            onClick={() => openEdit(product)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
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
