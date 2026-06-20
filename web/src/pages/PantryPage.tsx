import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ClipboardList,
  Edit2,
  Info,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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

// ─── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "hermes-pantry-items-v2";
const SHOPPING_KEY = "hermes-pantry-shopping-v2";

const CATEGORIES = [
  "All",
  "Dairy",
  "Meat & Fish",
  "Produce",
  "Grains & Starches",
  "Canned Goods",
  "Snacks",
  "Beverages",
  "Condiments & Sauces",
  "Baking",
  "Frozen",
  "Spices & Herbs",
  "Braai & Deli",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];
type StockStatus = "ok" | "low" | "out";

const VALID_CATS = CATEGORIES.filter((c) => c !== "All") as Array<Exclude<Category, "All">>;

const SA_BRANDS = [
  "Ayrshire", "Albany", "All Gold", "Bakers", "Black Cat", "Blue Ribbon",
  "Checkers House Brand", "Clover", "Country Fair", "Dairybelle", "Daybreak",
  "Denny", "Festive", "Flora", "Freshpak", "I&J", "Ina Paarman's",
  "Imana", "Joko", "Jungle Oats", "Kerrygold", "Koo", "Knorr",
  "Ladismith", "Lancewood", "Lucky Star", "Mageu No. 1",
  "Nola", "Orley Whip", "Parmalat", "Pick n Pay", "Pioneer Foods",
  "Premier", "Pronutro", "Rajah", "Rama", "Rhodes", "Robertsons",
  "Sasko", "Sea Harvest", "Simba", "Snowflake", "Steri Stumpie",
  "Stork", "Tiger Brands", "Weet-Bix", "Woolworths Food",
].sort();

// ─── Types ───────────────────────────────────────────────────────────────────

interface NutritionInfo {
  servingSize: string;    // "100g"
  energyKj: number;
  energyKcal: number;
  protein: number;        // g
  carbohydrates: number;  // g
  sugars: number;         // g
  fat: number;            // g
  saturatedFat: number;   // g
  fibre: number;          // g
  sodium: number;         // mg
}

interface PantryItem {
  id: string;
  name: string;
  brand: string;
  currentQty: number;   // how much is in pantry now
  maxQty: number;       // desired / restock-to quantity
  minQty: number;       // threshold: ≤ this → low stock → auto shopping list
  unit: string;
  category: Exclude<Category, "All">;
  notes: string;
  expiryDate?: string;  // YYYY-MM-DD
  addedAt: string;      // ISO timestamp
  nutrition?: Partial<NutritionInfo>;
}

interface ShoppingEntry {
  id: string;
  pantryItemId?: string;  // if linked to a pantry item
  name: string;
  brand: string;
  neededQty: number;      // how much to buy
  unit: string;
  category: Exclude<Category, "All">;
  notes: string;
  checked: boolean;       // purchased
  addedManually: boolean;
}

interface DetectedItem {
  name: string;
  brand: string;
  quantity: number;
  unit: string;
  category: Exclude<Category, "All">;
}

interface FormState {
  name: string;
  brand: string;
  currentQty: number;
  maxQty: number;
  minQty: number;
  unit: string;
  category: Exclude<Category, "All">;
  notes: string;
  expiryDate: string;
  nutrition: Partial<NutritionInfo>;
}

interface ExpiryInfo {
  daysLeft: number;
  isExpired: boolean;
  isWarning: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function migrateItem(raw: Record<string, unknown>): PantryItem {
  return {
    id: (raw.id as string) || crypto.randomUUID(),
    name: (raw.name as string) || "",
    brand: (raw.brand as string) || "",
    currentQty: (raw.currentQty as number) ?? (raw.quantity as number) ?? 1,
    maxQty: (raw.maxQty as number) ?? (((raw.quantity as number) ?? 1) * 2 || 5),
    minQty: (raw.minQty as number) ?? 1,
    unit: (raw.unit as string) || "",
    category: (VALID_CATS.includes(raw.category as Exclude<Category, "All">)
      ? raw.category
      : "Other") as Exclude<Category, "All">,
    notes: (raw.notes as string) || "",
    expiryDate: (raw.expiryDate as string) || undefined,
    addedAt: (raw.addedAt as string) || new Date().toISOString(),
    nutrition: (raw.nutrition as Partial<NutritionInfo>) || undefined,
  };
}

function loadItems(): PantryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r: unknown) => migrateItem(r as Record<string, unknown>));
  } catch {
    return [];
  }
}

