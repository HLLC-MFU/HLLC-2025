import { Schools } from "@/types/schools";
import { Card, CardBody, CardHeader, Image } from "@heroui/react";

interface SchoolsCardProps {
    schools: Schools[];
    onClick: (schoolId: string) => void;
}

export default function SchoolsCard({ schools, onClick }: SchoolsCardProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
                <Card
                    key={school.id}
                    className="py-4 border-2 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                    onPress={() => onClick(school.id)}
                >
                    <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                        <p className="text-tiny uppercase font-bold">{school.acronym}</p>
                        <small className="text-default-500">{school.details}</small>
                        <h4 className="font-bold text-large">{school.name}</h4>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                        <Image
                            alt="Card background"
                            className="object-cover rounded-xl"
                            src="https://heroui.com/images/hero-card-complete.jpeg"
                            width={270}
                        />
                    </CardBody>
                </Card>
            ))}
        </div>
    );
}
