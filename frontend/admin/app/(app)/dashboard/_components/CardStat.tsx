import { Card, CardHeader, CardBody } from "@heroui/react";

export default function CardStat({
  icon,
  label,
  children,
  colors
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  colors: string;
}) {
  return (
    <Card isHoverable className="px-3 py-2 bg-transparent">
      <CardHeader className="font-semibold gap-2 border-b-1 flex items-center">
        <div className={`p-2 bg-${colors} text-${colors.replace('100', '600')} rounded-xl shadow-inner flex items-center justify-center`}>
          {icon}
        </div>
        <p>{label}</p>
      </CardHeader>
      <CardBody className="flex flex-col items-center justify-center">
        {children}
      </CardBody>
    </Card>
  );
}
