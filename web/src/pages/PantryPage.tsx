import "./PantryPage.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Edit2,
  Info,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Snowflake,
  Thermometer,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@nous-research/ui/ui/components/button";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY  = "hermes-pantry-items-v3";
const SHOPPING_KEY = "hermes-pantry-shopping-v3";

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
  "Leftovers",
  "Other",
] as const;

type Category       = (typeof CATEGORIES)[number];
type StockStatus    = "ok" | "low" | "out";
type StorageLocation = "Pantry" | "Fridge" | "Freezer";

const VALID_CATS = CATEGORIES.filter((c) => c !== "All") as Array<Exclude<Category, "All">>;
const LOCATIONS: StorageLocation[] = ["Pantry", "Fridge", "Freezer"];

const SA_BRANDS = [
  "Albany", "All Gold", "Ayrshire", "Bakers", "Black Cat", "Blue Ribbon",
  "Checkers House Brand", "Clover", "Country Fair", "Dairybelle", "Daybreak",
  "Denny", "Festive", "Flora", "Freshpak", "I&J", "Imana",
  "Ina Paarman's", "Joko", "Jungle Oats", "Kerrygold", "Knorr", "Koo",
  "Ladismith", "Lancewood", "Lucky Star", "Mageu No. 1",
  "Nando's", "Nola", "Orley Whip", "Parmalat", "Pick n Pay",
  "Pioneer Foods", "Premier", "Pronutro", "Rajah", "Rama",
  "Rhodes", "Robertsons", "Sasko", "Sea Harvest", "Simba",
  "Snowflake", "Steri Stumpie", "Stork", "Tiger Brands", "Weet-Bix",
  "Woolworths Food",
].sort();

// ─── Types ────────────────────────────────────────────────────────────────────

interface NutritionInfo {
  servingSize:    string;
  energyKj:       number;
  energyKcal:     number;
  protein:        number;
  carbohydrates:  number;
  sugars:         number;
  fat:            number;
  saturatedFat:   number;
  fibre:          number;
  sodium:         number;
}

interface PantryItem {
  id:              string;
  name:            string;
  brand:           string;
  currentQty:      number;
  maxQty:          number;
  minQty:          number;
  unit:            string;
  category:        Exclude<Category, "All">;
  storageLocation: StorageLocation;
  notes:           string;
  expiryDate?:     string;
  addedAt:         string;
  nutrition?:      Partial<NutritionInfo>;
}

interface ShoppingEntry {
  id:              string;
  pantryItemId?:   string;
  name:            string;
  brand:           string;
  neededQty:       number;
  unit:            string;
  category:        Exclude<Category, "All">;
  storageLocation: StorageLocation;
  notes:           string;
  checked:         boolean;
  addedManually:   boolean;
}

interface DetectedItem {
  name:     string;
  brand:    string;
  quantity: number;
  unit:     string;
  category: Exclude<Category, "All">;
}

interface DetectedItemEditable extends DetectedItem {
  selected: boolean;
  editQty:  number;
}

interface FormState {
  name:            string;
  brand:           string;
  currentQty:      number;
  maxQty:          number;
  minQty:          number;
  unit:            string;
  category:        Exclude<Category, "All">;
  storageLocation: StorageLocation;
  notes:           string;
  expiryDate:      string;
  nutrition:       Partial<NutritionInfo>;
}

interface ExpiryInfo {
  daysLeft:  number;
  isExpired: boolean;
  isWarning: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function migrateItem(raw: Record<string, unknown>): PantryItem {
  const rawLoc = raw.storageLocation as StorageLocation;
  return {
    id:              (raw.id as string) || crypto.randomUUID(),
    name:            (raw.name as string) || "",
    brand:           (raw.brand as string) || "",
    currentQty:      (raw.currentQty as number) ?? (raw.quantity as number) ?? 1,
    maxQty:          (raw.maxQty as number) ?? (((raw.quantity as number) ?? 1) * 2 || 5),
    minQty:          (raw.minQty as number) ?? 1,
    unit:            (raw.unit as string) || "",
    category:        (VALID_CATS.includes(raw.category as Exclude<Category, "All">)
                       ? raw.category
                       : "Other") as Exclude<Category, "All">,
    storageLocation: (LOCATIONS.includes(rawLoc) ? rawLoc : "Pantry"),
    notes:           (raw.notes as string) || "",
    expiryDate:      (raw.expiryDate as string) || undefined,
    addedAt:         (raw.addedAt as string) || new Date().toISOString(),
    nutrition:       (raw.nutrition as Partial<NutritionInfo>) || undefined,
  };
}

function loadItems(): PantryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // migrate v2 data
      const v2 = localStorage.getItem("hermes-pantry-items-v2");
      if (v2) {
        const parsed = JSON.parse(v2);
        return Array.isArray(parsed)
          ? parsed.map((r: unknown) => migrateItem(r as Record<string, unknown>))
          : [];
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((r: unknown) => migrateItem(r as Record<string, unknown>))
      : [];
  } catch { return []; }
}

