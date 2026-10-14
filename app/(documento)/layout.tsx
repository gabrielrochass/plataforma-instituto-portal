export default function DocumentLayout({ children }: LayoutProps<"/">) {
  return (
    <main
      id="conteudo"
      tabIndex={-1}
      className="mx-auto w-full max-w-[210mm] px-4 py-6 sm:px-8 print:max-w-none print:p-0"
    >
      {children}
    </main>
  );
}
