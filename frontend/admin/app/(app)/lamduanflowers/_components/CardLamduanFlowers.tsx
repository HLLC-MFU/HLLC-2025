import { Card, CardHeader, CardBody, Image, Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

export default function CardLamduanFlowers() {
  return (
    <Card isBlurred className="py-2 border-none bg-background/60 dark:bg-default-100/50" shadow="sm">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-medium uppercase font-bold">6731503119</p>
        <small className="text-default-800">I'm Ironman</small>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Card background"
          className="object-cover rounded-xl"
          src="https://i.pinimg.com/736x/4e/8a/6d/4e8a6da813ffe2337b5182587ebede35.jpg"
          width={270}
        />
        {/* <small className="text-default-800 py-2">วันพระวันเจ้าไม่เว้นกันเลยอยากจะดูแต่หนัง</small> */}
        <div className="mt-2 w-full">
          <Button
            variant="flat"
            color="danger"
            size="sm"
            className="w-full flex justify-center rounded-lg bg-danger-100 hover:bg-danger-200"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
