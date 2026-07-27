import { LocaleSetter } from "@/components/LocaleSetter";
import "../globals.css";

export default function RULayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocaleSetter lang="ru" />
      {children}
    </>
  );
}
