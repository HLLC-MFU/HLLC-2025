import { LamduanFlowers } from "@/types/lamduan-flowers";
import { Card, CardHeader, CardBody, Image, Button } from "@heroui/react";
import { Trash2 } from "lucide-react";
import React from "react";

interface LamduanFlowersProps {
  lamduanflowers: LamduanFlowers;
  onDelete: (id: string) => void;
  onView: () => void
}

export default function CardLamduanFlowers({ lamduanflowers, onDelete, onView }: LamduanFlowersProps) {
  return (
    <div className="cursor-pointer" onClick={onView}>
      <Card isBlurred className="py-2 border-none bg-background/60 dark:bg-default-100/50" shadow="sm">
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <p className="text-medium uppercase font-bold truncate max-w-full">{lamduanflowers.user.username}</p>
          <small className="text-default-800 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
            {typeof lamduanflowers.comment === 'object'
              ? (lamduanflowers.comment || 'No comment')
              : lamduanflowers.comment}
          </small>
        </CardHeader>
        <CardBody className="overflow-visible py-2">
          <Image
            alt="Lamduan"
            className="object-cover rounded-xl w-full h-[180px]"
            src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${lamduanflowers.photo}`}
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
    </div>
  );
}
