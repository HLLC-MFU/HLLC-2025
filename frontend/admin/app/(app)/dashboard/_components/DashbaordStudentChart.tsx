import { useUserStatistics } from '@/hooks/useUserSytem';
import type { Selection } from '@heroui/react';
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from '@heroui/react';
import {
  Users,
  UserX,
  UsersRound,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function StudentChart() {
  const { userstats } = useUserStatistics();
  const roles = useMemo(() => Object.keys(userstats || {}), [userstats]);
  const [selectKey, setSelectKey] = useState<Selection>(new Set(['student']));
  const selectedRole = useMemo(
    () => Array.from(selectKey)[0] as string,
    [selectKey],
  );

  const roleStats = userstats?.[selectedRole];

  const roleStatsData = [
    {
      name: 'Role',
      value: selectedRole,
      icon: <User />,
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      name: 'Register',
      value: roleStats?.registered,
      icon: <UsersRound />,
      bg: 'bg-green-100',
      text: 'text-green-600',
    },
    {
      name: 'Not Register',
      value: roleStats?.notRegistered,
      icon: <UserX />,
      bg: 'bg-red-100',
      text: 'text-red-600',
    },
    {
      name: 'Total',
      value: roleStats?.total,
      icon: <LayoutGrid />,
      bg: 'bg-gray-200',
      text: 'text-gray-700',
    },
  ];

  const currentIndex = roles.findIndex((r) => r === selectedRole);

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + roles.length) % roles.length;
    setSelectKey(new Set([roles[newIndex]]));
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % roles.length;
    setSelectKey(new Set([roles[newIndex]]));
  };

  return (
    <div className="col-span-2 md:col-span-1">
      <Card className="h-full w-full">
        <CardHeader className="flex justify-between w-full">
          <div className="flex items-center justify-center space-x-2">
            <Users className="text-primary h-5 w-5" />
            <h3 className="text-lg font-semibold"> User Register </h3>
          </div>
        </CardHeader>

        <CardBody className="flex items-center py-5">
          <div className="space-y-5 w-full px-4 ">
            {roleStatsData.map((Stats, index) => (
              <div key={index} className="flex space-x-5">
                <div
                  className={`p-3.5  rounded-xl ${Stats.bg} ${Stats.text} shadow-inner`}
                >
                  {Stats.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-medium font-medium text-default-800">
                    {Stats.name}
                  </span>
                  <span className="text-md font-semibold text-default-500">
                    {Stats.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>

        <CardFooter className="w-full justify-center items-center gap-4 pb-5 px-6">
          <Button
            isIconOnly
            variant="flat"
            color="default"
            onPress={handlePrev}
          >
            <ChevronLeft />
          </Button>
          <Autocomplete
            className="min-w-[120px]"
            selectedKey={selectedRole}
            onSelectionChange={(key) => {
              if (key) {
                setSelectKey(new Set([key.toString()]));
              }
            }}
            color="default"
            showScrollIndicators={false}
          >
            {roles.map((role) => (
              <AutocompleteItem key={role}>{role}</AutocompleteItem>
            ))}
          </Autocomplete>
          <Button
            isIconOnly
            variant="flat"
            color="default"
            onPress={handleNext}
          >
            <ChevronRight />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
