import { RizqLogo } from "@/components/brand/RizqLogo";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="card overflow-hidden p-8 shadow-lg sm:p-10">
        <div className="mb-8 text-center">
          <RizqLogo size="lg" showText={false} className="mx-auto mb-5 justify-center" />
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
