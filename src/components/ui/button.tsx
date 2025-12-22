import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-r from-primary to-copper text-primary-foreground",
          "shadow-gold",
          "hover:shadow-gold-lg hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-gold",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-sm",
          "hover:bg-destructive/90 hover:shadow-glow-error",
        ].join(" "),
        outline: [
          "border-2 border-border bg-transparent text-foreground",
          "hover:bg-secondary hover:border-primary/30 hover:text-foreground",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-sm",
          "hover:bg-charcoal-600 hover:shadow-md",
        ].join(" "),
        ghost: [
          "text-muted-foreground",
          "hover:bg-secondary hover:text-foreground",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
        gold: [
          "bg-gradient-to-r from-primary via-gold-light to-copper text-primary-foreground",
          "shadow-gold",
          "hover:shadow-gold-lg hover:-translate-y-0.5",
          "active:translate-y-0 active:shadow-gold",
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-gold-light before:via-primary before:to-gold-light",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100",
        ].join(" "),
        "gold-outline": [
          "border-2 border-primary text-primary bg-transparent",
          "shadow-gold/20",
          "hover:bg-primary/10 hover:shadow-gold",
        ].join(" "),
        glass: [
          "glass text-foreground",
          "hover:bg-charcoal-600/50",
          "border border-charcoal-500/30",
        ].join(" "),
        success: [
          "bg-success text-success-foreground",
          "shadow-sm",
          "hover:bg-success/90 hover:shadow-glow-success",
        ].join(" "),
        premium: [
          "relative overflow-hidden",
          "bg-gradient-to-r from-primary to-copper text-primary-foreground",
          "shadow-gold",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-r before:from-gold-light before:to-copper-light",
          "before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100 hover:shadow-gold-lg hover:-translate-y-0.5",
          "active:translate-y-0",
          "after:absolute after:inset-0",
          "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
          "after:translate-x-[-200%] after:transition-transform after:duration-700",
          "hover:after:translate-x-[200%]",
        ].join(" "),
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg font-bold",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
