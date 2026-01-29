export function cn(...classes) { // Takes array of class names
  return classes.filter((cls) => cls).join(" "); // Filter out falsy values
}