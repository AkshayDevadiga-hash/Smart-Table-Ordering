import { useParams, Link } from "wouter";
import { getGetOrderQueryKey, useGetOrder } from "@workspace/api-client-react";
import { CheckCircle, Clock, ChefHat, Truck, Home, Loader2 } from "lucide-react";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: <Clock className="w-5 h-5" />, desc: "Your order is being processed" },
  { key: "received", label: "Order Received", icon: <CheckCircle className="w-5 h-5" />, desc: "Kitchen has received your order" },
  { key: "preparing", label: "Preparing", icon: <ChefHat className="w-5 h-5" />, desc: "Your food is being prepared" },
  { key: "ready", label: "Ready", icon: <CheckCircle className="w-5 h-5" />, desc: "Your order is ready!" },
  { key: "delivered", label: "Delivered", icon: <Truck className="w-5 h-5" />, desc: "Enjoy your meal!" },
];

export default function OrderTrackingPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = parseInt(params.orderId ?? "0", 10);

  const { data: order, isLoading } = useGetOrder(orderId, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId),
      refetchInterval: 5000,
    },
  });

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order?.status);
  const isComplete = order?.status === "delivered" || order?.status === "completed";
  const isCancelled = order?.status === "cancelled";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find this order.</p>
          <Link href="/"><span className="text-primary hover:underline cursor-pointer">Go Home</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-serif font-bold text-foreground">Order #{order.id}</div>
            <div className="text-xs text-muted-foreground">Table {order.tableNumber}</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Status Card */}
        {isCancelled ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">Cancelled</div>
            <h2 className="font-serif text-xl font-bold text-destructive mb-1">Order Cancelled</h2>
            <p className="text-muted-foreground text-sm">Please speak with a staff member for assistance.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isComplete ? "bg-secondary/20" : "bg-primary/10"}`}>
                {isComplete
                  ? <CheckCircle className="w-8 h-8 text-secondary" />
                  : <Loader2 className="w-8 h-8 text-primary animate-spin" />}
              </div>
              <h2 className="font-serif text-xl font-bold text-foreground">
                {isComplete ? "Enjoy your meal!" : STATUS_STEPS[Math.max(0, currentStepIndex)]?.desc}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isComplete ? "Thank you for dining with us." : "Updates every few seconds automatically"}
              </p>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {STATUS_STEPS.map((step, i) => {
                const isDone = currentStepIndex >= i;
                const isCurrent = currentStepIndex === i;
                return (
                  <div key={step.key} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrent ? "bg-primary/5 border border-primary/20" : isDone ? "opacity-70" : "opacity-30"}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</div>
                      {isCurrent && <div className="text-xs text-muted-foreground">{step.desc}</div>}
                    </div>
                    {isDone && !isCurrent && <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-serif text-lg font-bold text-foreground mb-4">Order Summary</h3>
          <div className="space-y-3 mb-4">
            {order.items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-6 h-6 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground font-medium flex-shrink-0 mt-0.5">{item.quantity}</span>
                  <div>
                    <div className="font-medium text-foreground">{item.menuItemName}</div>
                    {item.specialInstructions && <div className="text-xs text-muted-foreground mt-0.5">{item.specialInstructions}</div>}
                  </div>
                </div>
                <span className="text-muted-foreground whitespace-nowrap">${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST (5%)</span>
              <span>${parseFloat(order.tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground text-base pt-1.5 border-t border-border">
              <span>Total</span>
              <span>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Back to menu */}
        <Link href={`/menu/${order.tableId}`}>
          <button className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-border bg-card rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
            <Home className="w-4 h-4" />
            Order More Items
          </button>
        </Link>
      </div>
    </div>
  );
}
