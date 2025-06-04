"use client"
import {
    Card, CardHeader, CardBody, CardFooter, Divider, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, useCheckbox, tv, VisuallyHidden, Chip
} from "@heroui/react";
import { Eye, Pencil, Trash2, Landmark, EllipsisVertical, Building2, GraduationCap, EyeOff, CheckIcon } from "lucide-react";
import type { Sponsor } from "@/types/sponsor";
import { useRouter } from "next/navigation";

interface SponsorCardProps {
    sponsor: Sponsor;
    onEdit: (sponsor: Sponsor) => void;
    onDelete: (sponsor: Sponsor) => void;
}

export function SponsorCard({ sponsor, onEdit, onDelete }: SponsorCardProps) {
    const router = useRouter();

    const handleViewDetails = () => {
        router.push(`/sponsors/${sponsor._id}`);
    };

    console.log(sponsor)

    return (
        <div onClick={handleViewDetails} className="hover:cursor-pointer">
            <Card isHoverable className="h-full">
                <CardHeader className="flex gap-3 p-4">
                    <div className="flex gap-3">
                        <div className="relative max-w-[48px] max-h-[48px] w-12 h-12 flex-shrink-0 mx-auto">
                            <img
                                src={
                                    sponsor.logo?.logoPhoto
                                        ? `http://localhost:8080/uploads/${sponsor.logo.logoPhoto}`
                                        : "/no-image.png"
                                }
                                alt={sponsor.name.en}
                                className="w-full h-full object-cover rounded-xl shadow-lg bg-default-100"
                            />
                        </div>
                        <div className="flex flex-col items-start min-w-0 text-start">
                            <p className="text-lg font-semibold truncate w-full">{sponsor.name.en}</p>
                            <p className="text-small text-default-500 truncate w-full">{sponsor.name.th}</p>
                        </div>
                    </div>
                </CardHeader>

                <Divider />

                <CardBody className="gap-4 p-4 grid grid-cols-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm flex-shrink-0">Name:</p>
                        <span className="text-sm text-default-500 truncate">{sponsor.name.en}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm flex-shrink-0">Type:</p>
                        <span className="text-sm text-default-500">{sponsor.type.name}</span>
                        {/* <span className="text-sm text-default-500">{sponsor.type}</span> */}
                    </div>
                </CardBody>

                <Divider />

                <CardFooter className="flex items-center justify-between p-4 gap-2">
                    <Button
                        variant="light"
                        color="primary"
                        size="sm"
                        startContent={<Eye size={16} />}
                        onPress={handleViewDetails}
                        className="sm:flex-none"
                    >
                        View Details
                    </Button>

                    <div className="flex items-center gap-2 ml-auto">
                        <Chip
                            size="sm"
                            className="px-2 py-1 text-xs"
                            color={sponsor.isShow ? "primary" : "default"}
                            startContent={sponsor.isShow ? <CheckIcon className="ml-1 w-3 h-3" /> : null}
                            variant="faded"
                        >
                            {sponsor.isShow ? "Show" : "Hide"}
                        </Chip>

                        <Dropdown>
                            <DropdownTrigger>
                                <Button
                                    variant="light"
                                    color="primary"
                                    isIconOnly
                                    size="sm"
                                    className="flex-shrink-0"
                                >
                                    <EllipsisVertical size={16} />
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Sponsor Actions">
                                <DropdownItem
                                    key="edit"
                                    startContent={<Pencil size={16} />}
                                    onPress={() => onEdit(sponsor)}
                                >
                                    Edit Sponsor
                                </DropdownItem>
                                <DropdownItem
                                    key="delete"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<Trash2 size={16} />}
                                    onPress={() => onDelete(sponsor)}
                                >
                                    Delete Sponsor
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

// export function SponsorCard({ sponsor, onEdit, onDelete }: SponsorCardProps) {
//     const router = useRouter();
//     const handleViewDetails = () => {
//         router.push(`/sponsor/${sponsor._id}`);
//     };

//     const { children, isSelected, isFocusVisible, getBaseProps, getLabelProps, getInputProps } =
//         useCheckbox({
//             defaultSelected: true,
//         });

//     const checkbox = tv({
//         slots: {
//             base: "border-default hover:bg-default-200",
//             content: "text-default-500",
//         },
//         variants: {
//             isSelected: {
//                 true: {
//                     base: "border-primary bg-primary hover:bg-primary-500 hover:border-primary-500",
//                     content: "text-primary-foreground pl-1",
//                 },
//             },
//             isFocusVisible: {
//                 true: {
//                     base: "outline-none ring-2 ring-focus ring-offset-2 ring-offset-background",
//                 },
//             },
//         },
//     });

//     const styles = checkbox({ isSelected, isFocusVisible });

//     return (
//         <div onClick={handleViewDetails} className="hover:cursor-pointer">
//             <Card isHoverable className="h-full">
//                 <CardHeader className="flex gap-3 p-4">
//                     <div className="flex gap-3">
//                         <Card
//                             radius="md"
//                             className="w-12 h-12 text-large items-center justify-center flex-shrink-0"
//                         >
//                             <img
//                                 src={sponsor.logo.first}
//                                 className="w-full h-full object-cover"
//                             />
//                         </Card>
//                         <div className="flex flex-col items-start min-w-0 text-start">
//                             <p className="text-lg font-semibold truncate w-full">{sponsor.name.en}</p>
//                             <p className="text-small text-default-500 truncate w-full">{sponsor.name.th}</p>
//                         </div>
//                     </div>
//                 </CardHeader>

//                 <Divider />

//                 <CardBody className="gap-4 p-4 grid grid-cols-2">
//                     <div className="flex items-center gap-2">
//                         <p className="text-sm flex-shrink-0">Name:</p>
//                         <span className="text-sm text-default-500 truncate">{sponsor.name.en}</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                         <p className="text-sm flex-shrink-0">Type:</p>
//                         <span className="text-sm text-default-500">{sponsor.type}</span>
//                     </div>
//                     <div className="col-span-2">
//                         <p className="text-sm text-default-500 line-clamp-2">
//                             {sponsor.description.en}
//                         </p>
//                     </div>
//                 </CardBody>

//                 <Divider />

//                 <CardFooter className="flex items-center justify-between p-4 gap-2">
//                     <Button
//                         variant="light"
//                         color="primary"
//                         size="sm"
//                         startContent={<Eye size={16} />}
//                         onPress={handleViewDetails}
//                         className="sm:flex-none"
//                     >
//                         View Details
//                     </Button>

//                     <div className="flex items-center gap-2 ml-auto">
//                         <label {...getBaseProps()}>
//                             <VisuallyHidden>
//                                 <input {...getInputProps()} />
//                             </VisuallyHidden>
//                             <Chip
//                                 onClick={(e) => e.stopPropagation()}
//                                 size="sm"
//                                 classNames={{
//                                     base: `${styles.base()} px-2 py-1 text-xs`,
//                                     content: `${styles.content()} text-xs`,
//                                 }}
//                                 color="primary"
//                                 startContent={isSelected ? <CheckIcon className="ml-1 w-3 h-3" /> : null}
//                                 variant="faded"
//                                 {...getLabelProps()}
//                             >
//                                 {children ? children : isSelected ? "Show" : "Hide"}
//                             </Chip>
//                         </label>

//                         <Dropdown>
//                             <DropdownTrigger>
//                                 <Button
//                                     variant="light"
//                                     color="primary"
//                                     isIconOnly
//                                     size="sm"
//                                     className="flex-shrink-0"
//                                 >
//                                     <EllipsisVertical size={16} />
//                                 </Button>
//                             </DropdownTrigger>
//                             <DropdownMenu aria-label="Sponsor Actions">
//                                 <DropdownItem
//                                     key="edit"
//                                     startContent={<Pencil size={16} />}
//                                     onPress={() => onEdit(sponsor)}
//                                 >
//                                     Edit Sponsor
//                                 </DropdownItem>
//                                 <DropdownItem
//                                     key="delete"
//                                     className="text-danger"
//                                     color="danger"
//                                     startContent={<Trash2 size={16} />}
//                                     onPress={() => onDelete(sponsor)}
//                                 >
//                                     Delete Sponsor
//                                 </DropdownItem>
//                             </DropdownMenu>
//                         </Dropdown>
//                     </div>
//                 </CardFooter>
//             </Card>
//         </div>
//     );
// }
