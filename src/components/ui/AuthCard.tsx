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
      <div className="card overflow-hidden border-[#D7D9E2] p-8 shadow-[0_18px_46px_rgba(0,6,109,0.10)] sm:p-10">
        <div className="mb-8 text-center">
          <RizqLogo size="lg" showText={false} className="mx-auto mb-5 justify-center" />
          <h1 className="text-2xl font-bold text-[#00066D]">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-[#777B8F]">{subtitle}</p>}
        </div>
        {children}
        {footer}
      </div>
    </div>
  );
}
