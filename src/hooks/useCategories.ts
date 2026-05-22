import useSWR from "swr";
import { getCategories } from "@/services/catalog";

export function useCategories() {
  return useSWR("catalog:categories", getCategories, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}
