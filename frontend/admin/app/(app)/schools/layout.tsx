export default function SchoolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 p-4 md:p-10">
      <div className="inline-block text-center justify-center w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Schools & Majors Management</h1>
        </div>
        {children}
      </div>
    </section>
  );
}