function saveItems(items: PantryItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

function loadShoppingList(): ShoppingEntry[] {
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveShoppingList(list: ShoppingEntry[]) {
  try { localStorage.setItem(SHOPPING_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read file"));
    });
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Read failed")));
    reader.readAsDataURL(file);
  });
}

function computeStatus(item: PantryItem): StockStatus {
  if (item.currentQty <= 0) return "out";
  if (item.currentQty <= item.minQty) return "low";
  return "ok";
}

function computeExpiry(item: PantryItem): ExpiryInfo | null {
  if (!item.expiryDate) return null;
  const now = Date.now();
  const expiry = new Date(item.expiryDate + "T23:59:59").getTime();
  const added = new Date(item.addedAt).getTime();
  const msLeft = expiry - now;
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  const isExpired = daysLeft < 0;
  const totalMs = expiry - added;
  const warningMs = Math.max(totalMs * 0.1, 3 * 86_400_000); // at least 3 days
  const isWarning = !isExpired && msLeft <= warningMs;
  return { daysLeft, isExpired, isWarning };
}

function fmtQty(n: number, unit: string) {
  const num = n % 1 === 0 ? String(n) : n.toFixed(1);
  return unit ? `${num} ${unit}` : num;
}

const STATUS_META: Record<StockStatus, { label: string; cls: string }> = {
  ok:  { label: "In Stock", cls: "text-success" },
  low: { label: "Low",      cls: "text-warning" },
  out: { label: "Out",      cls: "text-destructive" },
};

const BLANK_FORM: FormState = {
  name: "", brand: "", currentQty: 1, maxQty: 5, minQty: 1,
  unit: "", category: "Other", notes: "", expiryDate: "", nutrition: {},
};

