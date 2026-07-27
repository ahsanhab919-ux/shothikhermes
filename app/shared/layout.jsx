"use client";

export default function SharedLayout({ children }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">{children}</div>
  );
}
