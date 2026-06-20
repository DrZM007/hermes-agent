import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ClipboardList,
  Edit2,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@nous-research/ui/ui/components/badge";
import { Button } from "@nous-research/ui/ui/components/button";
import { Card, CardContent } from "@nous-research/ui/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@nous-research/ui/ui/components/dialog";
import { Input } from "@nous-research/ui/ui/components/input";
import { Spinner } from "@nous-research/ui/ui/components/spinner";
import { Toast } from "@nous-research/ui/ui/components/toast";
import { useToast } from "@nous-research/ui/hooks/use-toast";
import { usePageHeader } from "@/contexts/usePageHeader";
import { authedFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "hermes-pantry-items";
const SHOPPING_KEY = "hermes-shopping-list";

const CATEGORIES = [
  "All",
  "Dairy",
  "Meat & Fish",
  "Produce",
  "Grains & Pasta",
  "Canned Goods",
  "Snacks",
  "Beverages",
  "Condiments & Sauces",
  "Baking",
  "Frozen",
  "Spices & Herbs",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

type StockStatus = "ok" | "low" | "out";

interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: Exclude<Category, "All">;
  notes: string;
  status: StockStatus;
  addedAt: string;
  imagePreview?: string;
}

interface ShoppingEntry {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: Exclude<Category, "All">;
  checked: boolean;
}

interface DetectedItem {
  name: string;
  quantity: number;
  unit: string;
  category: Exclude<Category, "All">;
}

function loadItems(): PantryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items: PantryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch { /* ignore */ }
}

function loadShoppingList(): ShoppingEntry[] {
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveShoppingList(list: ShoppingEntry[]) {
  try {
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Read failed")));
    reader.readAsDataURL(file);
  });
}

const STATUS_COLORS: Record<StockStatus, string> = {
  ok: "text-success",
  low: "text-warning",
  out: "text-destructive",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  ok: "In Stock",
  low: "Low",
  out: "Out",
};

