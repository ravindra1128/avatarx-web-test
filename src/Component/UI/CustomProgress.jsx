import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion } from "framer-motion";

import { cn } from "../../lib/utils";

const CustomProgress = React.forwardRef((props, ref) => {
  const { className, value = 0, ...rest } = props;
  
  // Determine text color based on the progress value
  const textColor = value && value >= 50 ? "text-white" : "text-black";

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-6 w-full overflow-hidden rounded-full bg-primary/20", // Increased height
        className
      )}
      {...rest}
    >
      <div className="relative h-full w-full">
        {/* Progress bar with shimmering effect */}
        <ProgressPrimitive.Indicator
          className="absolute top-0 left-0 h-full bg-[#44c569] transition-all overflow-hidden"
          style={{ width: `${value}%` }}
        >
          {/* Shimmering effect using Framer Motion */}
          <motion.div
            className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50"
            animate={{ x: ["-100%", "100%"] }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
              repeat: Infinity,
            }}
            style={{ position: "absolute", width: "200%", height: "100%" }}
          />
        </ProgressPrimitive.Indicator>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-sm font-semibold transition-colors", textColor)}>
            {value ? `${Math.round(value)}%` : "0%"}
          </span>
        </div>
      </div>
    </ProgressPrimitive.Root>
  );
});

CustomProgress.displayName = ProgressPrimitive.Root.displayName;

export { CustomProgress };
