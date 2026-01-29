import * as React from "react";

const Card = React.forwardRef(({ className, shadow, fullWidthMobile = true, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-3xl border border-gray-200 bg-origin-border borderClip bg-cardBorder ${
      shadow ? "shadow-long" : ""
    } ${fullWidthMobile ? "w-full max-w-full min-w-full md:min-w-0" : ""} ${className || ""}`}
    {...props}
  />
));

Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-3 p-6 lg:p-9 ${className || ""}`}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-semibold leading-none tracking-tight text-pretty ${className || ""}`}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-lg text-pretty text-primary-500 ${className || ""}`}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, stack = false, ...props }, ref) => (
  <div
    ref={ref}
    className={`p-6 pt-0 lg:p-9 lg:pt-0 ${
      stack ? "flex flex-col gap-3 lg:gap-4" : ""
    } ${className || ""}`}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, isButtonArray, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex justify-center items-center p-6 pt-0 lg:p-9 lg:pt-0 ${
      isButtonArray ? "gap-2 flex-col md:flex-row *:w-full md:*:w-auto" : ""
    } ${className || ""}`}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent, 
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