function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "text-xs font-mono tracking-wider uppercase",
        STATUS_COLORS[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const BLANK_ITEM: Omit<PantryItem, "id" | "addedAt"> = {
  name: "",
  quantity: 1,
  unit: "",
  category: "Other",
  notes: "",
  status: "ok",
};

export default function PantryPage() {
  const { setTitle } = usePageHeader();
  const { toast, showToast } = useToast();

  const [items, setItems] = useState<PantryItem[]>(() => loadItems());
  const [shoppingList, setShoppingList] = useState<ShoppingEntry[]>(() => loadShoppingList());

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<PantryItem | null>(null);
  const [form, setForm] = useState<Omit<PantryItem, "id" | "addedAt">>(BLANK_ITEM);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedDetected, setSelectedDetected] = useState<Set<number>>(new Set());

  const [shoppingOpen, setShoppingOpen] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const imageFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle("Pantry");
  }, [setTitle]);

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    saveShoppingList(shoppingList);
  }, [shoppingList]);

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.notes.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowOrOutCount = items.filter((i) => i.status !== "ok").length;

  function openAdd() {
    setForm(BLANK_ITEM);
    setEditItem(null);
    setAddDialogOpen(true);
  }

  function openEdit(item: PantryItem) {
    setForm({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
      status: item.status,
    });
    setEditItem(item);
    setAddDialogOpen(true);
  }

  function saveItem() {
    if (!form.name.trim()) return;
    if (editItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editItem.id
            ? { ...editItem, ...form, name: form.name.trim() }
            : i,
        ),
      );
      showToast("Item updated", "success");
    } else {
      const newItem: PantryItem = {
        ...form,
        name: form.name.trim(),
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      showToast("Item added to pantry", "success");
    }
    setAddDialogOpen(false);
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeleteId(null);
    showToast("Item removed", "success");
  }

  function cycleStatus(id: string) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next: StockStatus =
          item.status === "ok" ? "low" : item.status === "low" ? "out" : "ok";
        return { ...item, status: next };
      }),
    );
  }

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setImageDataUrl(dataUrl);
    setImagePreview(dataUrl);
    setDetectedItems([]);
    setSelectedDetected(new Set());
    setImageDialogOpen(true);
  }

  async function analyzeImage() {
    if (!imageDataUrl) return;
    setAnalyzing(true);
    setDetectedItems([]);
    try {
      const res = await authedFetch("/api/pantry/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_url: imageDataUrl }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const validCategories = CATEGORIES.filter((c) => c !== "All") as Array<Exclude<Category, "All">>;
      const detected: DetectedItem[] = (data.items || []).map((item: { name?: string; quantity?: number; unit?: string; category?: string }) => ({
        name: item.name || "Unknown",
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        unit: item.unit || "",
        category: validCategories.includes(item.category as Exclude<Category, "All">)
          ? (item.category as Exclude<Category, "All">)
          : "Other",
      }));
      setDetectedItems(detected);
      setSelectedDetected(new Set(detected.map((_, i) => i)));
      if (detected.length === 0) {
        showToast("No pantry items detected in this image", "error");
      }
    } catch (err) {
      showToast(`Analysis failed: ${String(err)}`, "error");
    } finally {
      setAnalyzing(false);
    }
  }

  function addDetectedItems() {
    const toAdd = detectedItems
      .filter((_, i) => selectedDetected.has(i))
      .map((d): PantryItem => ({
        ...d,
        id: crypto.randomUUID(),
        notes: "",
        status: "ok",
        addedAt: new Date().toISOString(),
        imagePreview: imagePreview,
      }));
    if (toAdd.length === 0) return;
    setItems((prev) => [...toAdd, ...prev]);
    showToast(`Added ${toAdd.length} item${toAdd.length > 1 ? "s" : ""} to pantry`, "success");
    setImageDialogOpen(false);
    setImageDataUrl("");
    setImagePreview("");
    setDetectedItems([]);
  }

  function generateShoppingList() {
    const needsRestock = items.filter((i) => i.status !== "ok");
    if (needsRestock.length === 0) {
      showToast("All items are in stock!", "success");
      return;
    }
    const newList: ShoppingEntry[] = needsRestock.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: false,
    }));
    setShoppingList(newList);
    setShoppingOpen(true);
  }

  function toggleShoppingCheck(id: string) {
    setShoppingList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)),
    );
  }

  function copyShoppingList() {
    const text = shoppingList
      .map((e) => `${e.checked ? "[x]" : "[ ]"} ${e.name}${e.quantity ? ` — ${e.quantity}${e.unit ? " " + e.unit : ""}` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() =>
      showToast("Shopping list copied to clipboard", "success"),
    );
  }

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] =
      cat === "All"
        ? items.length
        : items.filter((i) => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
          <Input
            placeholder="Search pantry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={openAdd} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Item
          </Button>

          <Button
            outlined
            size="sm"
            onClick={() => imageFileInputRef.current?.click()}
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            Scan Image
          </Button>
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageFile(file);
              e.target.value = "";
            }}
          />

          <Button
            outlined
            size="sm"
            onClick={generateShoppingList}
            className={lowOrOutCount > 0 ? "text-warning" : ""}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Shopping List
            {lowOrOutCount > 0 && (
              <Badge className="ml-1.5 text-[10px] px-1 py-0 bg-warning text-black">
                {lowOrOutCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.filter((c) => c === "All" || categoryCounts[c] > 0).map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1 rounded text-xs font-mono tracking-wider uppercase transition-colors",
                activeCategory === cat
                  ? "bg-midground text-background-base"
                  : "bg-current/5 text-text-secondary hover:text-midground",
              )}
            >
              {cat}
              {categoryCounts[cat] > 0 && (
                <span className="ml-1 opacity-60">({categoryCounts[cat]})</span>
              )}
            </button>
          ),
        )}
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-secondary">
          <Package className="h-12 w-12 opacity-20" />
          <p className="text-sm">
            {items.length === 0
              ? "Your pantry is empty. Add items manually or scan an image."
              : "No items match your search."}
          </p>
          {items.length === 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
              </Button>
              <Button
                size="sm"
                outlined
                onClick={() => imageFileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Scan Image
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <Card key={item.id} className="group relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {item.quantity > 0
                        ? `${item.quantity}${item.unit ? " " + item.unit : ""}`
                        : item.unit || "—"}{" "}
                      · {item.category}
                    </p>
                    {item.notes && (
                      <p className="text-xs text-text-tertiary mt-1 truncate">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => cycleStatus(item.id)}
                      title="Click to cycle stock status"
                    >
                      <StatusBadge status={item.status} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    ghost
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => openEdit(item)}
                    aria-label="Edit"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    ghost
                    size="icon"
                    className="h-6 w-6 text-destructive"
                    onClick={() => setDeleteId(item.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <span className="ml-auto text-[10px] text-text-tertiary">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add Pantry Item"}</DialogTitle>
            <DialogDescription>
              {editItem
                ? "Update the details for this item."
                : "Enter the details for the new pantry item."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div>
              <label className="text-xs text-text-secondary mb-1 block">Name *</label>
              <Input
                placeholder="e.g. Pasta"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Quantity</label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="1"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Unit</label>
                <Input
                  placeholder="e.g. cans, kg, L"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">Category</label>
              <select
                className="w-full rounded border border-current/20 bg-background-base px-3 py-1.5 text-sm text-text-primary"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as Exclude<Category, "All">,
                  }))
                }
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">Stock Status</label>
              <div className="flex gap-2">
                {(["ok", "low", "out"] as StockStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "flex-1 py-1.5 rounded text-xs font-mono tracking-wider uppercase border transition-colors",
                      form.status === s
                        ? s === "ok"
                          ? "bg-success/20 border-success text-success"
                          : s === "low"
                            ? "bg-warning/20 border-warning text-warning"
                            : "bg-destructive/20 border-destructive text-destructive"
                        : "border-current/20 text-text-secondary hover:border-current/40",
                    )}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary mb-1 block">Notes</label>
              <Input
                placeholder="Optional notes…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button outlined onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItem} disabled={!form.name.trim()}>
              {editItem ? "Save Changes" : "Add to Pantry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Scan Dialog ── */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Pantry Image</DialogTitle>
            <DialogDescription>
              Upload a photo of your pantry, fridge, or groceries to automatically detect items.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Pantry image preview"
                className="w-full max-h-48 object-contain rounded border border-current/20"
              />
            )}

            <div className="flex gap-2">
              <Button
                outlined
                size="sm"
                onClick={() => imageFileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {imagePreview ? "Change Image" : "Select Image"}
              </Button>

              <Button
                size="sm"
                onClick={analyzeImage}
                disabled={!imageDataUrl || analyzing}
                className="flex-1"
              >
                {analyzing ? (
                  <Spinner className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Camera className="h-3.5 w-3.5 mr-1.5" />
                )}
                {analyzing ? "Analysing…" : "Detect Items"}
              </Button>
            </div>

            {detectedItems.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Detected {detectedItems.length} item{detectedItems.length > 1 ? "s" : ""}
                  </p>
                  <button
                    className="text-xs text-text-secondary hover:text-midground"
                    onClick={() =>
                      setSelectedDetected(
                        selectedDetected.size === detectedItems.length
                          ? new Set()
                          : new Set(detectedItems.map((_, i) => i)),
                      )
                    }
                  >
                    {selectedDetected.size === detectedItems.length
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                  {detectedItems.map((item, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors",
                        selectedDetected.has(i)
                          ? "border-midground/40 bg-midground/5"
                          : "border-current/10 opacity-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDetected.has(i)}
                        onChange={() => {
                          setSelectedDetected((prev) => {
                            const next = new Set(prev);
                            if (next.has(i)) next.delete(i);
                            else next.add(i);
                            return next;
                          });
                        }}
                        className="accent-midground"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-text-secondary">
                          {item.quantity > 0 && `${item.quantity}${item.unit ? " " + item.unit : ""} · `}
                          {item.category}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              outlined
              onClick={() => {
                setImageDialogOpen(false);
                setDetectedItems([]);
                setImageDataUrl("");
                setImagePreview("");
              }}
            >
              Cancel
            </Button>
            {detectedItems.length > 0 && (
              <Button
                onClick={addDetectedItems}
                disabled={selectedDetected.size === 0}
              >
                Add {selectedDetected.size} Item{selectedDetected.size !== 1 ? "s" : ""}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Shopping List Dialog ── */}
      <Dialog open={shoppingOpen} onOpenChange={setShoppingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Shopping List
            </DialogTitle>
            <DialogDescription>
              Items that are low or out of stock.
            </DialogDescription>
          </DialogHeader>

          {shoppingList.length === 0 ? (
            <p className="text-sm text-text-secondary py-4 text-center">
              No items need restocking.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto py-2">
              {shoppingList.map((entry) => (
                <label
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded border cursor-pointer transition-colors",
                    entry.checked
                      ? "border-current/10 opacity-40 line-through"
                      : "border-current/20",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={entry.checked}
                    onChange={() => toggleShoppingCheck(entry.id)}
                    className="accent-midground"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{entry.name}</p>
                    <p className="text-xs text-text-secondary">
                      {entry.quantity > 0 && `${entry.quantity}${entry.unit ? " " + entry.unit : ""} · `}
                      {entry.category}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button outlined onClick={copyShoppingList}>
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
            <Button onClick={() => setShoppingOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from your pantry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button outlined onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              ghost
              className="text-destructive"
              onClick={() => deleteId && deleteItem(deleteId)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast toast={toast} />
    </div>
  );
}
