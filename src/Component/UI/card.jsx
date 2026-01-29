import * as React from "react";

import { cn } from "@/utils/tailwind";

const Card = React.forwardRef((props, ref) => {
  const { className, shadow, fullWidthMobile = true, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-3xl border border-transparent bg-origin-border borderClip bg-cardBorder",
        shadow && "shadow-long",
        fullWidthMobile && "w-full max-w-full min-w-full md:min-w-0",
        className,
      )}
      {...rest}
    />
  );
});

Card.displayName = "Card";

const CardHeader = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-3 p-6 lg:p-9", className)}
      {...rest}
    />
  );
});

CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight text-pretty",
        className,
      )}
      {...rest}
    />
  );
});

CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef((props, ref) => {
  const { className, ...rest } = props;
  return (
    <p
      ref={ref}
      className={cn("text-lg text-pretty text-primary-500", className)}
      {...rest}
    />
  );
});

CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef((props, ref) => {
  const { className, stack = false, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(
        "p-6 pt-0 lg:p-9 lg:pt-0",
        stack && "flex flex-col gap-3 lg:gap-4",
        className,
      )}
      {...rest}
    />
  );
});

CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef((props, ref) => {
  const { className, isButtonArray, ...rest } = props;
  return (
    <div
      ref={ref}
      className={cn(
        "flex justify-center items-center p-6 pt-0 lg:p-9 lg:pt-0",
        isButtonArray && "gap-2 flex-col md:flex-row *:w-full md:*:w-auto",
        className,
      )}
      {...rest}
    />
  );
});

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
