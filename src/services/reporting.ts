import { apiPost } from "@/lib/api";

export type ReportType =
  | "Spam"
  | "Harassment"
  | "Fraud"
  | "InappropriateContent"
  | "FalseInformation"
  | "Other";

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "Spam", label: "رسائل مزعجة" },
  { value: "Harassment", label: "تحرش أو مضايقة" },
  { value: "Fraud", label: "احتيال أو نصب" },
  { value: "InappropriateContent", label: "محتوى غير لائق" },
  { value: "FalseInformation", label: "معلومات كاذبة" },
  { value: "Other", label: "أخرى" },
];

export async function submitReport(body: {
  conversationId: number;
  reportedByUserId: number;
  reportedUserId: number;
  reportType: ReportType | string;
  title: string;
  description: string;
  relatedMessageId?: number;
  evidenceUrls?: string;
}) {
  return apiPost("/api/reporting/reports", {
    ...body,
    evidenceUrls: body.evidenceUrls ?? "",
  });
}
