import { LamduanFlowers } from "@/types/lamduan-flowers";
import { Card, CardHeader, CardBody, Image, Button } from "@heroui/react";
import { Trash2 } from "lucide-react";

interface LamduanFlowersProps {
  lamduanflowers: LamduanFlowers;
  onDelete: (id: string) => void;
}

export default function CardLamduanFlowers({ lamduanflowers, onDelete }: LamduanFlowersProps) {
  return (
    <Card isBlurred className="py-2 border-none bg-background/60 dark:bg-default-100/50" shadow="sm">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-medium uppercase font-bold">{lamduanflowers._id}</p>
        <small className="text-default-800">{lamduanflowers.comment.th || lamduanflowers.comment.en}</small>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        <Image
          alt="Lamduan"
          className="object-cover rounded-xl"
          src={`http://localhost:8080/uploads/${lamduanflowers.photo}`}
          width={270}
        />
        <div className="mt-2 w-full">
          <Button
            variant="flat"
            color="danger"
            size="sm"
            className="w-full flex justify-center rounded-lg hover:bg-danger-400"
            onPress={() => onDelete(lamduanflowers._id)}
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
