"use client";

import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> { checked?: boolean; onCheckedChange?: (v: boolean) => void }
export function Switch({ checked, onCheckedChange, className = "" }: Props) {
  return (
    <button
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
      onClick={() => onCheckedChange?.(!checked)}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}
