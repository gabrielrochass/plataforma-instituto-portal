export default function EntryLayout({ children }: LayoutProps<"/lancamentos">) {
  return (
    <main id="conteudo" tabIndex={-1}>
      {children}
    </main>
  );
}
