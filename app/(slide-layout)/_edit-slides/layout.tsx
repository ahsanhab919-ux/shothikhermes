export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="bg-muted/20 flex h-screen w-full flex-col">
      {children}
    </section>
  );
}
