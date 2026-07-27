import { ReactNode } from "react";

interface Props { children: ReactNode; className?: string }
export function Card({ children, className = "" }: Props) {
  return <div className={`bg-card text-card-foreground rounded-xl border border-border ${className}`}>{children}</div>;
}
export function CardHeader({ children, className = "" }: Props) {
  return <div className={`px-6 pt-6 pb-2 ${className}`}>{children}</div>;
}
export function CardTitle({ children, className = "" }: Props) {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
}
export function CardContent({ children, className = "" }: Props) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
}