function saveItems(items: PantryItem[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

function loadShoppingList(): ShoppingEntry[] {
  try {
    const raw = localStorage.getItem(SHOPPING_KEY);
    if (!raw) {
      const v2 = localStorage.getItem("hermes-pantry-shopping-v2");
      if (v2) {
        const parsed = JSON.parse(v2);
        if (Array.isArray(parsed)) {
          return parsed.map((e: Record<string, unknown>) => ({
            ...e,
            storageLocation: (e.storageLocation as StorageLocation) || "Pantry",
          })) as ShoppingEntry[];
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveShoppingList(list: ShoppingEntry[]) {
  try { localStorage.setItem(SHOPPING_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read file")),
    );
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
  const now    = Date.now();
  const expiry = new Date(item.expiryDate + "T23:59:59").getTime();
  const added  = new Date(item.addedAt).getTime();
  const msLeft = expiry - now;
  const daysLeft = Math.ceil(msLeft / 86_400_000);
  const isExpired = daysLeft < 0;
  const totalMs   = expiry - added;
  const warningMs = Math.max(totalMs * 0.1, 3 * 86_400_000);
  const isWarning = !isExpired && msLeft <= warningMs;
  return { daysLeft, isExpired, isWarning };
}

function fmtQty(n: number, unit: string) {
  const num = n % 1 === 0 ? String(n) : n.toFixed(1);
  return unit ? `${num} ${unit}` : num;
}

const STATUS_CSS: Record<StockStatus, string> = {
  ok:  "cyber-status-ok",
  low: "cyber-status-low",
  out: "cyber-status-out",
};

const STATUS_LABEL: Record<StockStatus, string> = {
  ok:  "In Stock",
  low: "Low",
  out: "Out",
};

const BLANK_FORM: FormState = {
  name: "", brand: "", currentQty: 1, maxQty: 5, minQty: 1,
  unit: "", category: "Other", storageLocation: "Pantry",
  notes: "", expiryDate: "", nutrition: {},
};

function itemToForm(item: PantryItem): FormState {
  return {
    name:            item.name,
    brand:           item.brand,
    currentQty:      item.currentQty,
    maxQty:          item.maxQty,
    minQty:          item.minQty,
    unit:            item.unit,
    category:        item.category,
    storageLocation: item.storageLocation,
    notes:           item.notes,
    expiryDate:      item.expiryDate || "",
    nutrition:       item.nutrition || {},
  };
}

const LOCATION_ICON = {
  Pantry:  Archive,
  Fridge:  Thermometer,
  Freezer: Snowflake,
} as const;

const LOCATION_TAB_CSS: Record<StorageLocation, string> = {
  Pantry:  "cyber-tab-pantry",
  Fridge:  "cyber-tab-fridge",
  Freezer: "cyber-tab-freezer",
};

const LOCATION_CARD_CSS: Record<StorageLocation, string> = {
  Pantry:  "",
  Fridge:  "cyber-fridge",
  Freezer: "cyber-freezer",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExpiryBanner({ items }: { items: PantryItem[] }) {
  const alerts = useMemo(() => {
    return items
      .map((item) => ({ item, expiry: computeExpiry(item) }))
      .filter(({ expiry }) => expiry && (expiry.isExpired || expiry.isWarning))
      .sort((a, b) => a.expiry!.daysLeft - b.expiry!.daysLeft);
  }, [items]);

  if (alerts.length === 0) return null;

  return (
    <div className="cyber-expiry-banner">
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#ff9500" }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold" style={{ color: "#ff9500" }}>
          {alerts.length} item{alerts.length > 1 ? "s" : ""} need attention
        </p>
        <ul className="mt-1 flex flex-col gap-0.5">
          {alerts.slice(0, 5).map(({ item, expiry }) => (
            <li key={item.id} className="text-xs text-text-secondary">
              <span className="font-medium">
                {item.brand ? `${item.brand} ` : ""}{item.name}
              </span>
              {" — "}
              {expiry!.isExpired
                ? <span style={{ color: "#ff006e" }} className="font-medium">EXPIRED {Math.abs(expiry!.daysLeft)}d ago</span>
                : <span style={{ color: "#ff9500" }}>{expiry!.daysLeft}d left</span>}
              <span className="text-text-tertiary ml-1">({item.storageLocation})</span>
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
    ["Energy",               `${n.energyKj ?? "—"} kJ / ${n.energyKcal ?? "—"} kcal`],
    ["Protein",              n.protein        != null ? `${n.protein} g`        : "—"],
    ["Carbohydrates",        n.carbohydrates  != null ? `${n.carbohydrates} g`  : "—"],
    ["  Sugars",             n.sugars         != null ? `${n.sugars} g`         : "—"],
    ["Total Fat",            n.fat            != null ? `${n.fat} g`            : "—"],
    ["  Saturated Fat",      n.saturatedFat   != null ? `${n.saturatedFat} g`   : "—"],
    ["Dietary Fibre",        n.fibre          != null ? `${n.fibre} g`          : "—"],
    ["Sodium",               n.sodium         != null ? `${n.sodium} mg`        : "—"],
  ];
  return (
    <div className="cyber-nutrition-panel">
      <p className="cyber-section-label mb-1.5">Nutrition per {n.servingSize || "100g"}</p>
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
  item:       PantryItem;
  showMax:    boolean;
  onEdit:     () => void;
  onDelete:   () => void;
  onAddToList:() => void;
}

function ItemCard({ item, showMax, onEdit, onDelete, onAddToList }: ItemCardProps) {
  const [showNutrition, setShowNutrition] = useState(false);
  const status = computeStatus(item);
  const expiry = computeExpiry(item);
  const pct    = item.maxQty > 0 ? Math.min(item.currentQty / item.maxQty, 1) : 0;

  return (
    <div className={cn(
      "cyber-card group p-4 flex flex-col gap-2.5",
      LOCATION_CARD_CSS[item.storageLocation],
      expiry?.isExpired && "expiry-expired",
      expiry?.isWarning && !expiry.isExpired && "expiry-warning",
    )}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {item.brand && (
            <p className="text-[10px] font-mono tracking-wider text-text-tertiary uppercase truncate">
              {item.brand}
            </p>
          )}
          <p className="font-medium text-sm truncate leading-tight">{item.name}</p>
          <p className="text-xs text-text-tertiary mt-0.5">{item.category}</p>
        </div>
        <span className={cn("text-[11px] font-mono tracking-wider uppercase shrink-0", STATUS_CSS[status])}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {/* Quantity + stock bar */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold font-mono">
            {showMax ? fmtQty(item.maxQty, item.unit) : fmtQty(item.currentQty, item.unit)}
          </span>
          <span className="text-[10px] text-text-tertiary font-mono">
            {showMax ? "max" : `/ ${fmtQty(item.maxQty, item.unit)}`}
          </span>
        </div>
        <div className="cyber-stock-track">
          <div
            className={cn("cyber-stock-fill", pct >= 1 ? "ok" : pct > 0 ? "low" : "out")}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-text-tertiary font-mono">
          min {fmtQty(item.minQty, item.unit)}
        </p>
      </div>

      {/* Expiry */}
      {expiry && (
        <div className={cn(
          "text-xs flex items-center gap-1",
          expiry.isExpired ? "text-[#ff006e]" : "text-[#ff9500]",
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

      {showNutrition && item.nutrition && Object.keys(item.nutrition).length > 0 && (
        <NutritionPanel nutrition={item.nutrition} />
      )}

      {/* Action bar — visible on hover */}
      <div className="flex items-center gap-1 mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
        <Button ghost size="icon" className="h-6 w-6" onClick={onEdit} aria-label="Edit">
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          ghost size="icon"
          className="h-6 w-6 text-destructive"
          onClick={onDelete} aria-label="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        <Button
          ghost size="icon"
          className="h-6 w-6 text-text-secondary"
          onClick={onAddToList} aria-label="Add to shopping list"
          title="Add to shopping list"
        >
          <ShoppingCart className="h-3 w-3" />
        </Button>
        {item.nutrition && Object.keys(item.nutrition).length > 0 && (
          <Button
            ghost size="icon"
            className="h-6 w-6 text-text-secondary"
            onClick={() => setShowNutrition((v) => !v)}
            aria-label="Toggle nutrition"
            title="Show/hide nutrition info"
          >
            <Info className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Guide Section ────────────────────────────────────────────────────────────

function GuideSection() {
  const [open, setOpen] = useState(false);

  const cards = [
    {
      icon: Archive,
      color: "#00e5ff",
      title: "Storage Locations",
      desc: "Switch between Pantry, Fridge, and Freezer tabs at the top. Items are tracked separately per location. Add items to the right place when creating or scanning.",
    },
    {
      icon: Plus,
      color: "#00e5ff",
      title: "Adding Items",
      desc: "Tap '+ Add Item' to manually add a product. Enter the name, brand, category, and quantities. Optionally set an expiry date and nutritional info.",
    },
    {
      icon: Camera,
      color: "#00e5ff",
      title: "Image Scan",
      desc: "Tap 'Scan Image' and upload a photo of your shelves or groceries. AI identifies items and quantities. Tick the ones you want, edit quantities if needed, then add.",
    },
    {
      icon: ShoppingCart,
      color: "#ff006e",
      title: "Shopping List",
      desc: "Items that fall to or below their minimum threshold auto-appear in the list. Add extras manually. Tick items you've bought, then tap 'Mark Purchased' to update stock.",
    },
    {
      icon: AlertTriangle,
      color: "#ff9500",
      title: "Expiry Tracking",
      desc: "Set a best-before date on any item. An alert banner appears when less than 10% of shelf life remains. Expired items are flagged in red.",
    },
    {
      icon: Info,
      color: "#00e5ff",
      title: "Nutrition Info",
      desc: "Each item stores SA nutritional values (per 100g, Reg R146): energy in kJ, protein, carbs, fat, sodium. Use 'AI Lookup' in the add form to auto-fill for SA products.",
    },
  ] as const;

  return (
    <div className="cyber-guide">
      <button className="cyber-guide-header" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" />
          <span>How to use · Inventory Manager Guide</span>
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="p-4 pt-0 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="cyber-guide-card">
                <Icon className="h-7 w-7 cyber-guide-icon" style={{ color }} />
                <p className="cyber-guide-title" style={{ color }}>{title}</p>
                <p className="cyber-guide-desc">{desc}</p>
              </div>
            ))}
          </div>

          {/* Stock bar legend */}
          <div className="cyber-guide-card">
            <p className="cyber-guide-title" style={{ color: "#00e5ff" }}>Stock Level Bar</p>
            <div className="flex flex-wrap gap-6 mt-1">
              {[
                { cls: "ok",  label: "OK — stock is above minimum" },
                { cls: "low", label: "Low — at or near the minimum threshold" },
                { cls: "out", label: "Out — no stock remaining" },
              ].map(({ cls, label }) => (
                <div key={cls} className="flex items-center gap-2">
                  <div className={`h-2 w-10 rounded cyber-stock-fill ${cls}`} />
                  <span className="cyber-guide-desc">{label}</span>
                </div>
              ))}
            </div>
            <p className="cyber-guide-desc mt-2">
              Items at <span style={{ color: "#ff9500" }}>Low</span> or{" "}
              <span style={{ color: "#ff006e" }}>Out</span> status are automatically
              added to your Shopping List. Set your minimum threshold in the item settings.
            </p>
          </div>

          {/* SA note */}
          <p className="text-[11px] text-text-tertiary text-center font-mono">
            Calibrated for South Africa · Durban region · SA Reg R146 nutritional labelling
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PantryPage() {
  const { setTitle } = usePageHeader();
  const { toast, showToast } = useToast();

  const [items, setItems]     = useState<PantryItem[]>(() => loadItems());
  const [shopping, setShopping] = useState<ShoppingEntry[]>(() => loadShoppingList());

  // View state
  const [activeLocation, setActiveLocation] = useState<StorageLocation>("Pantry");
  const [search, setSearch]     = useState("");
  const [activeCat, setActiveCat] = useState<Category>("All");
  const [showMax, setShowMax]   = useState(false);

  // Dialogs
  const [addOpen, setAddOpen]       = useState(false);
  const [editTarget, setEditTarget] = useState<PantryItem | null>(null);
  const [form, setForm]             = useState<FormState>(BLANK_FORM);
  const [showNutritionForm, setShowNutritionForm] = useState(false);
  const [lookingUpNutrition, setLookingUpNutrition] = useState(false);

  const [scanOpen, setScanOpen]     = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState("");
  const [imgPreview, setImgPreview] = useState("");
  const [scanning, setScanning]     = useState(false);
  const [detected, setDetected]     = useState<DetectedItemEditable[]>([]);

  const [listOpen, setListOpen]     = useState(false);
  const [listForm, setListForm]     = useState({
    name: "", brand: "", neededQty: 1, unit: "",
    category: "Other" as Exclude<Category, "All">,
    notes: "",
  });
  const [listSearchOpen, setListSearchOpen] = useState(false);
  const [listSearchQ, setListSearchQ]       = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTitle("Inventory"); }, [setTitle]);
  useEffect(() => { saveItems(items); }, [items]);
  useEffect(() => { saveShoppingList(shopping); }, [shopping]);

  // Reset category filter when switching location tabs
  useEffect(() => { setActiveCat("All"); }, [activeLocation]);

  // Auto-sync: items at/below threshold → ensure they appear in shopping list
  useEffect(() => {
    const lowItems = items.filter((i) => computeStatus(i) !== "ok");
    if (lowItems.length === 0) return;
    setShopping((prev) => {
      const existingIds = new Set(prev.map((e) => e.pantryItemId).filter(Boolean));
      const toAdd: ShoppingEntry[] = lowItems
        .filter((i) => !existingIds.has(i.id))
        .map((i) => ({
          id:              crypto.randomUUID(),
          pantryItemId:    i.id,
          name:            i.name,
          brand:           i.brand,
          neededQty:       Math.max(i.maxQty - i.currentQty, 1),
          unit:            i.unit,
          category:        i.category,
          storageLocation: i.storageLocation,
          notes:           "",
          checked:         false,
          addedManually:   false,
        }));
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
    });
  }, [items]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (item.storageLocation !== activeLocation) return false;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.brand.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q);
      const matchCat = activeCat === "All" || item.category === activeCat;
      return matchSearch && matchCat;
    });
  }, [items, search, activeCat, activeLocation]);

  const locationCounts = useMemo(() => {
    return LOCATIONS.reduce<Record<StorageLocation, number>>((acc, loc) => {
      acc[loc] = items.filter((i) => i.storageLocation === loc).length;
      return acc;
    }, { Pantry: 0, Fridge: 0, Freezer: 0 });
  }, [items]);

  const catCounts = useMemo(() => {
    const locItems = items.filter((i) => i.storageLocation === activeLocation);
    return CATEGORIES.reduce<Record<string, number>>((acc, c) => {
      acc[c] = c === "All"
        ? locItems.length
        : locItems.filter((i) => i.category === c).length;
      return acc;
    }, {});
  }, [items, activeLocation]);

  const listCount = shopping.filter((e) => !e.checked).length;
  const checkedCount = shopping.filter((e) => e.checked).length;

  // ── Item CRUD ──────────────────────────────────────────────────────────────

  const openAdd = useCallback(() => {
    setForm({ ...BLANK_FORM, storageLocation: activeLocation });
    setEditTarget(null);
    setShowNutritionForm(false);
    setAddOpen(true);
  }, [activeLocation]);

  const openEdit = useCallback((item: PantryItem) => {
    setForm(itemToForm(item));
    setEditTarget(item);
    setShowNutritionForm(!!item.nutrition && Object.keys(item.nutrition).length > 0);
    setAddOpen(true);
  }, []);

  const saveItem = useCallback(() => {
    if (!form.name.trim()) return;
    const now = new Date().toISOString();
    const nutrition =
      showNutritionForm && Object.keys(form.nutrition).length > 0
        ? form.nutrition
        : undefined;

    if (editTarget) {
      setItems((prev) =>
        prev.map((i) =>
          i.id !== editTarget.id ? i : {
            ...editTarget,
            name:            form.name.trim(),
            brand:           form.brand.trim(),
            currentQty:      form.currentQty,
            maxQty:          form.maxQty,
            minQty:          form.minQty,
            unit:            form.unit.trim(),
            category:        form.category,
            storageLocation: form.storageLocation,
            notes:           form.notes.trim(),
            expiryDate:      form.expiryDate || undefined,
            nutrition,
          },
        ),
      );
      showToast("Item updated", "success");
    } else {
      setItems((prev) => [
        {
          id:              crypto.randomUUID(),
          name:            form.name.trim(),
          brand:           form.brand.trim(),
          currentQty:      form.currentQty,
          maxQty:          form.maxQty,
          minQty:          form.minQty,
          unit:            form.unit.trim(),
          category:        form.category,
          storageLocation: form.storageLocation,
          notes:           form.notes.trim(),
          expiryDate:      form.expiryDate || undefined,
          addedAt:         now,
          nutrition,
        },
        ...prev,
      ]);
      showToast(`Added to ${form.storageLocation}`, "success");
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
      return [
        ...prev,
        {
          id:              crypto.randomUUID(),
          pantryItemId:    item.id,
          name:            item.name,
          brand:           item.brand,
          neededQty:       Math.max(item.maxQty - item.currentQty, 1),
          unit:            item.unit,
          category:        item.category,
          storageLocation: item.storageLocation,
          notes:           "",
          checked:         false,
          addedManually:   true,
        },
      ];
    });
    showToast(`${item.name} → Shopping List`, "success");
  }, [showToast]);

  // ── Nutrition AI Lookup ───────────────────────────────────────────────────

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
        body: JSON.stringify({
          item_name: form.name.trim(),
          brand:     form.brand.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const n = data.nutrition || {};
      setForm((f) => ({
        ...f,
        nutrition: {
          servingSize:   n.serving_size || "100g",
          energyKj:      n.energy_kj || 0,
          energyKcal:    n.energy_kcal || 0,
          protein:       n.protein_g || 0,
          carbohydrates: n.carbohydrates_g || 0,
          sugars:        n.sugars_g || 0,
          fat:           n.fat_g || 0,
          saturatedFat:  n.saturated_fat_g || 0,
          fibre:         n.fibre_g || 0,
          sodium:        n.sodium_mg || 0,
        },
      }));
      setShowNutritionForm(true);
      showToast("Nutrition data loaded", "success");
    } catch (err) {
      showToast(`Nutrition lookup failed: ${String(err)}`, "error");
    } finally {
      setLookingUpNutrition(false);
    }
  }, [form.name, form.brand, showToast]);

  // ── Image Scan ────────────────────────────────────────────────────────────

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
      const parsed: DetectedItemEditable[] = (data.items || []).map(
        (raw: Record<string, unknown>) => {
          const qty = typeof raw.quantity === "number" ? raw.quantity : 1;
          return {
            name:     String(raw.name || "Unknown"),
            brand:    String(raw.brand || ""),
            quantity: qty,
            unit:     String(raw.unit || ""),
            category: VALID_CATS.includes(raw.category as Exclude<Category, "All">)
              ? (raw.category as Exclude<Category, "All">)
              : "Other",
            selected: true,
            editQty:  qty,
          };
        },
      );
      setDetected(parsed);
      if (parsed.length === 0) showToast("No pantry items detected in image", "error");
    } catch (err) {
      showToast(`Scan failed: ${String(err)}`, "error");
    } finally {
      setScanning(false);
    }
  }, [imgDataUrl, showToast]);

  const addSelectedDetected = useCallback(() => {
    const toAdd = detected.filter((d) => d.selected);
    if (toAdd.length === 0) {
      showToast("No items selected", "error");
      return;
    }
    const now = new Date().toISOString();
    const newItems: PantryItem[] = toAdd.map((d) => ({
      id:              crypto.randomUUID(),
      name:            d.name,
      brand:           d.brand,
      currentQty:      d.editQty,
      maxQty:          Math.max(d.editQty * 2, 2),
      minQty:          1,
      unit:            d.unit,
      category:        d.category,
      storageLocation: activeLocation,
      notes:           "",
      addedAt:         now,
    }));
    setItems((prev) => [...newItems, ...prev]);
    showToast(
      `Added ${newItems.length} item${newItems.length > 1 ? "s" : ""} to ${activeLocation}`,
      "success",
    );
    setScanOpen(false);
    setImgDataUrl("");
    setImgPreview("");
    setDetected([]);
  }, [detected, activeLocation, showToast]);

  const toggleDetectedSelect = useCallback((idx: number) => {
    setDetected((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, selected: !d.selected } : d)),
    );
  }, []);

  const setDetectedQty = useCallback((idx: number, qty: number) => {
    setDetected((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, editQty: qty } : d)),
    );
  }, []);

  // ── Shopping List ─────────────────────────────────────────────────────────

  const toggleCheck = useCallback((id: string) => {
    setShopping((prev) =>
      prev.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)),
    );
  }, []);

  const removeFromList = useCallback((id: string) => {
    setShopping((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addManualToList = useCallback(() => {
    if (!listForm.name.trim()) return;
    setShopping((prev) => [
      ...prev,
      {
        id:              crypto.randomUUID(),
        name:            listForm.name.trim(),
        brand:           listForm.brand.trim(),
        neededQty:       listForm.neededQty,
        unit:            listForm.unit.trim(),
        category:        listForm.category,
        storageLocation: "Pantry",
        notes:           listForm.notes.trim(),
        checked:         false,
        addedManually:   true,
      },
    ]);
    setListForm({ name: "", brand: "", neededQty: 1, unit: "", category: "Other", notes: "" });
  }, [listForm]);

  // Mark checked items as purchased: update pantry stock + remove from list
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
            // Restock: add purchased amount, cap at max
            return {
              ...item,
              currentQty: Math.min(item.currentQty + entry.neededQty, item.maxQty),
            };
          });
        } else {
          // Unknown item → create new pantry entry
          newPantryItems.push({
            id:              crypto.randomUUID(),
            name:            entry.name,
            brand:           entry.brand,
            currentQty:      entry.neededQty,
            maxQty:          Math.max(entry.neededQty * 2, 2),
            minQty:          1,
            unit:            entry.unit,
            category:        entry.category,
            storageLocation: entry.storageLocation,
            notes:           entry.notes,
            addedAt:         now,
          });
        }
      }

      return [...newPantryItems, ...next];
    });

    // Remove purchased entries from the shopping list
    setShopping((prev) => prev.filter((e) => !e.checked));
    showToast(
      `${purchased.length} item${purchased.length > 1 ? "s" : ""} purchased · inventory updated`,
      "success",
    );
  }, [shopping, showToast]);

  const copyList = useCallback(() => {
    const text = shopping
      .map(
        (e) =>
          `${e.checked ? "✓" : "☐"} ${e.brand ? `${e.brand} ` : ""}${e.name}` +
          `${e.neededQty ? ` – ${fmtQty(e.neededQty, e.unit)}` : ""}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text).then(() =>
      showToast("Shopping list copied", "success"),
    );
  }, [shopping, showToast]);

  const pantrySearchResults = useMemo(() => {
    if (!listSearchQ.trim()) return [];
    const q = listSearchQ.toLowerCase();
    return items
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) || i.brand.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [items, listSearchQ]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="cyber-page flex flex-col gap-0">
      <div className="cyber-content flex flex-col gap-5">

        {/* Expiry alerts */}
        <ExpiryBanner items={items} />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary pointer-events-none" />
            <Input
              placeholder={`Search ${activeLocation.toLowerCase()}…`}
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
                "px-3 py-1 rounded text-[11px] font-mono tracking-widest uppercase border transition-all",
                showMax
                  ? "border-[rgba(0,229,255,0.5)] text-[#00e5ff] bg-[rgba(0,229,255,0.08)]"
                  : "border-current/15 text-text-tertiary hover:border-[rgba(0,229,255,0.3)] hover:text-[#00e5ff]",
              )}
              title={showMax ? "Showing max qty — click for current" : "Showing current qty — click for max"}
            >
              {showMax ? "MAX QTY" : "CURR QTY"}
            </button>

            <Button
              outlined
              size="sm"
              onClick={() => setListOpen(true)}
              className={listCount > 0 ? "border-[rgba(255,0,110,0.4)] text-[#ff006e]" : ""}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              List
              {listCount > 0 && (
                <span
                  className="ml-1.5 rounded px-1 text-[10px] font-bold text-black"
                  style={{ background: "#ff006e" }}
                >
                  {listCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Location tabs */}
        <div className="cyber-tabs -mx-1">
          {LOCATIONS.map((loc) => {
            const Icon = LOCATION_ICON[loc];
            const isActive = activeLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                className={cn(
                  "cyber-tab",
                  LOCATION_TAB_CSS[loc],
                  isActive && "cyber-tab-active",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {loc}
                <span className="opacity-50 text-[10px]">({locationCounts[loc]})</span>
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.filter((c) => c === "All" || catCounts[c] > 0).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={cn("cyber-cat-chip", activeCat === cat && "active")}
            >
              {cat}
              <span className="ml-1 opacity-50">({catCounts[cat]})</span>
            </button>
          ))}
        </div>

        {/* Item grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-text-secondary">
            {(() => {
              const Icon = LOCATION_ICON[activeLocation];
              return <Icon className="h-14 w-14 opacity-10" style={{ color: "#00e5ff" }} />;
            })()}
            <p className="text-sm text-center max-w-xs">
              {items.filter((i) => i.storageLocation === activeLocation).length === 0
                ? `Your ${activeLocation} is empty — add items manually or scan an image.`
                : "No items match your search."}
            </p>
            {items.filter((i) => i.storageLocation === activeLocation).length === 0 && (
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

        {/* Guide section */}
        <GuideSection />

        {/* ── Add / Edit Dialog ──────────────────────────────────────── */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto cyber-scroll">
            <DialogHeader>
              <DialogTitle>{editTarget ? "Edit Item" : "Add Item"}</DialogTitle>
              <DialogDescription>South African inventory — Durban region</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">

              {/* Storage location selector */}
              <div>
                <p className="cyber-section-label mb-2">Storage Location</p>
                <div className="flex gap-2">
                  {LOCATIONS.map((loc) => {
                    const Icon = LOCATION_ICON[loc];
                    const active = form.storageLocation === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, storageLocation: loc }))}
                        className={cn(
                          "flex-1 flex flex-col items-center gap-1 p-2 rounded border text-[11px] font-mono uppercase tracking-wider transition-all",
                          active
                            ? "border-[rgba(0,229,255,0.5)] bg-[rgba(0,229,255,0.08)] text-[#00e5ff]"
                            : "border-current/15 text-text-tertiary hover:border-[rgba(0,229,255,0.25)]",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>

              <hr className="border-current/10" />

              {/* Basic info */}
              <section className="flex flex-col gap-3">
                <p className="cyber-section-label">Basic Info</p>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Item Name *</label>
                  <Input
                    autoFocus
                    placeholder="e.g. Baked Beans, Full Cream Milk…"
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
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value as Exclude<Category, "All"> }))
                      }
                    >
                      {VALID_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Unit</label>
                    <Input
                      placeholder="kg, L, cans, pcs…"
                      value={form.unit}
                      list="unit-list"
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    />
                    <datalist id="unit-list">
                      {["cans","bottles","boxes","bags","kg","g","L","ml","pcs","loaves","packets","jars","sachets","tubs"].map((u) => (
                        <option key={u} value={u} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Notes (optional)</label>
                  <Input
                    placeholder="e.g. No added sugar, for baking…"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </section>

              <hr className="border-current/10" />

              {/* Stock & thresholds */}
              <section className="flex flex-col gap-3">
                <p className="cyber-section-label">Stock & Thresholds</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Current</label>
                    <Input
                      type="number" min={0} step={0.5}
                      value={form.currentQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, currentQty: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Max</label>
                    <Input
                      type="number" min={1} step={0.5}
                      value={form.maxQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxQty: parseFloat(e.target.value) || 1 }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-text-secondary mb-1 block">Min / Alert</label>
                    <Input
                      type="number" min={0} step={0.5}
                      value={form.minQty}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, minQty: parseFloat(e.target.value) || 0 }))
                      }
                      title="Auto-adds to shopping list when current ≤ this number"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-text-tertiary -mt-1">
                  Shopping list auto-update triggers when Current ≤ Min
                </p>
              </section>

              <hr className="border-current/10" />

              {/* Expiry */}
              <section className="flex flex-col gap-2">
                <p className="cyber-section-label">Expiry Date</p>
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                />
                <p className="text-[11px] text-text-tertiary">
                  Alert fires when ≤10% of shelf life remains
                </p>
              </section>

              <hr className="border-current/10" />

              {/* Nutrition */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="cyber-section-label">Nutritional Info (per 100g)</p>
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
                      type="button"
                      className="text-xs text-text-secondary hover:text-text-primary"
                      onClick={() => setShowNutritionForm((v) => !v)}
                    >
                      {showNutritionForm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {showNutritionForm && (
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { key: "energyKj",      label: "Energy (kJ)" },
                        { key: "energyKcal",    label: "Energy (kcal)" },
                        { key: "protein",       label: "Protein (g)" },
                        { key: "carbohydrates", label: "Carbohydrates (g)" },
                        { key: "sugars",        label: "Sugars (g)" },
                        { key: "fat",           label: "Total Fat (g)" },
                        { key: "saturatedFat",  label: "Saturated Fat (g)" },
                        { key: "fibre",         label: "Dietary Fibre (g)" },
                        { key: "sodium",        label: "Sodium (mg)" },
                      ] as { key: keyof NutritionInfo; label: string }[]
                    ).map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[11px] text-text-tertiary mb-0.5 block">{label}</label>
                        <Input
                          type="number" min={0} step={0.1}
                          placeholder="0"
                          value={(form.nutrition[key] as number) ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              nutrition: { ...f.nutrition, [key]: parseFloat(e.target.value) || 0 },
                            }))
                          }
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
                {editTarget ? "Save Changes" : "Add to Inventory"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Image Scan Dialog ─────────────────────────────────────── */}
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto cyber-scroll">
            <DialogHeader>
              <DialogTitle>Scan Image</DialogTitle>
              <DialogDescription>
                Upload a photo of your {activeLocation.toLowerCase()}, shelves, or groceries.
                Select the items you want to add and confirm quantities.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {imgPreview && (
                <img
                  src={imgPreview}
                  alt="Preview"
                  className="w-full max-h-44 object-contain rounded"
                  style={{ border: "1px solid rgba(0,229,255,0.15)" }}
                />
              )}

              <div className="flex gap-2">
                <Button outlined size="sm" className="flex-1" onClick={() => imageInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {imgPreview ? "Change" : "Select Image"}
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
                    <p className="cyber-section-label">
                      {detected.filter((d) => d.selected).length} of {detected.length} selected
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="text-xs text-text-tertiary hover:text-text-primary"
                        onClick={() => setDetected((d) => d.map((i) => ({ ...i, selected: true })))}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        className="text-xs text-text-tertiary hover:text-text-primary"
                        onClick={() => setDetected((d) => d.map((i) => ({ ...i, selected: false })))}
                      >
                        None
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-1 cyber-scroll">
                    {detected.map((item, i) => (
                      <div
                        key={i}
                        className={cn("cyber-scan-row", !item.selected && "deselected")}
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleDetectedSelect(i)}
                          className="h-4 w-4 shrink-0"
                          style={{ accentColor: "#00e5ff" }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {item.brand
                              ? <span className="text-text-tertiary">{item.brand} </span>
                              : null}
                            {item.name}
                          </p>
                          <p className="text-xs text-text-tertiary">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Input
                            type="number"
                            min={0}
                            step={0.5}
                            value={item.editQty}
                            onChange={(e) => setDetectedQty(i, parseFloat(e.target.value) || 0)}
                            className="h-6 w-14 text-xs text-center"
                            disabled={!item.selected}
                          />
                          {item.unit && (
                            <span className="text-xs text-text-tertiary w-8 truncate">{item.unit}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                outlined
                onClick={() => {
                  setScanOpen(false);
                  setDetected([]);
                  setImgDataUrl("");
                  setImgPreview("");
                }}
              >
                Cancel
              </Button>
              {detected.length > 0 && (
                <Button
                  onClick={addSelectedDetected}
                  disabled={!detected.some((d) => d.selected)}
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Add {detected.filter((d) => d.selected).length} to {activeLocation}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Shopping List Dialog ──────────────────────────────────── */}
        <Dialog open={listOpen} onOpenChange={setListOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto cyber-scroll">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Shopping List
                {listCount > 0 && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold text-black"
                    style={{ background: "#ff006e" }}
                  >
                    {listCount}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                Tick items you've bought, then tap "Mark Purchased" to update your inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">

              {shopping.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">
                  Shopping list is empty. Items appear here automatically when stock is low.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {shopping.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded border transition-all",
                        entry.checked
                          ? "opacity-55 border-[rgba(57,255,20,0.2)] bg-[rgba(57,255,20,0.03)]"
                          : "border-current/15 hover:border-[rgba(0,229,255,0.25)]",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={entry.checked}
                        onChange={() => toggleCheck(entry.id)}
                        className="h-4 w-4 shrink-0"
                        style={{ accentColor: "#39ff14" }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", entry.checked && "line-through")}>
                          {entry.brand && (
                            <span className="text-text-tertiary">{entry.brand} </span>
                          )}
                          {entry.name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {entry.neededQty > 0 && fmtQty(entry.neededQty, entry.unit)}
                          {" · "}{entry.storageLocation}
                          {!entry.addedManually && " · auto"}
                          {entry.checked && (
                            <span style={{ color: "#39ff14" }}> · bought ✓</span>
                          )}
                        </p>
                      </div>
                      <Button
                        ghost size="icon"
                        className="h-6 w-6 text-text-tertiary shrink-0"
                        onClick={() => removeFromList(entry.id)}
                        aria-label="Remove from list"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {checkedCount > 0 && (
                <div
                  className="rounded p-3 flex items-center justify-between"
                  style={{ background: "rgba(57,255,20,0.05)", border: "1px solid rgba(57,255,20,0.2)" }}
                >
                  <p className="text-xs text-text-secondary">
                    <span style={{ color: "#39ff14" }} className="font-semibold">{checkedCount}</span>
                    {" "}item{checkedCount > 1 ? "s" : ""} ready to mark as purchased
                  </p>
                  <Button size="sm" onClick={finalisePurchases}>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Mark Purchased
                  </Button>
                </div>
              )}

              {/* Add items to list */}
              <div
                className="rounded p-3 flex flex-col gap-3"
                style={{ border: "1px solid rgba(0,229,255,0.08)", background: "rgba(0,229,255,0.02)" }}
              >
                <p className="cyber-section-label">Add to List</p>

                {/* Search existing pantry items */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-secondary pointer-events-none" />
                  <Input
                    placeholder="Search inventory items to add…"
                    value={listSearchQ}
                    onChange={(e) => { setListSearchQ(e.target.value); setListSearchOpen(true); }}
                    onFocus={() => setListSearchOpen(true)}
                    onBlur={() => setTimeout(() => setListSearchOpen(false), 150)}
                    className="text-sm pl-8"
                  />
                  {listSearchOpen && pantrySearchResults.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 z-50 mt-1 rounded shadow-lg"
                      style={{ border: "1px solid rgba(0,229,255,0.2)", background: "var(--color-background-base)" }}
                    >
                      {pantrySearchResults.map((item) => (
                        <button
                          key={item.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-[rgba(0,229,255,0.05)] flex items-center justify-between"
                          onMouseDown={() => {
                            addItemToShoppingList(item);
                            setListSearchQ("");
                            setListSearchOpen(false);
                          }}
                        >
                          <span>
                            {item.brand ? `${item.brand} ` : ""}{item.name}
                          </span>
                          <span className="text-xs text-text-tertiary">{item.storageLocation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-text-tertiary text-center">— or add something new —</p>

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
                    type="number" min={0}
                    placeholder="Qty"
                    value={listForm.neededQty || ""}
                    onChange={(e) =>
                      setListForm((f) => ({ ...f, neededQty: parseFloat(e.target.value) || 1 }))
                    }
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
                    onChange={(e) =>
                      setListForm((f) => ({ ...f, category: e.target.value as Exclude<Category, "All"> }))
                    }
                  >
                    {VALID_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Button
                  size="sm" outlined
                  onClick={addManualToList}
                  disabled={!listForm.name.trim()}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add to List
                </Button>
              </div>
            </div>

            <DialogFooter className="flex-wrap gap-2">
              <Button outlined size="sm" onClick={copyList}>
                <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Copy List
              </Button>
              <Button size="sm" outlined onClick={() => setListOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ─────────────────────────────────────────── */}
        <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Item</DialogTitle>
              <DialogDescription>
                Remove this item from your inventory? It will also be removed from the shopping list.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button outlined onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button
                ghost className="text-destructive"
                onClick={() => deleteId && deleteItem(deleteId)}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Toast toast={toast} />
      </div>
    </div>
  );
}
