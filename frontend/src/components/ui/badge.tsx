import { ReactNode } from "react";

interface Props { children: ReactNode; className?: string; variant?: "default" | "secondary" | "outline" | "destructive" }
export function Badge({ children, className = "", variant = "default" }: Props) {
  const colors: Record<string, string> = {
    default: "bg-blue-500 text-white",
    secondary: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
    outline: "border border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400",
    destructive: "bg-red-500 text-white",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[variant]} ${className}`}>{children}</span>;
}
