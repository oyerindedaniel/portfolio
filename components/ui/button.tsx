import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-3xl text-sm md:text-[0.8rem] font-medium font-sans transition-all duration-250 active:scale-[98%] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        primary:
          "bg-primary text-foreground-on-accent hover:bg-primary-hover active:bg-primary-active",
      },
      size: {
        default: "h-4 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-3xl gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-3xl px-6 has-[>svg]:px-4",
        icon: "size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
