"use client";

import { ShiftProvider } from "./_components/shift.context";

export default function ShiftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ShiftProvider>{children}</ShiftProvider>;
}
