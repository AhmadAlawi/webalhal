import useSWR from "swr";
import { getCities } from "@/services/transport";

export function useCities() {
  return useSWR("transport:cities", getCities, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });
}
