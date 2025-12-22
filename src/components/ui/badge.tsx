import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        outline: "border-border text-foreground",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-warning/15 text-warning",
        info: "border-transparent bg-info/15 text-info",
        gold: "border-transparent bg-primary/15 text-primary shadow-gold/20",
        premium: [
          "border border-primary/30 bg-gradient-to-r from-primary/10 to-copper/10",
          "text-primary shadow-gold/10",
        ].join(" "),
        ghost: "border-transparent bg-muted/50 text-muted-foreground",
        dot: "border-transparent bg-transparent text-muted-foreground pl-0",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: "success" | "warning" | "destructive" | "info" | "primary" | "muted";
  pulse?: boolean;
}

const dotColorClasses = {
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  primary: "bg-primary",
  muted: "bg-muted-foreground",
};

const dotGlowClasses = {
  success: "shadow-[0_0_8px_hsl(var(--success)/0.5)]",
  warning: "shadow-[0_0_8px_hsl(var(--warning)/0.5)]",
  destructive: "shadow-[0_0_8px_hsl(var(--destructive)/0.5)]",
  info: "shadow-[0_0_8px_hsl(var(--info)/0.5)]",
  primary: "shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
  muted: "",
};

function Badge({
  className,
  variant,
  size,
  dot,
  dotColor = "primary",
  pulse,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0",
            dotColorClasses[dotColor],
            dotGlowClasses[dotColor],
            pulse && "animate-pulse"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
