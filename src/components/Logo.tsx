import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  linkTo?: string;
  className?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export const Logo = forwardRef<HTMLSpanElement, LogoProps>(function Logo(
  { size = "md", linkTo, className }: LogoProps,
  ref
) {
  const content = (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-baseline font-serif font-semibold tracking-tight leading-none text-foreground select-none",
        sizeClasses[size],
        className
      )}
    >
      koasocial<span className="text-primary">.</span>
    </span>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="inline-flex">
        {content}
      </Link>
    );
  }

  return content;
});
