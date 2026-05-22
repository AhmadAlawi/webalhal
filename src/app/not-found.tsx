import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-8xl font-bold text-emerald-600/20">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-md text-slate-500">
        الرابط الذي طلبته غير صالح أو نُقل المحتوى.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
      >
        العودة للرئيسية
      </Link>
    </PageContainer>
  );
}
