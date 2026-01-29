import * as React from "react";

import { cn } from "@/utils/tailwind";

import { Label } from "./label";

const Field = ({ className, label, error, children, ...props }) => (
  <div className={cn("flex flex-col items-start gap-2 w-full", className)} {...props}>
    {label && <Label className="font-medium text-sm">{label}</Label>}
    {children}
    {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
  </div>
);

Field.displayName = "Field";

export { Field };
