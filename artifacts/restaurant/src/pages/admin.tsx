import { Link } from "wouter";
import { getGetAdminStatsQueryKey, useGetAdminStats, getGetRecentOrdersQueryKey, useGetRecentOrders } from "@workspace/api-client-react";
import { ChefHat, TrendingUp, ShoppingBag, Users, UtensilsCrossed, ArrowLeft, BarChart2, BookOpen, QrCode } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200",
  received: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200",
  preparing: "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200",
  ready: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200",
  delivered: "bg-secondary/20 text-secondary",
  completed: "bg-secondary/20 text-secondary",
  cancelled: "bg-muted text-muted-foreground",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function AdminPage() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey(), refetchInterval: 30000 },
  });

  const { data: recentOrders = [], isLoading: ordersLoading } = useGetRecentOrders({
    query: { queryKey: getGetRecentOrdersQueryKey(), refetchInterval: 30000 },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/"><span className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /></span></Link>
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/kitchen">
              <span className="text-sm bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer font-medium">Kitchen View</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            [1,2,3,4].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)
          ) : (
            <>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats?.totalOrdersToday ?? 0}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Orders Today</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>
                <div className="text-2xl font-bold text-foreground">${parseFloat(stats?.totalRevenueToday ?? "0").toFixed(2)}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Revenue Today</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <span className="text-xs text-primary font-medium">{stats?.activeOrders ?? 0} active</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats?.activeOrders ?? 0}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Active Orders</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stats?.totalTables ?? 0} total</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats?.tablesOccupied ?? 0}</div>
                <div className="text-sm text-muted-foreground mt-0.5">Tables Occupied</div>
              </div>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-foreground">Recent Orders</h2>
              <span className="text-xs text-muted-foreground">Last 20 orders</span>
            </div>
            <div className="divide-y divide-border">
              {ordersLoading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted m-4 rounded-lg animate-pulse" />)
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No orders yet</p>
                </div>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-xs font-bold text-accent-foreground">
                        {order.tableNumber}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">Order #{order.id}</div>
                        <div className="text-xs text-muted-foreground">{order.items.length} item{order.items.length !== 1 ? "s" : ""} — {timeAgo(order.createdAt)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-sm text-foreground">${parseFloat(order.total).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Popular Items */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-serif text-base font-bold text-foreground">Popular Items</h2>
              </div>
              <div className="p-5 space-y-3">
                {statsLoading ? (
                  [1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)
                ) : (stats?.popularItems ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                ) : (
                  stats!.popularItems.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary/10 text-primary text-xs font-bold rounded flex items-center justify-center">{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.count}x</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-serif text-base font-bold text-foreground">Management</h2>
              </div>
              <div className="p-3 space-y-1">
                <Link href="/admin/menu">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Menu Management</div>
                      <div className="text-xs text-muted-foreground">Add, edit, and remove items</div>
                    </div>
                  </div>
                </Link>
                <Link href="/admin/tables">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Tables & QR Codes</div>
                      <div className="text-xs text-muted-foreground">View and print QR codes</div>
                    </div>
                  </div>
                </Link>
                <Link href="/kitchen">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-accent transition-colors cursor-pointer">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground">Kitchen Dashboard</div>
                      <div className="text-xs text-muted-foreground">Live order management</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
