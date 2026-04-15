import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { getGetTablesQueryKey, useGetTables, useCreateTable } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ChefHat, ArrowLeft, QrCode, Plus, Download, Loader2, Users } from "lucide-react";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

function TableStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "bg-secondary/10 text-secondary",
    occupied: "bg-primary/10 text-primary",
    reserved: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${colors[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function QRCodeCanvas({ url, tableNumber }: { url: string; tableNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 120,
        margin: 2,
        color: { dark: "#1a0f00", light: "#fffff7" },
      });
    }
  }, [url]);

  const download = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `table-${tableNumber}-qr.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="rounded-lg border border-border" />
      <button
        onClick={download}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-3 h-3" />
        Download
      </button>
    </div>
  );
}

export default function AdminTablesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newCapacity, setNewCapacity] = useState("4");

  const { data: tables = [], isLoading } = useGetTables({
    query: { queryKey: getGetTablesQueryKey() },
  });

  const createTable = useCreateTable();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTable.mutateAsync({ data: { tableNumber: parseInt(newTableNumber, 10), capacity: parseInt(newCapacity, 10) } });
      queryClient.invalidateQueries({ queryKey: getGetTablesQueryKey() });
      toast({ title: `Table ${newTableNumber} created` });
      setShowAdd(false);
      setNewTableNumber("");
    } catch {
      toast({ title: "Failed to create table", variant: "destructive" });
    }
  };

  const baseUrl = getBaseUrl();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin"><span className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors cursor-pointer"><ArrowLeft className="w-4 h-4" /></span></Link>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              <span className="font-serif text-lg font-bold text-foreground">Tables & QR Codes</span>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Tables", value: tables.length, color: "text-foreground" },
            { label: "Available", value: tables.filter(t => t.status === "available").length, color: "text-secondary" },
            { label: "Occupied", value: tables.filter(t => t.status === "occupied").length, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-24">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-bold text-foreground mb-2">No Tables Yet</h2>
            <p className="text-muted-foreground mb-6">Add your first table to generate QR codes.</p>
            <button onClick={() => setShowAdd(true)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Add First Table
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map(table => {
              const menuUrl = `${baseUrl}/menu/${table.id}`;
              return (
                <div key={table.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-4">
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-serif font-bold text-foreground text-lg">Table {table.tableNumber}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Users className="w-3 h-3" />
                        {table.capacity} seats
                      </div>
                    </div>
                    <TableStatusBadge status={table.status} />
                  </div>
                  <QRCodeCanvas url={menuUrl} tableNumber={table.tableNumber} />
                  <Link href={`/menu/${table.id}`}>
                    <span className="text-xs text-primary hover:underline cursor-pointer text-center block">
                      Preview Menu
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Table Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-card border border-border rounded-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-serif text-lg font-bold text-foreground">Add New Table</h2>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Table Number</label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={e => setNewTableNumber(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. 11"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Capacity</label>
                <input
                  type="number"
                  value={newCapacity}
                  onChange={e => setNewCapacity(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="4"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTable.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createTable.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
