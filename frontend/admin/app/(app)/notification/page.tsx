import { redirect } from "next/navigation";
import Link from 'next/link';
import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";
import { BellDot, BellPlus } from "lucide-react";

export default function notification() {
  return (
  
  <div className="flex gap-4">
  <Link href="/notification/pushnoti" className="w-64 h-64">
  <Card className="w-full h-full flex flex-col items-center justify-center border rounded-xl shadow hover:shadow-lg transition">
    <BellPlus className="w-12 h-12 text-gray-600 mb-4" />
    <p className="text-center text-gray-800 font-medium">Push Notification</p>
  </Card>
  </Link>

  <Card className="w-64 h-64 flex flex-col items-center justify-center border rounded-xl shadow">
    <BellDot className="w-12 h-12 text-gray-600 mb-4" />
    <p className="text-center text-gray-800 font-medium">Notification Management</p>
  </Card>


 </div>
  
  )
}
