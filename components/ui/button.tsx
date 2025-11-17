import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/cn";
import { cva, VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  `relative overflow-hidden font-shadows-into-light !text-base cursor-pointer
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
          "bg-brand-blue text-white hover:bg-primary before:hidden rounded-3xl after:hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        brand:
          "before:hidden after:hidden text-brand-blue border border-brand-blue rounded-3xl hover:bg-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        red: "before:hidden after:hidden bg-brand-red text-white rounded-3xl hover:bg-brand-red/80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        outline:
          "border border-gray-300 bg-white/90 backdrop-blur-sm hover:bg-gray-50 before:hidden after:hidden rounded-3xl focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      },
      size: {
        icon: "p-2 size-10 flex items-center justify-center rounded-full",
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-2.5",
      },
    },
    defaultVariants: {},
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
