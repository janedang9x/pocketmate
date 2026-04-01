"use client";

import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { CATEGORY_ICON_OPTIONS } from "@/lib/category-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryIconSelectProps {
  value?: string;
  onChange: (value: string) => void;
  kind: "expense" | "income";
  placeholder: string;
  triggerId?: string;
}

export function CategoryIconSelect({
  value,
  onChange,
  kind,
  placeholder,
  triggerId,
}: CategoryIconSelectProps) {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger id={triggerId}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {CATEGORY_ICON_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            <span className="flex items-center gap-2">
              <CategoryIcon icon={opt.value} name={opt.label} kind={kind} />
              <span>{opt.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
