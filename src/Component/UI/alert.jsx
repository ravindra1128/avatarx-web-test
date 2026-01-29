import React from "react";
import { cva } from "class-variance-authority";
import { CircleAlert } from "lucide-react";

import { cn } from "@/utils/tailwind";

const alertVariants = cva("text-center border border-black rounded-lg p-4", {
  variants: {
    intent: {
      info: "alert-info",
      danger: "border-red-200 text-red-600 bg-red-50",
    },
  },
  defaultVariants: {
    intent: "info",
  },
});

const Alert = ({ children, intent, title, ...props }) => {
  return (
    <div className={alertVariants({ intent })} {...props}>
      <AlertTitle>
        {intent === "danger" && <CircleAlert size={18} />}
        {title}
      </AlertTitle>
      {children}
    </div>
  );
};

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-base font-bold flex items-center gap-2 mb-2",
      className,
    )}
    {...props}
  />
));

AlertTitle.displayName = "AlertTitle";

export { Alert, AlertTitle };
