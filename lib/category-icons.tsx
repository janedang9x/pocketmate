import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  Coffee,
  Dumbbell,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Plane,
  Receipt,
  ShoppingBasket,
  Sparkles,
  Tag,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";

export const CATEGORY_ICON_NAMES = [
  "tag",
  "wallet",
  "receipt",
  "shopping-basket",
  "utensils",
  "coffee",
  "home",
  "wrench",
  "bus",
  "car",
  "heart",
  "dumbbell",
  "sparkles",
  "gift",
  "book",
  "graduation",
  "briefcase",
  "banknote",
  "dollar-circle",
  "landmark",
  "plane",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_NAMES)[number];

export const CATEGORY_ICON_OPTIONS: { value: CategoryIconName; label: string }[] = [
  { value: "tag", label: "Tag" },
  { value: "wallet", label: "Wallet" },
  { value: "receipt", label: "Receipt" },
  { value: "shopping-basket", label: "Shopping basket" },
  { value: "utensils", label: "Food" },
  { value: "coffee", label: "Coffee" },
  { value: "home", label: "Home" },
  { value: "wrench", label: "Tools" },
  { value: "bus", label: "Transport" },
  { value: "car", label: "Car" },
  { value: "heart", label: "Health" },
  { value: "dumbbell", label: "Fitness" },
  { value: "sparkles", label: "Lifestyle" },
  { value: "gift", label: "Gift" },
  { value: "book", label: "Book" },
  { value: "graduation", label: "Education" },
  { value: "briefcase", label: "Work" },
  { value: "banknote", label: "Cash" },
  { value: "dollar-circle", label: "Income" },
  { value: "landmark", label: "Investment" },
  { value: "plane", label: "Travel" },
];

const CATEGORY_ICON_MAP: Record<CategoryIconName, LucideIcon> = {
  tag: Tag,
  wallet: Wallet,
  receipt: Receipt,
  "shopping-basket": ShoppingBasket,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  home: Home,
  wrench: Wrench,
  bus: Bus,
  car: Car,
  heart: HeartPulse,
  dumbbell: Dumbbell,
  sparkles: Sparkles,
  gift: Gift,
  book: BookOpen,
  graduation: GraduationCap,
  briefcase: Briefcase,
  banknote: Banknote,
  "dollar-circle": CircleDollarSign,
  landmark: Landmark,
  plane: Plane,
};

const DEFAULT_EXPENSE_ICON_BY_NAME: Record<string, CategoryIconName> = {
  "Food & Drinks": "utensils",
  Groceries: "shopping-basket",
  Delivery: "receipt",
  "Dining Out": "utensils",
  "Junk Food": "coffee",
  "Coffee & Drinks": "coffee",
  Housing: "home",
  "Rent/Mortgage": "home",
  Utilities: "receipt",
  "Furniture & Appliances": "home",
  "Property management fee": "receipt",
  "Home maintenance": "wrench",
  Household: "home",
  "Household Supplies": "shopping-basket",
  Helper: "briefcase",
  Transportation: "car",
  Fuel: "car",
  "Taxi & Public Transportation": "bus",
  "Parking & Toll": "receipt",
  "Vehicle maintenance": "wrench",
  Children: "graduation",
  "Tuition fee": "graduation",
  "Education supplies": "book",
  Toys: "gift",
  Health: "heart",
  "Medical checkups": "heart",
  Medications: "heart",
  "Sports & Fitness": "dumbbell",
  Lifestyle: "sparkles",
  Travel: "plane",
  "Entertainment & Leisure": "sparkles",
  "Beauty & Self-care": "sparkles",
  "Family & Social": "gift",
  Gifts: "gift",
  "Weddings & Funerals": "gift",
  "Holiday & Festivals (Tet...)": "gift",
  "Family gatherings": "home",
  "Social gatherings": "briefcase",
  "Personal Development": "book",
  "Courses & Training": "graduation",
  Books: "book",
  Subscriptions: "receipt",
  Others: "tag",
  Other: "tag",
};

const DEFAULT_INCOME_ICON_BY_NAME: Record<string, CategoryIconName> = {
  Salary: "briefcase",
  Freelance: "wallet",
  Investment: "landmark",
  "House rent": "home",
  Other: "tag",
};

export function isCategoryIconName(value: string | null | undefined): value is CategoryIconName {
  return Boolean(value && CATEGORY_ICON_NAMES.includes(value as CategoryIconName));
}

export function getCategoryIconName(
  icon: string | null | undefined,
  name: string,
  kind: "expense" | "income",
): CategoryIconName {
  if (isCategoryIconName(icon)) {
    return icon;
  }
  const defaults = kind === "expense" ? DEFAULT_EXPENSE_ICON_BY_NAME : DEFAULT_INCOME_ICON_BY_NAME;
  return defaults[name] ?? "tag";
}

export function getCategoryIconComponent(iconName: CategoryIconName): LucideIcon {
  return CATEGORY_ICON_MAP[iconName];
}
