import { Major } from "@/types/major";
import { School } from "@/types/school";
import { StepCounter } from "@/types/step-counters";
import { Card, CardFooter, CardHeader, Divider, } from "@heroui/react";
import { Footprints, UserRound } from "lucide-react";

type StepCountersSchoolListProps = {
    schools: School[];
    topSchool: StepCounter[];
}

export default function StepCountersSchoolList({
    schools,
    topSchool,
}: StepCountersSchoolListProps) {
    return (
        <div className="grid grid-cols-4 gap-4 mb-2">
            {schools.map((school, index) => {
                const user = topSchool.find((sc) => {
                    if (!sc) return;
                    return ((sc.user.metadata?.major as Major).school as School)._id === school._id
                });
                return (
                    <div key={index} className="hover:cursor-pointer">
                        <Card isHoverable className="h-full">
                            <CardHeader className="flex gap-3 p-4">
                                <div className="flex flex-col items-start min-w-0 text-start">
                                    <p className="text-lg font-semibold truncate w-full">
                                        {school.name.en}
                                    </p>
                                    <p className="text-small text-default-500 truncate w-full">
                                        {school.name.th}
                                    </p>
                                </div>
                            </CardHeader>
                            <Divider />
                            <CardFooter className="flex justify-between p-5">
                                {user ? (
                                    <div>
                                        <div className="flex items-center gap-2 text-primary font-medium">
                                            <span>{<UserRound />}</span>
                                            <div className="flex flex-col">
                                                <span>{user?.user.name.first} {user?.user.name.middle ?? ''} {user?.user.name.last ?? ''}</span>
                                                <span className="text-primary font-medium">{user?.user.username}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4 text-gray-500">
                                            <span>{<Footprints />}</span>
                                            <span>{user?.totalStep ?? ''} Steps</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className='text-danger'>No step counters data found.</p>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                )
            })}
        </div>
    )
};