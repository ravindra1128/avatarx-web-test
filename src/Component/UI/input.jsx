import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils";



const inputVariants = cva(
  "flex h-12 px-3 w-full rounded-xl border border-primary-200 bg-background text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        danger:
          "border-red-500 text-red-500 placeholder:text-red-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Input = React.forwardRef(({ variant, className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
