"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function AboutPage() {
  return (
    <>
      <PageHeader title="عن التطبيق" backHref="/account" />
      <PageContainer narrow className="py-8">
        <article className="prose prose-slate max-w-none rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-emerald-800">رزق — سوق الحال</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            منصة سوق زراعي سورية تربط المزارعين والتجار وناقلي المحاصيل. تدعم المزادات
            الحية، المناقصات، البيع المباشر، النقل، والتحليلات السوقية — نفس تجربة تطبيق
            الهاتف على الويب.
          </p>
          <ul className="mt-6 list-disc space-y-2 ps-6 text-slate-600">
            <li>مزادات حية مع مزايدة فورية</li>
            <li>مناقصات وعروض موردين</li>
            <li>بيع مباشر وطلبات شراء</li>
            <li>شحن ونقل مع تتبع وتسليم</li>
            <li>محادثات مرتبطة بكل صفقة</li>
          </ul>
          <p className="mt-8 text-sm text-slate-500">
            للدعم الفني:{" "}
            <Link href="/tickets" className="text-emerald-600 hover:underline">
              مركز التذاكر
            </Link>
          </p>
        </article>
      </PageContainer>
    </>
  );
}
