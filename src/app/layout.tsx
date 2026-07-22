import type { Metadata } from "next";
import "./styles.css";
export const metadata: Metadata = {
  title: "Interview Dojo OS",
  description: "Local-first technical interview practice.",
};
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
