import { useState } from "react";
import { Link } from "wouter";
import {
  getGetMenuItemsQueryKey,
  getGetMenuCategoriesQueryKey,
  useGetMenuItems,
  useGetMenuCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, ArrowLeft, Plus, Pencil, Trash2, Leaf, EyeOff, Eye, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuItemForm {
  categoryId: number;
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  isVeg: boolean;
  sortOrder: number;
}

const EMPTY_FORM: MenuItemForm = {
  categoryId: 0,
  name: "",
  description: "",
  price: "",
  isAvailable: true,
  isVeg: false,
  sortOrder: 0,
};

export default function AdminMenuPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuItemForm>(EMPTY_FORM);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { data: categories = [], isLoading: catLoading } = useGetMenuCategories();
  const { data: menuItems = [], isLoading: itemsLoading } = useGetMenuItems();

  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetMenuItemsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMenuCategoriesQueryKey() });
  };

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? 0, sortOrder: menuItems.length + 1 });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (item: typeof menuItems[0]) => {
    setForm({
      categoryId: item.categoryId,
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      isAvailable: item.isAvailable,
      isVeg: item.isVeg,
      sortOrder: item.sortOrder,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, description: form.description || null };
    try {
      if (editingId) {
        await updateItem.mutateAsync({ itemId: editingId, data });
        toast({ title: "Menu item updated" });
      } else {
        await createItem.mutateAsync({ data });
        toast({ title: "Menu item created" });
      }
      invalidate();
      setShowForm(false);
    } catch {
      toast({ title: "Failed to save item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteItem.mutateAsync({ itemId: id });
      toast({ title: "Item deleted" });
      invalidate();
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleAvailability = async (item: typeof menuItems[0]) => {
    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        data: {
          categoryId: item.categoryId,
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          isAvailable: !item.isAvailable,
          isVeg: item.isVeg,
          sortOrder: item.sortOrder,
        },
      });
      invalidate();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const displayCategories = selectedCategory
    ? categories.filter(c => c.id === selectedCategory)
    : categories;

  const isLoading = catLoading || itemsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin"><span className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /></span></Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">Menu Management</span>
            </div>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : (
          displayCategories.map(cat => {
            const catItems = menuItems.filter(item => item.categoryId === cat.id);
            return (
              <div key={cat.id} className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-foreground">{cat.name}</h2>
                    <p className="text-sm text-muted-foreground">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                {catItems.length === 0 ? (
                  <div className="border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                    No items in this category
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catItems.map(item => (
                      <div key={item.id} className={`bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-4 ${!item.isAvailable ? "opacity-60" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.isVeg ? (
                              <span className="w-4 h-4 border-2 border-secondary rounded-sm flex items-center justify-center flex-shrink-0">
                                <span className="w-1.5 h-1.5 bg-secondary rounded-full" />
                              </span>
                            ) : (
                              <span className="w-4 h-4 border-2 border-destructive rounded-sm flex items-center justify-center flex-shrink-0">
                                <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                              </span>
                            )}
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                            {!item.isAvailable && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Unavailable</span>}
                          </div>
                          {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate pl-6">{item.description}</p>}
                        </div>
                        <div className="font-semibold text-sm text-foreground">${parseFloat(item.price).toFixed(2)}</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                          >
                            {item.isAvailable ? <Eye className="w-3.5 h-3.5 text-secondary" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                          <button
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-card border border-border rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
              <h2 className="font-serif text-lg font-bold text-foreground">{editingId ? "Edit Item" : "Add Menu Item"}</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: parseInt(e.target.value, 10) }))}
                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Item name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none h-20"
                  placeholder="Optional description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Sort Order</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value, 10) }))}
                    className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isVeg}
                    onChange={e => setForm(f => ({ ...f, isVeg: e.target.checked }))}
                    className="w-4 h-4 rounded accent-secondary"
                  />
                  <span className="text-sm text-foreground flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-secondary" />Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">Available</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createItem.isPending || updateItem.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
