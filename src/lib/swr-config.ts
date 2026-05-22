import type { SWRConfiguration } from "swr";

/** إعدادات افتراضية — تقليل إعادة الجلب عند التنقل */
export const defaultSwrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60_000,
  errorRetryCount: 2,
};
