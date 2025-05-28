import { redirect } from "next/navigation";
import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";

export default function pushnoti() {
  return (
    <Card className="w-full max-w-md min-h-[200px] max-h-[300px] py-4">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <p className="text-tiny uppercase font-bold">Daily Mix</p>
        <small className="text-default-500">12 Tracks</small>
        <h4 className="font-bold text-large">Frontend Radio</h4>
      </CardHeader>
      <CardBody className="overflow-visible py-2">
        
      </CardBody>
    </Card>
  )
}
