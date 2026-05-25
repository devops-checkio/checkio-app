"use client";

import { CHEKIOButton, CHEKIOInput } from "@/components";
import type { SubOrganizationalUnitListItemDto } from "@/dto/structure";
import { Check, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

enum ButtonVariant {
  SecondaryBlue = "secondaryBlue",
}

export interface ParentSubUnitPickerProps {
  parents: SubOrganizationalUnitListItemDto[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  errorMessage?: string;
}

export function ParentSubUnitPicker({
  parents,
  value,
  onChange,
  disabled = false,
  errorMessage,
}: ParentSubUnitPickerProps) {
  const tLevel = useTranslations("mantainers.structures.levelDetail");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parents;
    return parents.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const code = (p.code ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [parents, query]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const toggle = (publicId: string) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(publicId)) {
      next.delete(publicId);
    } else {
      next.add(publicId);
    }
    onChange([...next]);
  };

  const handleSelectFiltered = () => {
    if (disabled) return;
    const next = new Set([...value, ...filtered.map((p) => p.publicId)]);
    onChange([...next]);
  };

  const handleSelectAllParents = () => {
    if (disabled) return;
    onChange(parents.map((p) => p.publicId));
  };

  const handleClear = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <CHEKIOInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tLevel("parentsSearchPlaceholder")}
        disabled={disabled}
        className="w-full"
        aria-label={tLevel("parentsSearchAria")}
      />
      <div className="flex flex-wrap gap-2">
        <CHEKIOButton
          type="button"
          variant={ButtonVariant.SecondaryBlue}
          size="sm"
          onClick={handleSelectFiltered}
          disabled={disabled || filtered.length === 0}
          className="text-xs"
        >
          {tLevel("parentsSelectFiltered")}
        </CHEKIOButton>
        <CHEKIOButton
          type="button"
          variant={ButtonVariant.SecondaryBlue}
          size="sm"
          onClick={handleSelectAllParents}
          disabled={disabled || parents.length === 0}
          className="text-xs"
        >
          {tLevel("parentsSelectAll")}
        </CHEKIOButton>
        <CHEKIOButton
          type="button"
          variant={ButtonVariant.SecondaryBlue}
          size="sm"
          onClick={handleClear}
          disabled={disabled || value.length === 0}
          className="text-xs"
        >
          {tLevel("parentsClear")}
        </CHEKIOButton>
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50">
        {filtered.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-6 text-sm text-gray-500 justify-center">
            <Search className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
            {parents.length === 0
              ? tLevel("parentsEmpty")
              : tLevel("parentsNoMatches")}
          </div>
        ) : (
          <ul
            className="divide-y divide-gray-200"
            role="listbox"
            aria-label={tLevel("parents")}
            aria-multiselectable="true"
          >
            {filtered.map((p) => {
              const selected = selectedSet.has(p.publicId);
              return (
                <li key={p.publicId}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(p.publicId)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors disabled:opacity-50 ${
                      selected
                        ? "bg-blue-50 text-gray-900"
                        : "bg-white text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-selected={selected}
                    role="option"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                      aria-hidden
                    >
                      {selected ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {p.name ?? "—"}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {p.code ?? "—"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="text-xs text-gray-600">
        {tLevel("parentsSelectedCount", { count: value.length })}
      </p>
      <p className="text-xs text-gray-500">{tLevel("parentsPickerHint")}</p>
      {errorMessage ? (
        <p className="text-sm text-red-500" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
