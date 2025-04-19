import { Schools } from "@/types/schools";
import { Accordion, AccordionItem } from "@heroui/react";

interface SchoolAccordionProps {
    school: Schools;
    onDetail: (schoolId: number) => void;
}

export default function SchoolAccordion({ school, onDetail }: SchoolAccordionProps) {
    return (
            <Accordion className="min-w-screen flex px-2 py-4 border border-gray-300 rounded-lg shadow-md bg-white dark:bg-gray-800 dark:border-gray-700">
                <AccordionItem
                    key={school.id}
                    aria-label={`Accordion-${school.id}`}
                    title={school.name}
                >
                    <div className="flex flex-col gap-2 text-sm text-gray-800 dark:text-gray-200">
                        <p>
                            <strong>Acronym:</strong> {school.acronym || "N/A"}
                        </p>
                        <div>
                            <strong>Majors:</strong>
                            {school.majors && school.majors.length > 0 ? (
                                <ul className="list-disc ml-5 mt-1">
                                    {school.majors.map((m) => (
                                        <li key={m.id}>
                                            {m.name} ({m.acronym})
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="ml-2 text-gray-500">No majors assigned</p>
                            )}

                        </div>

                        <button
                            aria-label={`View details for ${school.name}`}
                            onClick={() => onDetail(school.id)}
                            className="mt-2 px-3 py-1 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors w-max"
                        >
                            View Detail
                        </button>
                    </div>
                </AccordionItem>
            </Accordion>
    );
}
