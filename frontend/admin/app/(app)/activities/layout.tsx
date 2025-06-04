import { BreadcrumbProvider } from "@/hooks/useBreadcrumb";

export default function ActivitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BreadcrumbProvider>
      <section className="flex flex-col items-center justify-center gap-4 p-4">
        <div className="inline-block text-center justify-center w-full">
          {children}
        </div>
      </section>
    </BreadcrumbProvider>
  );
} 