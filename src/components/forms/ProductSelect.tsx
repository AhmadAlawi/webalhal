"use client";

import { useEffect, useState } from "react";
import { getProducts } from "@/services/catalog";
import type { Product } from "@/types/farm";

export function ProductSelect({
  productId,
  onChange,
  label = "المنتج",
}: {
  productId: number | "";
  onChange: (id: number, product?: Product) => void;
  label?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <select
        className="rounded-xl border border-gray-200 px-3 py-2.5"
        value={productId}
        disabled={loading}
        onChange={(e) => {
          const id = Number(e.target.value);
          onChange(id, products.find((p) => p.productId === id));
        }}
      >
        <option value="">اختر المنتج</option>
        {products.map((p) => (
          <option key={p.productId} value={p.productId}>
            {p.nameAr || p.name || `#${p.productId}`}
          </option>
        ))}
      </select>
    </label>
  );
}
