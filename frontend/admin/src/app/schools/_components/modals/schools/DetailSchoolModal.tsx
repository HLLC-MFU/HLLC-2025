"use client";

import { Schools } from "@/types/schools";
import BlurModal from "@/components/Modals/BlurModal";
import { 
    Chip, 
    Divider, 
    Card, 
    Table, 
    TableHeader, 
    TableColumn, 
    TableBody, 
    TableRow, 
    TableCell, 
    Button, 
    Image, 
    Tooltip,
    Badge,
    Avatar,
    ScrollShadow,
    Tabs,
    Tab
} from "@heroui/react";
import { Majors } from "@/types/majors";
import { 
    AcademicCapIcon, 
    BuildingLibraryIcon, 
    PlusCircleIcon, 
    CalendarIcon, 
    UserGroupIcon,
    InformationCircleIcon,
    PencilSquareIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";

interface DetailSchoolModalProps {
    isOpen: boolean;
    onClose: () => void;
    school: Schools | null;
    onShowMajorDetail: (major: Majors) => void;
    onCreateMajor: (schoolId: number) => void;
    onEditSchool?: (school: Schools) => void;
}

export default function DetailSchoolModal({
    isOpen, 
    onClose, 
    school, 
    onShowMajorDetail,
    onCreateMajor,
    onEditSchool
}: DetailSchoolModalProps) {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isMobileView, setIsMobileView] = useState(false);
    
    // Check for mobile view on mount and window resize
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        
        // Check initially
        checkMobileView();
        
        // Add resize listener
        window.addEventListener('resize', checkMobileView);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkMobileView);
    }, []);
    
    // Reset tab when modal opens with new school
    useEffect(() => {
        if (isOpen) {
            setActiveTab('overview');
        }
    }, [isOpen, school?.id]);

    if (!school) {
        return null;
    }

    // Generate a random color based on school name for the avatar
    const getAvatarColor = (name: string) => {
        const colors = ['primary', 'secondary', 'success', 'warning', 'danger'];
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[hash % colors.length] as any;
    };

    const creationDate = new Date(school.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Custom content for mobile view
    const renderMobileView = () => (
        <div className="space-y-4">
            <div className="flex flex-col items-center text-center mb-6">
                <Avatar
                    className="w-16 h-16 text-lg mb-2"
                    color={getAvatarColor(school.name)}
                    isBordered
                    showFallback
                    fallback={school.acronym || school.name.charAt(0)}
                />
                <h2 className="text-xl font-bold">{school.name}</h2>
                {school.acronym && (
                    <Chip variant="flat" color="primary" className="mt-1 font-mono">
                        {school.acronym}
                    </Chip>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <CalendarIcon className="w-3 h-3" />
                    <span>Created on {creationDate}</span>
                </div>
            </div>

            <Tabs 
                aria-label="School details tabs" 
                selectedKey={activeTab}
                onSelectionChange={setActiveTab as any}
                variant="underlined"
                color="primary"
                classNames={{
                    base: "w-full",
                    tabList: "w-full gap-6 justify-center",
                    cursor: "w-full",
                    tab: "max-w-fit px-2 h-10",
                }}
            >
                <Tab 
                    key="overview" 
                    title={
                        <div className="flex items-center gap-2">
                            <InformationCircleIcon className="w-4 h-4" />
                            <span>Overview</span>
                        </div>
                    }
                >
                    <Card className="p-4 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 border border-primary-100 dark:border-primary-800">
                        <h3 className="text-lg font-semibold mb-2">About</h3>
                        <p className="text-gray-700 dark:text-gray-300">{school.details || "No description available."}</p>
                    </Card>

                    <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-2">Quick Statistics</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <Card className="p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900">
                                    <AcademicCapIcon className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Majors</p>
                                    <p className="text-2xl font-bold">{school.majors?.length || 0}</p>
                                </div>
                            </Card>
                            <Card className="p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900">
                                    <CalendarIcon className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Created On</p>
                                    <p className="text-lg font-semibold">{creationDate}</p>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Tab>
                <Tab 
                    key="majors" 
                    title={
                        <div className="flex items-center gap-2">
                            <AcademicCapIcon className="w-4 h-4" />
                            <span>Majors</span>
                            <Badge size="sm" color="primary" variant="flat" className="ml-1">
                                {school.majors?.length || 0}
                            </Badge>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">All Majors</h3>
                            <Button 
                                variant="flat" 
                                color="primary"
                                size="sm"
                                startContent={<PlusCircleIcon className="w-4 h-4" />}
                                onPress={() => school && onCreateMajor(school.id)}
                            >
                                Add
                            </Button>
                        </div>

                        {school.majors && school.majors.length > 0 ? (
                            <div className="space-y-2">
                                {school.majors.map((major) => (
                                    <Card 
                                        key={major.id}
                                        isPressable
                                        onPress={() => onShowMajorDetail(major)}
                                        className="p-3 border border-gray-200 dark:border-gray-700 hover:border-primary-200 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    size="sm"
                                                    color={getAvatarColor(major.name)}
                                                    className="w-7 h-7 text-xs"
                                                    fallback={major.acronym || major.name.charAt(0)}
                                                />
                                                <div>
                                                    <p className="font-medium">{major.name}</p>
                                                    {major.acronym && (
                                                        <Chip size="sm" variant="flat" color="secondary" className="mt-1">
                                                            {major.acronym}
                                                        </Chip>
                                                    )}
                                                </div>
                                            </div>
                                            <Tooltip content="View details">
                                                <Button 
                                                    isIconOnly 
                                                    size="sm" 
                                                    variant="light"
                                                    color="primary"
                                                >
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-6 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <AcademicCapIcon className="w-12 h-12 text-gray-400 mb-3" />
                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Majors Yet</h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    This school doesn't have any majors assigned yet.
                                </p>
                                <Button 
                                    color="primary" 
                                    variant="flat"
                                    startContent={<PlusCircleIcon className="w-4 h-4" />}
                                    onPress={() => school && onCreateMajor(school.id)}
                                >
                                    Add First Major
                                </Button>
                            </Card>
                        )}
                    </div>
                </Tab>
            </Tabs>

            {onEditSchool && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="flat"
                        color="primary"
                        startContent={<PencilSquareIcon className="w-4 h-4" />}
                        onPress={() => onEditSchool(school)}
                        className="w-full"
                    >
                        Edit School Details
                    </Button>
                </div>
            )}
        </div>
    );

    // Desktop view content
    const renderDesktopView = () => (
        <div className="flex flex-col gap-6">
            <div className="flex items-start gap-6">
                {/* Left sidebar with school info */}
                <div className="w-1/3">
                    <Card className="p-5 bg-white dark:bg-gray-800 shadow-sm h-full flex flex-col items-center text-center">
                        <Avatar
                            className="w-20 h-20 text-xl mb-3"
                            color={getAvatarColor(school.name)}
                            isBordered
                            showFallback
                            fallback={school.acronym || school.name.charAt(0)}
                        />
                        <h2 className="text-xl font-bold">{school.name}</h2>
                        {school.acronym && (
                            <Chip variant="flat" color="primary" className="mt-1 font-mono">
                                {school.acronym}
                            </Chip>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-2 mb-4">
                            <CalendarIcon className="w-3 h-3" />
                            <span>Created on {creationDate}</span>
                        </div>
                        
                        <Divider className="my-4" />
                        
                        <div className="w-full space-y-3 mb-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Total Majors:</span>
                                <Badge color="primary" variant="flat">
                                    {school.majors?.length || 0}
                                </Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">ID:</span>
                                <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {school.id}
                                </span>
                            </div>
                        </div>
                        
                        {onEditSchool && (
                            <Button
                                variant="flat"
                                color="primary"
                                startContent={<PencilSquareIcon className="w-4 h-4" />}
                                onPress={() => onEditSchool(school)}
                                className="w-full mt-auto"
                            >
                                Edit School
                            </Button>
                        )}
                    </Card>
                </div>

                {/* Main content area */}
                <div className="w-2/3">
                    <Tabs 
                        aria-label="School details tabs" 
                        selectedKey={activeTab}
                        onSelectionChange={setActiveTab as any}
                        variant="underlined"
                        color="primary"
                        classNames={{
                            base: "w-full",
                            tabList: "w-full gap-8",
                            cursor: "w-full",
                            tab: "max-w-fit px-4 h-12",
                        }}
                    >
                        <Tab 
                            key="overview" 
                            title={
                                <div className="flex items-center gap-2">
                                    <InformationCircleIcon className="w-5 h-5" />
                                    <span>Overview</span>
                                </div>
                            }
                        >
                            <div className="space-y-6 p-1">
                                <Card className="p-5 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900 dark:to-gray-900 border border-primary-100 dark:border-primary-800">
                                    <h3 className="text-lg font-semibold mb-3">About</h3>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {school.details || "No description available."}
                                    </p>
                                </Card>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3">Quick Statistics</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Card className="p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900">
                                                <AcademicCapIcon className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Total Majors</p>
                                                <p className="text-2xl font-bold">{school.majors?.length || 0}</p>
                                            </div>
                                        </Card>
                                        <Card className="p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                            <div className="p-2 rounded-full bg-purple-50 dark:bg-purple-900">
                                                <UserGroupIcon className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Students</p>
                                                <p className="text-2xl font-bold">-</p>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </Tab>
                        <Tab 
                            key="majors" 
                            title={
                                <div className="flex items-center gap-2">
                                    <AcademicCapIcon className="w-5 h-5" />
                                    <span>Majors</span>
                                    <Badge size="sm" color="primary" variant="flat" className="ml-1">
                                        {school.majors?.length || 0}
                                    </Badge>
                                </div>
                            }
                        >
                            <div className="space-y-4 p-1">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">All Majors</h3>
                                    <Button 
                                        variant="flat" 
                                        color="primary"
                                        startContent={<PlusCircleIcon className="w-4 h-4" />}
                                        onPress={() => school && onCreateMajor(school.id)}
                                    >
                                        Add Major
                                    </Button>
                                </div>

                                {school.majors && school.majors.length > 0 ? (
                                    <Table 
                                        aria-label="Majors table" 
                                        shadow="sm"
                                        isStriped
                                        selectionMode="single"
                                        color="primary"
                                        onRowAction={(key) => {
                                            const major = school.majors.find(m => m.id === Number(key));
                                            if (major) onShowMajorDetail(major);
                                        }}
                                        classNames={{
                                            base: "rounded-lg overflow-hidden",
                                            th: "bg-gray-50 dark:bg-gray-900 text-xs font-medium"
                                        }}
                                    >
                                        <TableHeader>
                                            <TableColumn>NAME</TableColumn>
                                            <TableColumn>ACRONYM</TableColumn>
                                            <TableColumn>DETAILS</TableColumn>
                                        </TableHeader>
                                        <TableBody items={school.majors}>
                                            {(major: Majors) => (
                                                <TableRow key={major.id} className="cursor-pointer">
                                                    <TableCell className="font-medium">{major.name}</TableCell>
                                                    <TableCell>
                                                        <Chip size="sm" variant="flat" color="secondary">
                                                            {major.acronym}
                                                        </Chip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip content={major.details} placement="left">
                                                            <span className="line-clamp-1">
                                                                {major.details || "No details available"}
                                                            </span>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <Card className="p-6 flex flex-col items-center justify-center text-center border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <AcademicCapIcon className="w-12 h-12 text-gray-400 mb-3" />
                                        <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">No Majors Yet</h4>
                                        <p className="text-sm text-gray-500 mb-4">
                                            This school doesn't have any majors assigned yet.
                                        </p>
                                        <Button 
                                            color="primary" 
                                            variant="flat"
                                            startContent={<PlusCircleIcon className="w-4 h-4" />}
                                            onPress={() => school && onCreateMajor(school.id)}
                                        >
                                            Add First Major
                                        </Button>
                                    </Card>
                                )}
                            </div>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    );

    return (
        <BlurModal
            isOpen={isOpen}
            onClose={onClose}
            title={
                !isMobileView ? (
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary-50 dark:bg-primary-900">
                            <BuildingLibraryIcon className="w-6 h-6 text-primary-500" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold">School Details</h2>
                            </div>
                        </div>
                    </div>
                ) : null
            }
            showDefaultFooter={false}
            size={isMobileView ? "md" : "5xl"}
        >
            {isMobileView ? renderMobileView() : renderDesktopView()}
        </BlurModal>
    );
}