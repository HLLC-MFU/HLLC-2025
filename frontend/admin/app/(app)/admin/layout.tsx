export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col items-center justify-center gap-4 p-4 md:p-10">
      <div className="inline-block text-center justify-center w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Management</h1>
        </div>
        {children}
      </div>
    </section>
  );
}
