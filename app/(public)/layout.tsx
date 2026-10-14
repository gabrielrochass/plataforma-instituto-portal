export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="conteudo" tabIndex={-1} className="min-h-dvh px-6">
      {children}
    </main>
  );
}
