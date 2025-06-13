import { Card, CardBody, Image, Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

export default function CardLamduanFlowers() {
  return (
    <Card
      isBlurred
      className="border-none bg-background/60 dark:bg-default-100/50 max-w-full rounded-xl overflow-hidden"
      shadow="sm"
    >
      <div className="flex">
        {/* รูปด้านซ้าย */}
        <div className="p-2">
          <Image
            alt="lamduan"
            className="object-cover w-[90px] h-[90px] rounded-lg"
            shadow="md"
            src="https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg"
          />
        </div>

        {/* ข้อความ */}
        <div className="flex flex-col justify-center gap-1 px-2 flex-1">
          <p className="text-lg font-bold">6731503119</p>
          <p className="text-sm font-medium">
            Comment: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  
          </p>
        </div>

        {/* ปุ่ม Delete */}
        <div className=" w-[60px] flex items-center justify-center">
          <Button isIconOnly variant="light" color="danger" >
            <Trash2 size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
