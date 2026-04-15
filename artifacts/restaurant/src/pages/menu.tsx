import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { ChefHat, Plus, Minus, ShoppingCart, Leaf, X, Clock } from "lucide-react";
import { useGetTable, useGetMenuCategories, useGetMenuItems, useCreateOrder } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
}

export default function MenuPage() {
  const params = useParams<{ tableId: string }>();
  const tableId = parseInt(params.tableId ?? "1", 10);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);

  const { data: table, isLoading: tableLoading } = useGetTable(tableId);
  const { data: categories, isLoading: catLoading } = useGetMenuCategories();
  const { data: menuItems, isLoading: itemsLoading } = useGetMenuItems();
  const createOrder = useCreateOrder();

  const isLoading = tableLoading || catLoading || itemsLoading;

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.filter(item =>
      item.isAvailable && (activeCategory === null || item.categoryId === activeCategory)
    );
  }, [menuItems, activeCategory]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const tax = cartTotal * 0.05;
  const total = cartTotal + tax;

  const addToCart = (item: { id: number; name: string; price: string; isVeg: boolean }) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) {
        return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { menuItemId: item.id, name: item.name, price: parseFloat(item.price), quantity: 1, isVeg: item.isVeg }];
    });
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.menuItemId !== menuItemId);
    });
  };

  const getQty = (menuItemId: number) => cart.find(c => c.menuItemId === menuItemId)?.quantity ?? 0;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const order = await createOrder.mutateAsync({
        tableId,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
        specialInstructions: specialInstructions || null,
      });
      navigate(`/order/${order.id}`);
    } catch (error) {
      toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
      setIsPlacing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-30">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-8 h-8 bg-muted rounded-lg animate-pulse" />
            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Table Not Found</h2>
          <p className="text-muted-foreground">This QR code may be invalid. Please ask staff for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-serif font-bold text-foreground leading-tight">TableOrder</div>
                <div className="text-xs text-muted-foreground">Table {table.tableNumber}</div>
              </div>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Category tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              All
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {categories?.filter(cat => activeCategory === null || cat.id === activeCategory).map(cat => {
          const catItems = filteredItems.filter(item => item.categoryId === cat.id);
          if (catItems.length === 0) return null;
          return (
            <div key={cat.id} className="mb-8">
              <h2 className="font-serif text-xl font-bold text-foreground mb-1">{cat.name}</h2>
              {cat.description && <p className="text-sm text-muted-foreground mb-4">{cat.description}</p>}
              <div className="space-y-3">
                {catItems.map(item => {
                  const qty = getQty(item.id);
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.isVeg ? (
                            <span className="w-4 h-4 border-2 border-secondary rounded-sm flex items-center justify-center flex-shrink-0">
                              <span className="w-2 h-2 bg-secondary rounded-full" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 border-2 border-destructive rounded-sm flex items-center justify-center flex-shrink-0">
                              <span className="w-2 h-2 bg-destructive rounded-full" />
                            </span>
                          )}
                          <h3 className="font-medium text-foreground text-sm leading-tight">{item.name}</h3>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">${parseFloat(item.price).toFixed(2)}</span>
                          {item.isVeg && (
                            <span className="inline-flex items-center gap-0.5 text-xs text-secondary">
                              <Leaf className="w-3 h-3" />
                              Veg
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 border border-border rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold text-foreground">{qty}</span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Cart Bar */}
      {cartCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-2xl font-semibold flex items-center justify-between shadow-xl hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-lg text-sm">{cartCount}</span>
                <span>View Cart</span>
              </div>
              <span>${total.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-foreground">Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.menuItemId} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{item.name}</div>
                        <div className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.menuItemId)}
                          className="w-7 h-7 border border-border rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => addToCart({ id: item.menuItemId, name: item.name, price: item.price.toString(), isVeg: item.isVeg })}
                          className="w-7 h-7 bg-primary text-primary-foreground rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold text-foreground w-16 text-right">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-border">
                    <textarea
                      value={specialInstructions}
                      onChange={e => setSpecialInstructions(e.target.value)}
                      placeholder="Special instructions (optional)"
                      className="w-full text-sm bg-background border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground resize-none h-20 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-4 border-t border-border space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground text-base pt-1.5 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={placeOrder}
                disabled={cart.length === 0 || isPlacing}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isPlacing ? "Placing Order..." : `Place Order — $${total.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
