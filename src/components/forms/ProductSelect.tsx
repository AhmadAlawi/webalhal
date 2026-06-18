"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/context/I18nContext";
import { useLocalizedLabel } from "@/hooks/useLocalizedLabel";
import { getProducts } from "@/services/catalog";
import type { LocalizableRecord } from "@/lib/localized-value";
import {
  dedupeProductsByProductId,
  normalizeProductId,
  type ProductSelectValue,
} from "@/lib/product-id";
import type { Product } from "@/types/farm";

export function ProductSelect({
  productId,
  onChange,
  label,
}: {
  productId: ProductSelectValue;
  onChange: (id: ProductSelectValue, product?: Product) => void;
  label?: string;
}) {
  const { t } = useI18n();
  const { localized } = useLocalizedLabel();
  const displayLabel = label ?? t("forms.product.label");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedProductId = normalizeProductId(productId);
  const productOptions = dedupeProductsByProductId(products);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{displayLabel}</span>
      <select
        className="rounded-xl border border-gray-200 px-3 py-2.5"
        value={selectedProductId}
        disabled={loading}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange("");
            return;
          }

          const id = normalizeProductId(Number(e.target.value));
          onChange(id, productOptions.find((p) => p.productId === id));
        }}
      >
        <option value="">{t("forms.product.select")}</option>
        {productOptions.map((p) => (
          <option key={p.productId} value={p.productId}>
            {localized(p as unknown as LocalizableRecord, "name", `#${p.productId}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
