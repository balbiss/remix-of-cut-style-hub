import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-xl text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: [
          "border-2 border-border bg-secondary",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "hover:border-charcoal-500",
        ].join(" "),
        filled: [
          "border-0 bg-charcoal-700",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "hover:bg-charcoal-600",
        ].join(" "),
        outline: [
          "border-2 border-charcoal-500 bg-transparent",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "hover:border-charcoal-400",
        ].join(" "),
        ghost: [
          "border-0 bg-transparent",
          "focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-primary/20",
          "hover:bg-secondary/50",
        ].join(" "),
        premium: [
          "border-2 border-charcoal-500 bg-gradient-to-br from-charcoal-700 to-charcoal-800",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
          "focus-visible:shadow-inner-gold",
          "hover:border-charcoal-400",
        ].join(" "),
      },
      inputSize: {
        default: "h-12 px-4 py-3 text-base",
        sm: "h-9 px-3 py-2 text-sm rounded-lg",
        lg: "h-14 px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, iconPosition = "left", ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          {iconPosition === "left" && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, inputSize }),
              iconPosition === "left" && "pl-11",
              iconPosition === "right" && "pr-11",
              className
            )}
            ref={ref}
            {...props}
          />
          {iconPosition === "right" && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
