import { useUserStatistics } from '@/hooks/useUserSytem';
import {
  Card,
  CardBody,
  CardHeader,
  Select,
  SelectItem,
} from '@heroui/react';
import { Users, UserX, UsersRound , LayoutGrid } from 'lucide-react';
import { useState } from 'react';

export default function StudentChart() {
  const { userstats } = useUserStatistics();
  const [selectRole, setSelectRole] = useState('student');
  const roleStats = userstats?.[selectRole];
  const roleStatsData = [
    {
      name: 'Total',
      value: roleStats?.total,
      color: '#71717a',
      icon: <LayoutGrid />,
    },
    {
      name: 'Register',
      value: roleStats?.registered,
      color: '#486CFF',
      icon: <UsersRound />,
    },
    {
      name: 'Not Register',
      value: roleStats?.notRegistered,
      color: '#8DD8FF',
      icon: <UserX />,
    },
  ];

  return (
    <div className="col-span-2 md:col-span-1 ">
      <Card className="h-full">
        <CardHeader className="flex justify-between w-full">
          <div className=" flex items-center justify-center space-x-2">
            <Users className="text-primary h-5 w-5 " />
            <h3 className=" text-lg font-semibold"> Register </h3>
          </div>
          <Select
            className="max-w-[125px]"
            selectionMode="single"
            size='sm'
            selectedKeys={[selectRole]}
            onSelectionChange={(keys) =>
              setSelectRole(Array.from(keys)[0] as string)
            }
          >
            {userstats &&
              Object.keys(userstats).map((role) => (
                <SelectItem key={role}>{role}</SelectItem>
              ))}
          </Select>
        </CardHeader>
        <CardBody className=" flex  items-center">
          <div className="space-y-5 w-full px-4 mb-3">
            {roleStatsData.map((Stats, index) => (
              <div key={index} className="flex space-x-5">
                <div
                  className="text-white p-3 w-fit h-fit rounded-md"
                  style={{ backgroundColor: Stats.color }}
                >
                  {Stats.icon}
                </div>
                <div>
                  <h1>{Stats.name}</h1>
                  <span>{Stats.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
