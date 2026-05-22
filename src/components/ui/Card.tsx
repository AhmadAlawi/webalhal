import { clsx } from "clsx";

export function Card({
  children,
  className,
  hover,
  padding = "md",
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  return (
    <div
      className={clsx(
        "card",
        hover && "card-hover",
        padding === "sm" && "p-4",
        padding === "md" && "p-6",
        padding === "lg" && "p-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
