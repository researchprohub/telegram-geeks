import { ReactNode } from "react";

interface Props { children: ReactNode; className?: string }
export function Dialog({ children, open, onOpenChange }: Props & { open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-card text-card-foreground rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
export function DialogContent({ children, className = "" }: Props) { return <div className={`p-6 ${className}`}>{children}</div>; }
export function DialogHeader({ children, className = "" }: Props) { return <div className={`mb-4 ${className}`}>{children}</div>; }
export function DialogTitle({ children, className = "" }: Props) { return <h2 className={`text-lg font-semibold ${className}`}>{children}</h2>; }
export function DialogDescription({ children, className = "" }: Props) { return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>; }
export function DialogFooter({ children, className = "" }: Props) {
  return <div className={`flex justify-end gap-2 mt-6 ${className}`}>{children}</div>;
}
