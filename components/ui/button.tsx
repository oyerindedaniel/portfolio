import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";
import { cva, VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  `relative inline-flex items-center justify-center gap-2 whitespace-nowrap !text-base cursor-pointer [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0
  transform transition-transform duration-200
  hover:scale-103 active:scale-95
  before:content-[''] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-full
  before:bg-(--brand-red) before:scale-x-0 before:origin-left before:transition-transform
  hover:before:scale-x-100 before:focus-visible:scale-x-100 before:focus-visible:bg-(--brand-red)
  after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full
  after:bg-(--brand-blue) after:scale-x-100 after:origin-left after:transition-transform
  hover:after:scale-x-0
  disabled:pointer-events-none disabled:opacity-50
  outline-none
  `,
  {
    variants: {
      variant: {
        none: "before:hidden after:hidden",
        solid:
          "bg-brand-blue text-white hover:bg-brand-blue/90 before:hidden rounded-3xl after:hidden focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        brand:
          "before:hidden after:hidden text-brand-blue border border-brand-blue rounded-3xl hover:bg-brand-blue/5 focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        red: "before:hidden after:hidden bg-brand-red text-white rounded-3xl hover:bg-brand-red/80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        outline:
          "border border-gray-300 bg-white/90 backdrop-blur-sm hover:bg-gray-50 before:hidden after:hidden rounded-3xl focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        subtle:
          "before:hidden after:hidden bg-slate-50 border border-slate-200 text-slate-500 hover:border-brand-blue/30 hover:text-brand-blue hover:bg-brand-blue/[0.02] shadow-none",
        ghost:
          "before:hidden after:hidden hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-none",
      },
      font: {
        shadows: "font-shadows-into-light",
        sans: "font-sans",
        bold: "font-bold uppercase tracking-widest text-[9px]",
      },
      size: {
        icon: "p-2 size-10 rounded-full",
        sm: "px-4 py-1.5 text-sm",
        md: "px-6 py-2.5",
        lg: "px-8 py-3",
      },
    },
    defaultVariants: {
      font: "shadows",
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
      type="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
