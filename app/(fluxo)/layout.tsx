export default function FlowLayout({ children }: LayoutProps<"/">) {
  return (
    <main id="conteudo" tabIndex={-1}>
      {children}
    </main>
  );
}
