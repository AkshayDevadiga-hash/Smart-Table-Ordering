import { useState } from "react";
import { Link } from "wouter";
import { getGetKitchenActiveOrdersQueryKey, useGetKitchenActiveOrders, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, Clock, CheckCircle, ArrowLeft, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; color: string; nextStatus: string | null; nextLabel: string | null }> = {
  pending: { label: "Pending", color: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200", nextStatus: "received", nextLabel: "Mark Received" },
  received: { label: "Received", color: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200", nextStatus: "preparing", nextLabel: "Start Preparing" },
  preparing: { label: "Preparing", color: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200", nextStatus: "ready", nextLabel: "Mark Ready" },
  ready: { label: "Ready", color: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200", nextStatus: "delivered", nextLabel: "Mark Delivered" },
};

function getElapsedTime(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins === 1) return "1 min ago";
  return `${mins} mins ago`;
}

function getUrgencyClass(createdAt: string) {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins >= 15) return "border-destructive border-2";
  if (mins >= 10) return "border-primary/50";
  return "border-border";
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const { data: orders = [], isLoading } = useGetKitchenActiveOrders({
    query: {
      queryKey: getGetKitchenActiveOrdersQueryKey(),
      refetchInterval: 5000,
    },
  });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetKitchenActiveOrdersQueryKey() });
      },
    },
  });

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdatingIds(prev => new Set([...prev, orderId]));
    try {
      await updateStatus.mutateAsync({ orderId, data: { status: newStatus as any } });
      toast({ title: `Order #${orderId} updated` });
    } catch {
      toast({ title: "Failed to update order", variant: "destructive" });
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }
  };

  const groupedOrders = {
    pending: orders.filter(o => o.status === "pending"),
    received: orders.filter(o => o.status === "received"),
    preparing: orders.filter(o => o.status === "preparing"),
    ready: orders.filter(o => o.status === "ready"),
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><span className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /></span></Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">Kitchen Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              Live — refreshes every 5s
            </div>
            <div className="text-sm font-semibold text-foreground bg-muted px-3 py-1.5 rounded-lg">
              {orders.length} active
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24">
            <CheckCircle className="w-12 h-12 text-secondary mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">All Clear!</h2>
            <p className="text-muted-foreground">No active orders at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {(["pending", "received", "preparing", "ready"] as const).map(status => {
              const config = STATUS_CONFIG[status];
              const statusOrders = groupedOrders[status];
              return (
                <div key={status} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">{config.label}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color}`}>{statusOrders.length}</span>
                  </div>
                  {statusOrders.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                      No orders
                    </div>
                  ) : (
                    statusOrders.map(order => {
                      const isUpdating = updatingIds.has(order.id);
                      return (
                        <div key={order.id} className={`bg-card border rounded-xl p-4 ${getUrgencyClass(order.createdAt)}`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-foreground">Table {order.tableNumber}</div>
                              <div className="text-xs text-muted-foreground">Order #{order.id}</div>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {getElapsedTime(order.createdAt)}
                            </div>
                          </div>

                          <div className="space-y-1.5 mb-4">
                            {order.items.map(item => (
                              <div key={item.id} className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 bg-muted rounded flex items-center justify-center text-xs font-bold text-muted-foreground">{item.quantity}</span>
                                <span className="text-foreground">{item.menuItemName}</span>
                                {item.specialInstructions && (
                                  <span className="text-xs text-primary italic">{item.specialInstructions}</span>
                                )}
                              </div>
                            ))}
                          </div>

                          {order.specialInstructions && (
                            <div className="mb-3 text-xs bg-accent text-accent-foreground p-2 rounded-lg">
                              Note: {order.specialInstructions}
                            </div>
                          )}

                          {config.nextStatus && (
                            <button
                              onClick={() => handleStatusUpdate(order.id, config.nextStatus!)}
                              disabled={isUpdating}
                              className="w-full flex items-center justify-center gap-1.5 bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              {config.nextLabel}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