function itemToForm(item: PantryItem): FormState {
  return {
    name: item.name,
    brand: item.brand,
    currentQty: item.currentQty,
    maxQty: item.maxQty,
    minQty: item.minQty,
    unit: item.unit,
    category: item.category,
    notes: item.notes,
    expiryDate: item.expiryDate || "",
    nutrition: item.nutrition || {},
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExpiryBanner({ items }: { items: PantryItem[] }) {
  const alerts = useMemo(() => {
    return items
      .map((item) => ({ item, expiry: computeExpiry(item) }))
      .filter(({ expiry }) => expiry && (expiry.isExpired || expiry.isWarning))
      .sort((a, b) => (a.expiry!.daysLeft) - (b.expiry!.daysLeft));
  }, [items]);

  if (alerts.length === 0) return null;

  return (
    <div className="rounded border border-warning/40 bg-warning/10 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-warning">
          {alerts.length} item{alerts.length > 1 ? "s" : ""} expiring soon
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {alerts.slice(0, 5).map(({ item, expiry }) => (
            <li key={item.id} className="text-xs text-text-secondary">
              <span className="font-medium">{item.brand ? `${item.brand} ` : ""}{item.name}</span>
              {" — "}
              {expiry!.isExpired
                ? <span className="text-destructive font-medium">EXPIRED</span>
                : <span className="text-warning">{expiry!.daysLeft}d left</span>}
            </li>
          ))}
          {alerts.length > 5 && (
            <li className="text-xs text-text-tertiary">+{alerts.length - 5} more…</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function NutritionPanel({ nutrition }: { nutrition: Partial<NutritionInfo> }) {
  const n = nutrition;
  const rows: [string, string][] = [
    ["Energy", `${n.energyKj ?? "—"} kJ / ${n.energyKcal ?? "—"} kcal`],
    ["Protein", n.protein != null ? `${n.protein} g` : "—"],
    ["Carbohydrates", n.carbohydrates != null ? `${n.carbohydrates} g` : "—"],
    ["  of which sugars", n.sugars != null ? `${n.sugars} g` : "—"],
    ["Total Fat", n.fat != null ? `${n.fat} g` : "—"],
    ["  of which saturates", n.saturatedFat != null ? `${n.saturatedFat} g` : "—"],
    ["Dietary Fibre", n.fibre != null ? `${n.fibre} g` : "—"],
    ["Sodium", n.sodium != null ? `${n.sodium} mg` : "—"],
  ];
  return (
    <div className="rounded border border-current/10 bg-current/3 p-2">
      <p className="text-[10px] font-mono tracking-widest uppercase text-text-tertiary mb-1.5">
        Nutrition per {n.servingSize || "100g"}
      </p>
      <table className="w-full text-xs">
        <tbody>
          {rows.map(([label, val]) => (
            <tr key={label} className="border-t border-current/5 first:border-t-0">
              <td className="py-0.5 text-text-secondary pr-2">{label}</td>
              <td className="py-0.5 text-right font-mono text-text-primary">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ItemCardProps {
  item: PantryItem;
  showMax: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddToList: () => void;
}

function ItemCard({ item, showMax, onEdit, onDelete, onAddToList }: ItemCardProps) {
  const [showNutrition, setShowNutrition] = useState(false);
  const status = computeStatus(item);
  const expiry = computeExpiry(item);
  const { label, cls } = STATUS_META[status];
  const pct = item.maxQty > 0 ? Math.min(item.currentQty / item.maxQty, 1) : 0;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-colors",
      expiry?.isExpired && "border-destructive/40",
      expiry?.isWarning && !expiry.isExpired && "border-warning/40",
    )}>
      <CardContent className="p-4 flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {item.brand && (
              <p className="text-[10px] font-mono tracking-wider text-text-tertiary uppercase truncate">
                {item.brand}
              </p>
            )}
            <p className="font-medium text-sm truncate leading-tight">{item.name}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {item.category}
            </p>
          </div>
          <button
            onClick={() => {
              /* cycle status manually not needed — auto-computed from qty */
            }}
            className={cn("text-xs font-mono tracking-wider uppercase shrink-0", cls)}
            title={`Status: ${label}`}
          >
            {label}
          </button>
        </div>

        {/* Quantity display */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-base font-semibold">
              {showMax ? fmtQty(item.maxQty, item.unit) : fmtQty(item.currentQty, item.unit)}
            </span>
            <span className="text-[10px] text-text-tertiary">
              {showMax ? "max" : `/ ${fmtQty(item.maxQty, item.unit)}`}
            </span>
          </div>
          {/* Stock bar */}
          <div className="h-1 rounded-full bg-current/10 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                pct >= 1 ? "bg-success" : pct > 0.2 ? "bg-warning" : "bg-destructive",
              )}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-text-tertiary mt-0.5">
            min {fmtQty(item.minQty, item.unit)}
          </p>
        </div>

        {/* Expiry */}
        {expiry && (
          <div className={cn(
            "text-xs flex items-center gap-1",
            expiry.isExpired ? "text-destructive" : expiry.isWarning ? "text-warning" : "text-text-tertiary",
          )}>
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {expiry.isExpired
              ? `Expired ${Math.abs(expiry.daysLeft)}d ago`
              : `Expires in ${expiry.daysLeft}d (${item.expiryDate})`}
          </div>
        )}

        {item.notes && (
          <p className="text-xs text-text-tertiary truncate">{item.notes}</p>
        )}

        {/* Nutrition panel */}
        {showNutrition && item.nutrition && Object.keys(item.nutrition).length > 0 && (
          <NutritionPanel nutrition={item.nutrition} />
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button ghost size="icon" className="h-6 w-6" onClick={onEdit} aria-label="Edit">
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            ghost size="icon" className="h-6 w-6 text-destructive"
            onClick={onDelete} aria-label="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button
            ghost size="icon" className="h-6 w-6 text-text-secondary"
            onClick={onAddToList} aria-label="Add to shopping list"
            title="Add to shopping list"
          >
            <ShoppingCart className="h-3 w-3" />
          </Button>
          {item.nutrition && Object.keys(item.nutrition).length > 0 && (
            <Button
              ghost size="icon" className="h-6 w-6 text-text-secondary"
              onClick={() => setShowNutrition((v) => !v)} aria-label="Toggle nutrition"
              title="Show/hide nutrition"
            >
              <Info className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const { setTitle } = usePageHeader();
  const { toast, showToast } = useToast();

  const [items, setItems] = useState<PantryItem[]>(() => loadItems());
  const [shopping, setShopping] = useState<ShoppingEntry[]>(() => loadShoppingList());

  // View state
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<Category>("All");
  const [showMax, setShowMax] = useState(false);

  // Dialogs
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PantryItem | null>(null);
  const [form, setForm] = useState<FormState>(BLANK_FORM);

  const [scanOpen, setScanOpen] = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState<DetectedItem[]>([]);

  const [listOpen, setListOpen] = useState(false);
  const [listForm, setListForm] = useState({ name: "", brand: "", neededQty: 1, unit: "", category: "Other" as Exclude<Category, "All">, notes: "" });
  const [listSearchOpen, setListSearchOpen] = useState(false);
  const [listSearchQ, setListSearchQ] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [lookingUpNutrition, setLookingUpNutrition] = useState(false);

  // Nutrition dialog (expand/collapse sections in add dialog)
  const [showNutritionForm, setShowNutritionForm] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle("Pantry"); }, [setTitle]);
  useEffect(() => { saveItems(items); }, [items]);
  useEffect(() => { saveShoppingList(shopping); }, [shopping]);

  // Auto-sync: items below threshold → ensure they're in shopping list
  useEffect(() => {
    const lowItems = items.filter((i) => computeStatus(i) !== "ok");
    if (lowItems.length === 0) return;
    setShopping((prev) => {
      const existingIds = new Set(prev.map((e) => e.pantryItemId).filter(Boolean));
      const toAdd: ShoppingEntry[] = lowItems
        .filter((i) => !existingIds.has(i.id))
        .map((i) => ({
          id: crypto.randomUUID(),
          pantryItemId: i.id,
          name: i.name,
          brand: i.brand,
          neededQty: Math.max(i.maxQty - i.currentQty, 1),
          unit: i.unit,
          category: i.category,
          notes: "",
          checked: false,
          addedManually: false,
        }));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, [items]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || item.name.toLowerCase().includes(q)
        || item.brand.toLowerCase().includes(q)
        || item.notes.toLowerCase().includes(q);
      const matchCat = activeCat === "All" || item.category === activeCat;
      return matchSearch && matchCat;
    });
  }, [items, search, activeCat]);

  const catCounts = useMemo(() => {
    return CATEGORIES.reduce<Record<string, number>>((acc, c) => {
      acc[c] = c === "All" ? items.length : items.filter((i) => i.category === c).length;
      return acc;
    }, {});
  }, [items]);

  const listCount = shopping.filter((e) => !e.checked).length;

  // ── Item CRUD ──────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setForm(BLANK_FORM);
    setEditTarget(null);
    setShowNutritionForm(false);
    setAddOpen(true);
  }, []);

  const openEdit = useCallback((item: PantryItem) => {
    setForm(itemToForm(item));
    setEditTarget(item);
    setShowNutritionForm(!!item.nutrition && Object.keys(item.nutrition).length > 0);
    setAddOpen(true);
  }, []);

  const saveItem = useCallback(() => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    const nutrition = showNutritionForm && Object.keys(form.nutrition).length > 0
      ? form.nutrition : undefined;

    if (editTarget) {
      setItems((prev) => prev.map((i) => i.id !== editTarget.id ? i : {
        ...editTarget,
        name: form.name.trim(),
        brand: form.brand.trim(),
        currentQty: form.currentQty,
        maxQty: form.maxQty,
        minQty: form.minQty,
        unit: form.unit.trim(),
        category: form.category,
        notes: form.notes.trim(),
        expiryDate: form.expiryDate || undefined,
        nutrition,
      }));
      showToast("Item updated", "success");
    } else {
      setItems((prev) => [{
        id: crypto.randomUUID(),
        name: form.name.trim(),
        brand: form.brand.trim(),
        currentQty: form.currentQty,
        maxQty: form.maxQty,
        minQty: form.minQty,
        unit: form.unit.trim(),
        category: form.category,
        notes: form.notes.trim(),
        expiryDate: form.expiryDate || undefined,
        addedAt: now,
        nutrition,
      }, ...prev]);
      showToast("Item added to pantry", "success");
    }
    setAddOpen(false);
  }, [form, editTarget, showNutritionForm, showToast]);

  const deleteItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setShopping((prev) => prev.filter((e) => e.pantryItemId !== id));
    setDeleteId(null);
    showToast("Item removed", "success");
  }, [showToast]);

  const addItemToShoppingList = useCallback((item: PantryItem) => {
    setShopping((prev) => {
      if (prev.some((e) => e.pantryItemId === item.id && !e.checked)) {
        showToast("Already in shopping list", "success");
        return prev;
      }
      return [...prev, {
        id: crypto.randomUUID(),
        pantryItemId: item.id,
        name: item.name,
        brand: item.brand,
        neededQty: Math.max(item.maxQty - item.currentQty, 1),
        unit: item.unit,
        category: item.category,
        notes: "",
        checked: false,
        addedManually: true,
      }];
    });
    showToast(`${item.name} added to shopping list`, "success");
  }, [showToast]);

  // ── Nutrition AI Lookup ────────────────────────────────────────────────────

  const lookupNutrition = useCallback(async () => {
    if (!form.name.trim()) {
      showToast("Enter an item name first", "error");
      return;
    }
    setLookingUpNutrition(true);
    try {
      const res = await authedFetch("/api/pantry/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_name: form.name.trim(), brand: form.brand.trim() || undefined }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const n = data.nutrition || {};
      setForm((f) => ({
        ...f,
        nutrition: {
          servingSize: n.serving_size || "100g",
          energyKj: n.energy_kj || 0,
          energyKcal: n.energy_kcal || 0,
          protein: n.protein_g || 0,
          carbohydrates: n.carbohydrates_g || 0,
          sugars: n.sugars_g || 0,
          fat: n.fat_g || 0,
          saturatedFat: n.saturated_fat_g || 0,
          fibre: n.fibre_g || 0,
          sodium: n.sodium_mg || 0,
        },
      }));
      setShowNutritionForm(true);
      showToast("Nutritional info loaded", "success");
    } catch (err) {
      showToast(`Nutrition lookup failed: ${String(err)}`, "error");
    } finally {
      setLookingUpNutrition(false);
    }
  }, [form.name, form.brand, showToast]);

  // ── Image Scan ─────────────────────────────────────────────────────────────

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setImgDataUrl(dataUrl);
    setImgPreview(dataUrl);
    setDetected([]);
    setScanOpen(true);
  }, [showToast]);

  const analyzeImage = useCallback(async () => {
    if (!imgDataUrl) return;
    setScanning(true);
    setDetected([]);
    try {
      const res = await authedFetch("/api/pantry/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_url: imgDataUrl }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const items: DetectedItem[] = (data.items || []).map((raw: Record<string, unknown>) => ({
        name: String(raw.name || "Unknown"),
        brand: String(raw.brand || ""),
        quantity: typeof raw.quantity === "number" ? raw.quantity : 1,
        unit: String(raw.unit || ""),
        category: VALID_CATS.includes(raw.category as Exclude<Category, "All">)
          ? (raw.category as Exclude<Category, "All">)
          : "Other",
      }));
      setDetected(items);
      if (items.length === 0) {
        showToast("No pantry items detected", "error");
      }
    } catch (err) {
      showToast(`Scan failed: ${String(err)}`, "error");
    } finally {
      setScanning(false);
    }
  }, [imgDataUrl, showToast]);

  const addAllDetected = useCallback(() => {
    if (detected.length === 0) return;
    const now = new Date().toISOString();
    const newItems: PantryItem[] = detected.map((d) => ({
      id: crypto.randomUUID(),
      name: d.name,
      brand: d.brand,
      currentQty: d.quantity,
      maxQty: d.quantity * 2 || 2,
      minQty: 1,
      unit: d.unit,
      category: d.category,
      notes: "",
      addedAt: now,
    }));
    setItems((prev) => [...newItems, ...prev]);
    showToast(`Added ${newItems.length} item${newItems.length > 1 ? "s" : ""} to pantry`, "success");
    setScanOpen(false);
    setImgDataUrl("");
    setImgPreview("");
    setDetected([]);
  }, [detected, showToast]);

  // ── Shopping List ──────────────────────────────────────────────────────────

  const toggleCheck = useCallback((id: string) => {
    setShopping((prev) => prev.map((e) => e.id === id ? { ...e, checked: !e.checked } : e));
  }, []);

  const removeFromList = useCallback((id: string) => {
    setShopping((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addManualToList = useCallback(() => {
    if (!listForm.name.trim()) return;
    setShopping((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: listForm.name.trim(),
      brand: listForm.brand.trim(),
      neededQty: listForm.neededQty,
      unit: listForm.unit.trim(),
      category: listForm.category,
      notes: listForm.notes.trim(),
      checked: false,
      addedManually: true,
    }]);
    setListForm({ name: "", brand: "", neededQty: 1, unit: "", category: "Other", notes: "" });
  }, [listForm]);

  const finalisePurchases = useCallback(() => {
    const purchased = shopping.filter((e) => e.checked);
    if (purchased.length === 0) return;

    const now = new Date().toISOString();
    setItems((prevItems) => {
      let next = [...prevItems];
      const newPantryItems: PantryItem[] = [];

      for (const entry of purchased) {
        if (entry.pantryItemId) {
          next = next.map((item) => {
            if (item.id !== entry.pantryItemId) return item;
            return { ...item, currentQty: Math.min(item.currentQty + entry.neededQty, item.maxQty) };
          });
        } else {
          // New item not in pantry
          newPantryItems.push({
            id: crypto.randomUUID(),
            name: entry.name,
            brand: entry.brand,
            currentQty: entry.neededQty,
            maxQty: entry.neededQty * 2 || 2,
            minQty: 1,
            unit: entry.unit,
            category: entry.category,
            notes: entry.notes,
            addedAt: now,
          });
        }
      }

      return [...newPantryItems, ...next];
    });

    setShopping((prev) => prev.filter((e) => !e.checked));
    showToast(`${purchased.length} item${purchased.length > 1 ? "s" : ""} marked as purchased`, "success");
  }, [shopping, showToast]);

  const copyList = useCallback(() => {
    const text = shopping
      .map((e) => `${e.checked ? "✓" : "☐"} ${e.brand ? e.brand + " " : ""}${e.name}${e.neededQty ? ` – ${fmtQty(e.neededQty, e.unit)}` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text).then(() => showToast("Copied to clipboard", "success"));
  }, [shopping, showToast]);

  // Pantry items matching the search for quick-add to shopping list
  const pantrySearchResults = useMemo(() => {
    if (!listSearchQ.trim()) return [];
    const q = listSearchQ.toLowerCase();
    return items
      .filter((i) => i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q))
      .slice(0, 6);
  }, [items, listSearchQ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* Expiry alerts */}
      <ExpiryBanner items={items} />

      {/* Toolbar */}
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
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
          </Button>

          <Button outlined size="sm" onClick={() => imageInputRef.current?.click()}>
            <Camera className="h-3.5 w-3.5 mr-1.5" /> Scan Image
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleImageFile(f);
              e.target.value = "";
            }}
          />

          {/* Current / Max toggle */}
          <button
            onClick={() => setShowMax((v) => !v)}
            className={cn(
              "px-3 py-1 rounded text-xs font-mono tracking-wider uppercase border transition-colors",
              showMax
                ? "bg-midground text-background-base border-midground"
                : "border-current/20 text-text-secondary hover:text-midground",
            )}
            title={showMax ? "Showing max quantity — click for current" : "Showing current quantity — click for max"}
          >
            {showMax ? "MAX QTY" : "CURR QTY"}
          </button>

          <Button
            outlined
            size="sm"
            onClick={() => setListOpen(true)}
            className={listCount > 0 ? "text-warning" : ""}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Shopping List
            {listCount > 0 && (
              <span className="ml-1.5 rounded bg-warning px-1 text-[10px] text-black font-bold">
                {listCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.filter((c) => c === "All" || catCounts[c] > 0).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={cn(
              "px-3 py-1 rounded text-xs font-mono tracking-wider uppercase transition-colors",
              activeCat === cat
                ? "bg-midground text-background-base"
                : "bg-current/5 text-text-secondary hover:text-midground",
            )}
          >
            {cat}
            <span className="ml-1 opacity-60">({catCounts[cat]})</span>
          </button>
        ))}
      </div>

      {/* Item grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-secondary">
          <Package className="h-12 w-12 opacity-20" />
          <p className="text-sm">
            {items.length === 0
              ? "Pantry empty — add items manually or scan an image of your groceries."
              : "No items match your search."}
          </p>
          {items.length === 0 && (
            <div className="flex gap-2">
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Item
              </Button>
              <Button size="sm" outlined onClick={() => imageInputRef.current?.click()}>
                <Camera className="h-3.5 w-3.5 mr-1.5" /> Scan Image
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              showMax={showMax}
              onEdit={() => openEdit(item)}
              onDelete={() => setDeleteId(item.id)}
              onAddToList={() => addItemToShoppingList(item)}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Pantry Item" : "Add Pantry Item"}</DialogTitle>
            <DialogDescription>
              South African pantry tracker — Durban region
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">

            {/* ── Basic ── */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-mono tracking-widest uppercase text-text-tertiary">Basic Info</h3>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Item Name *</label>
                <Input
                  autoFocus
                  placeholder="e.g. Baked Beans"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Brand</label>
                <Input
                  placeholder="e.g. Koo, Clover, Albany…"
                  value={form.brand}
                  list="sa-brands-list"
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                />
                <datalist id="sa-brands-list">
                  {SA_BRANDS.map((b) => <option key={b} value={b} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Category</label>
                  <select
                    className="w-full rounded border border-current/20 bg-background-base px-3 py-1.5 text-sm text-text-primary"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Exclude<Category, "All"> }))}
                  >
                    {VALID_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Unit</label>
                  <Input
                    placeholder="cans, kg, L, pcs…"
                    value={form.unit}
                    list="unit-list"
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                  <datalist id="unit-list">
                    {["cans","bottles","boxes","bags","kg","g","L","ml","pcs","loaves","packets","jars","sachets"].map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Notes</label>
                <Input
                  placeholder="e.g. Organic, no sugar added…"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </section>

            <hr className="border-current/10" />

            {/* ── Quantities ── */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-mono tracking-widest uppercase text-text-tertiary">Stock & Thresholds</h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Current Qty</label>
                  <Input
                    type="number" min={0} step={0.5}
                    value={form.currentQty}
                    onChange={(e) => setForm((f) => ({ ...f, currentQty: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Max Qty</label>
                  <Input
                    type="number" min={1} step={0.5}
                    value={form.maxQty}
                    onChange={(e) => setForm((f) => ({ ...f, maxQty: parseFloat(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Min / Alert</label>
                  <Input
                    type="number" min={0} step={0.5}
                    value={form.minQty}
                    onChange={(e) => setForm((f) => ({ ...f, minQty: parseFloat(e.target.value) || 0 }))}
                    title="Add to shopping list when current qty falls to or below this number"
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-tertiary -mt-1">
                Auto-adds to shopping list when current ≤ min threshold
              </p>
            </section>

            <hr className="border-current/10" />

            {/* ── Expiry ── */}
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-mono tracking-widest uppercase text-text-tertiary">Expiry Date</h3>
              <div>
                <label className="text-xs text-text-secondary mb-1 block">Best Before / Expiry</label>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
                <p className="text-[11px] text-text-tertiary mt-1">
                  Alert shows when ≤10% of shelf life remains
                </p>
              </div>
            </section>

            <hr className="border-current/10" />

            {/* ── Nutrition ── */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono tracking-widest uppercase text-text-tertiary">
                  Nutritional Info (per 100g)
                </h3>
                <div className="flex gap-2">
                  <Button
                    ghost size="sm"
                    onClick={lookupNutrition}
                    disabled={lookingUpNutrition || !form.name.trim()}
                    className="text-xs h-6"
                    title="AI lookup for SA products"
                  >
                    {lookingUpNutrition
                      ? <Spinner className="h-3 w-3 mr-1" />
                      : <RefreshCw className="h-3 w-3 mr-1" />}
                    AI Lookup
                  </Button>
                  <button
                    className="text-xs text-text-secondary hover:text-midground"
                    onClick={() => setShowNutritionForm((v) => !v)}
                  >
                    {showNutritionForm ? "Hide" : "Expand"}
                  </button>
                </div>
              </div>

              {showNutritionForm && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "energyKj" as keyof NutritionInfo, label: "Energy (kJ)" },
                    { key: "energyKcal" as keyof NutritionInfo, label: "Energy (kcal)" },
                    { key: "protein" as keyof NutritionInfo, label: "Protein (g)" },
                    { key: "carbohydrates" as keyof NutritionInfo, label: "Carbohydrates (g)" },
                    { key: "sugars" as keyof NutritionInfo, label: "  of which Sugars (g)" },
                    { key: "fat" as keyof NutritionInfo, label: "Total Fat (g)" },
                    { key: "saturatedFat" as keyof NutritionInfo, label: "  Saturated Fat (g)" },
                    { key: "fibre" as keyof NutritionInfo, label: "Dietary Fibre (g)" },
                    { key: "sodium" as keyof NutritionInfo, label: "Sodium (mg)" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[11px] text-text-tertiary mb-0.5 block">{label}</label>
                      <Input
                        type="number"
                        min={0}
                        step={0.1}
                        placeholder="0"
                        value={(form.nutrition[key] as number) ?? ""}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          nutrition: { ...f.nutrition, [key]: parseFloat(e.target.value) || 0 },
                        }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <DialogFooter>
            <Button outlined onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={saveItem} disabled={!form.name.trim()}>
              {editTarget ? "Save Changes" : "Add to Pantry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Image Scan Dialog ─────────────────────────────────────────── */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan Pantry Image</DialogTitle>
            <DialogDescription>
              Upload a photo of your pantry, fridge or shopping. All detected SA products will be added automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {imgPreview && (
              <img
                src={imgPreview}
                alt="Preview"
                className="w-full max-h-48 object-contain rounded border border-current/20"
              />
            )}

            <div className="flex gap-2">
              <Button outlined size="sm" className="flex-1" onClick={() => imageInputRef.current?.click()}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {imgPreview ? "Change Image" : "Select Image"}
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={analyzeImage}
                disabled={!imgDataUrl || scanning}
              >
                {scanning
                  ? <><Spinner className="h-3.5 w-3.5 mr-1.5" />Scanning…</>
                  : <><Camera className="h-3.5 w-3.5 mr-1.5" />Detect Items</>}
              </Button>
            </div>

            {detected.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Detected {detected.length} item{detected.length > 1 ? "s" : ""}
                  </p>
                  <span className="text-xs text-text-tertiary">All will be added</span>
                </div>
                <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                  {detected.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded border border-midground/30 bg-midground/5"
                    >
                      <Check className="h-3.5 w-3.5 text-success shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.brand ? <span className="text-text-tertiary">{item.brand} </span> : null}
                          {item.name}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {item.quantity > 0 && `${fmtQty(item.quantity, item.unit)} · `}{item.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button outlined onClick={() => { setScanOpen(false); setDetected([]); setImgDataUrl(""); setImgPreview(""); }}>
              Cancel
            </Button>
            {detected.length > 0 && (
              <Button onClick={addAllDetected}>
                Add All {detected.length} Items
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Shopping List Dialog ──────────────────────────────────────── */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Shopping List
            </DialogTitle>
            <DialogDescription>
              Items to buy — check off when purchased to update your pantry inventory.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">

            {/* List items */}
            {shopping.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-4">
                No items in shopping list. Add items below or items will appear here automatically when stock is low.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {shopping.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded border transition-all",
                      entry.checked
                        ? "border-success/30 bg-success/5 opacity-60"
                        : "border-current/20 hover:border-current/40",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={entry.checked}
                      onChange={() => toggleCheck(entry.id)}
                      className="accent-midground h-4 w-4 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm", entry.checked && "line-through")}>
                        {entry.brand && <span className="text-text-tertiary">{entry.brand} </span>}
                        {entry.name}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {entry.neededQty > 0 && fmtQty(entry.neededQty, entry.unit)}
                        {entry.category && ` · ${entry.category}`}
                        {!entry.addedManually && " · auto"}
                        {entry.checked && " · purchased ✓"}
                      </p>
                    </div>
                    <Button
                      ghost size="icon"
                      className="h-6 w-6 text-text-tertiary shrink-0"
                      onClick={() => removeFromList(entry.id)}
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add item to list */}
            <div className="border border-current/10 rounded p-3 flex flex-col gap-2">
              <p className="text-xs font-mono tracking-widest uppercase text-text-tertiary">
                Add Item to List
              </p>

              {/* Search existing pantry items */}
              <div className="relative">
                <Input
                  placeholder="Search pantry items to add…"
                  value={listSearchQ}
                  onChange={(e) => { setListSearchQ(e.target.value); setListSearchOpen(true); }}
                  onFocus={() => setListSearchOpen(true)}
                  onBlur={() => setTimeout(() => setListSearchOpen(false), 150)}
                  className="text-sm"
                />
                {listSearchOpen && pantrySearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded border border-current/20 bg-background-base shadow-lg">
                    {pantrySearchResults.map((item) => (
                      <button
                        key={item.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-midground/10 flex items-center justify-between"
                        onMouseDown={() => {
                          addItemToShoppingList(item);
                          setListSearchQ("");
                          setListSearchOpen(false);
                        }}
                      >
                        <span>{item.brand ? `${item.brand} ` : ""}{item.name}</span>
                        <span className="text-xs text-text-tertiary">{item.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Or add a custom item */}
              <p className="text-[11px] text-text-tertiary text-center">— or add a custom item —</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Item name"
                  value={listForm.name}
                  onChange={(e) => setListForm((f) => ({ ...f, name: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  placeholder="Brand (optional)"
                  value={listForm.brand}
                  list="sa-brands-list"
                  onChange={(e) => setListForm((f) => ({ ...f, brand: e.target.value }))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Qty"
                  value={listForm.neededQty || ""}
                  onChange={(e) => setListForm((f) => ({ ...f, neededQty: parseFloat(e.target.value) || 1 }))}
                  className="text-sm"
                />
                <Input
                  placeholder="Unit"
                  value={listForm.unit}
                  list="unit-list"
                  onChange={(e) => setListForm((f) => ({ ...f, unit: e.target.value }))}
                  className="text-sm"
                />
                <select
                  className="col-span-2 rounded border border-current/20 bg-background-base px-3 py-1.5 text-sm text-text-primary"
                  value={listForm.category}
                  onChange={(e) => setListForm((f) => ({ ...f, category: e.target.value as Exclude<Category, "All"> }))}
                >
                  {VALID_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button size="sm" outlined onClick={addManualToList} disabled={!listForm.name.trim()}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add to List
              </Button>
            </div>
          </div>

          <DialogFooter className="flex-wrap gap-2">
            <Button outlined size="sm" onClick={copyList}>
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Copy
            </Button>
            <Button
              size="sm"
              onClick={finalisePurchases}
              disabled={!shopping.some((e) => e.checked)}
              title="Update pantry with purchased items"
            >
              <Check className="h-3.5 w-3.5 mr-1.5" />
              Mark Purchased
            </Button>
            <Button size="sm" outlined onClick={() => setListOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Remove this item from your pantry? It will also be removed from the shopping list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button outlined onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button ghost className="text-destructive" onClick={() => deleteId && deleteItem(deleteId)}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toast toast={toast} />
    </div>
  );
}
