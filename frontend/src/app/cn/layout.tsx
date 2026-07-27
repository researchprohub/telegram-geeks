import { LocaleSetter } from "@/components/LocaleSetter";
import "../globals.css";

export default function CNLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocaleSetter lang="zh" />
      {children}
    </>
  );
}
