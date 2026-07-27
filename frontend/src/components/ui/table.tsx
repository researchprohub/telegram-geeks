import { ReactNode } from "react";

interface Props { children: ReactNode; className?: string }
export function Table({ children, className = "" }: Props) { return <table className={`w-full text-sm ${className}`}>{children}</table>; }
export function TableHeader({ children, className = "" }: Props) { return <thead className={`border-b border-border ${className}`}>{children}</thead>; }
export function TableBody({ children, className = "" }: Props) { return <tbody className={className}>{children}</tbody>; }
export function TableRow({ children, className = "" }: Props) { return <tr className={`border-b border-border/60 transition-colors hover:bg-secondary/40 ${className}`}>{children}</tr>; }
export function TableHead({ children, className = "" }: Props) { return <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground ${className}`}>{children}</th>; }
export function TableCell({ children, className = "" }: Props) { return <td className={`px-4 py-3.5 ${className}`}>{children}</td>; }
