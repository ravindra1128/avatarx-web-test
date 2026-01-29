import * as React from "react";

import { cn } from "../../lib/utils";

const Label = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <label ref={ref} className={cn("font-medium text-sm", className)} {...props}>
      {children}
    </label>
  );
});

Label.displayName = "Label";

export { Label };
