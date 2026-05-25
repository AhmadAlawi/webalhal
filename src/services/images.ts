import { apiPost } from "@/lib/api";

function extractUploadedUrl(data: unknown): string {
  if (typeof data === "string" && data.startsWith("http")) return data;
  if (!data || typeof data !== "object") {
    throw new Error("استجابة رفع الصورة غير متوقعة");
  }
  const r = data as Record<string, unknown>;
  const direct =
    r.url ??
    r.imageUrl ??
    r.ImageUrl ??
    r.fileUrl ??
    r.FileUrl ??
    r.path ??
    r.Path;
  if (typeof direct === "string" && direct) return direct;

  const nested = r.data ?? r.result;
  if (nested) return extractUploadedUrl(nested);

  const urls = r.urls ?? r.imageUrls;
  if (Array.isArray(urls) && typeof urls[0] === "string") return urls[0];

  throw new Error("لم يُرجع الخادم رابط الصورة");
}

export async function uploadImage(file: File, folder = "crops"): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiPost<unknown>(
    `/api/Images/upload?folder=${encodeURIComponent(folder)}`,
    fd,
  );
  return extractUploadedUrl(res);
}

export async function uploadImages(files: File[], folder = "crops"): Promise<string[]> {
  const fd = new FormData();
  for (const file of files) {
    fd.append("files", file);
  }
  try {
    const res = await apiPost<unknown>(
      `/api/Images/upload-multiple?folder=${encodeURIComponent(folder)}`,
      fd,
    );
    if (Array.isArray(res)) {
      return res.map((x) => extractUploadedUrl(x));
    }
    if (res && typeof res === "object") {
      const urls = (res as Record<string, unknown>).urls ?? (res as Record<string, unknown>).imageUrls;
      if (Array.isArray(urls)) return urls.map((u) => extractUploadedUrl(u));
    }
  } catch {
    /* fallback single uploads */
  }
  const out: string[] = [];
  for (const file of files) {
    out.push(await uploadImage(file, folder));
  }
  return out;
}
