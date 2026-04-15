import { Link } from "wouter";
import { QrCode, ChefHat, LayoutDashboard, CheckCircle, Clock, Smartphone, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-primary" />
            <span className="font-serif text-xl font-semibold text-foreground">TableOrder</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/kitchen">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-3 py-1.5">Kitchen</span>
            </Link>
            <Link href="/admin">
              <span className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity cursor-pointer font-medium">Admin Panel</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-900/20">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(27 90% 45%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                <QrCode className="w-4 h-4" />
                QR Code Ordering System
              </div>
              <h1 className="font-serif text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Dining Reimagined,<br />
                <span className="text-primary">Table by Table</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
                Customers scan a QR code at their table, browse your full menu, place orders, and track their food — all from their own device. No waiting, no errors, no friction.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/menu/1">
                  <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-md">
                    <Smartphone className="w-4 h-4" />
                    Try Customer View
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
                <Link href="/admin">
                  <span className="inline-flex items-center gap-2 border border-border bg-card text-foreground px-6 py-3 rounded-xl font-medium hover:bg-accent transition-colors cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin Dashboard
                  </span>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Table 4 — Order #128</div>
                    <div className="text-xs text-muted-foreground">Placed 8 minutes ago</div>
                  </div>
                  <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">Preparing</span>
                </div>
                <div className="space-y-2">
                  {[
                    { name: "Butter Chicken", qty: 2, price: "35.98" },
                    { name: "Garlic Naan", qty: 3, price: "11.97" },
                    { name: "Mango Lassi", qty: 2, price: "9.98" },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-muted rounded text-xs flex items-center justify-center text-muted-foreground font-medium">{item.qty}</span>
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">${item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total (incl. GST)</span>
                  <span className="font-semibold text-foreground">$60.45</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {["Pending", "Received", "Preparing", "Ready"].map((s, i) => (
                    <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= 2 ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-secondary/10 border border-secondary/30 rounded-xl p-3 text-sm text-secondary font-medium shadow-lg">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Order confirmed instantly
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Three steps from scan to service. No app download, no login, no waiting.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <QrCode className="w-7 h-7 text-primary" />,
                step: "01",
                title: "Scan the QR Code",
                desc: "Each table has a unique QR code. Customers scan it with their phone camera — no app needed. The menu loads instantly.",
              },
              {
                icon: <Smartphone className="w-7 h-7 text-primary" />,
                step: "02",
                title: "Browse & Order",
                desc: "Browse the full menu with categories, prices, and dietary tags. Add items to cart, adjust quantities, and place the order directly.",
              },
              {
                icon: <Clock className="w-7 h-7 text-primary" />,
                step: "03",
                title: "Track & Receive",
                desc: "Watch the order status update in real time — from kitchen to table. The bill is always ready when you are.",
              },
            ].map((step) => (
              <div key={step.step} className="relative bg-card border border-border rounded-2xl p-8 hover:shadow-md transition-shadow">
                <div className="absolute top-6 right-6 text-5xl font-bold text-muted/30 font-serif">{step.step}</div>
                <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl font-bold text-foreground mb-4">Built for Everyone</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">One platform for customers, kitchen staff, and restaurant owners.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "For Customers",
                href: "/menu/1",
                color: "from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20",
                border: "border-orange-200 dark:border-orange-800",
                badge: "Customer View",
                badgeColor: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
                features: ["Contactless QR ordering", "Real-time cart", "Live order tracking", "Instant bill view"],
              },
              {
                title: "For Kitchen",
                href: "/kitchen",
                color: "from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20",
                border: "border-red-200 dark:border-red-800",
                badge: "Kitchen Dashboard",
                badgeColor: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300",
                features: ["Live order queue", "One-click status updates", "Priority by wait time", "Auto-refresh every 5s"],
              },
              {
                title: "For Admins",
                href: "/admin",
                color: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20",
                border: "border-green-200 dark:border-green-800",
                badge: "Admin Panel",
                badgeColor: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
                features: ["Revenue analytics", "Menu management", "QR code generation", "Table status overview"],
              },
            ].map((card) => (
              <Link key={card.title} href={card.href}>
                <div className={`bg-gradient-to-br ${card.color} border ${card.border} rounded-2xl p-8 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 h-full`}>
                  <div className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-5 ${card.badgeColor}`}>{card.badge}</div>
                  <h3 className="font-serif text-2xl font-bold text-foreground mb-5">{card.title}</h3>
                  <ul className="space-y-2.5">
                    {card.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Open <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold text-foreground">TableOrder</span>
          </div>
          <p className="text-sm text-muted-foreground">Smart Restaurant Management System — QR Code Based</p>
        </div>
      </footer>
    </div>
  );
}
