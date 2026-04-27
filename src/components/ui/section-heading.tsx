import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SectionHeading({ title, subtitle, align = "center", className }: SectionHeadingProps) {
  return (
    <div className={cn(
      "mb-12 md:mb-16",
      align === "center" && "text-center",
      align === "right" && "text-right",
      className
    )}>
      {subtitle && (
        <span className="inline-block text-accent font-semibold tracking-[0.2em] uppercase text-sm mb-3">
          {subtitle}
        </span>
      )}
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary relative inline-block">
        {title}
        <span className={cn(
          "absolute -bottom-4 h-1 bg-accent",
          align === "center" ? "left-1/2 -translate-x-1/2 w-24" : "left-0 w-16"
        )}></span>
      </h2>
    </div>
  );
}
