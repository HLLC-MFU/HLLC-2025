import { Accordion, AccordionItem, Skeleton } from "@heroui/react";

export default function StepCountersSkeleton() {
    return (
        <>
            <Accordion variant="splitted" className="p-0">
                {Array.from({ length: 3 }).map((_, index) => (
                    <AccordionItem
                        key={index}
                        aria-label={`Skeleton ${index}`}
                        title={
                            <div className="flex flex-col gap-2 w-40">
                                <Skeleton className="rounded-md">
                                    <div className="p-2 rounded-md bg-gray-200 border" />
                                </Skeleton>
                                <Skeleton className="rounded-md">
                                    <div className="p-1 rounded-md bg-gray-200 border" />
                                </Skeleton>
                            </div>
                        }
                        startContent={
                            <Skeleton className="rounded-lg">
                                <div className="p-5 rounded-md bg-gray-200 border" />
                            </Skeleton>
                        }
                    >
                        <Skeleton className="rounded-lg">
                            <div className="h-24 rounded-lg bg-default-300" />
                        </Skeleton>
                    </AccordionItem>
                ))}
            </Accordion>
        </>
    )
};