import { Card, CardHeader, CardBody, Divider, Select, SelectItem, Input, Button } from "@heroui/react";
import { Filter, X, Search } from "lucide-react";
import { MockFilterData } from "@/types/assessment";

interface FilterSectionProps {
    userType: string;
    school: string;
    major: string;
    searchQuery: string;
    onUserTypeChange: (value: string) => void;
    onSchoolChange: (value: string) => void;
    onMajorChange: (value: string) => void;
    onSearchChange: (value: string) => void;
    onReset: () => void;
    filterData: MockFilterData;
}

export function FilterSection({
    userType,
    school,
    major,
    searchQuery,
    onUserTypeChange,
    onSchoolChange,
    onMajorChange,
    onSearchChange,
    onReset,
    filterData
}: FilterSectionProps) {
    return (
        <Card>
            <CardHeader className="flex items-center gap-2 pb-2">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Filters</h3>
            </CardHeader>
            <Divider />
            <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">User Type</label>
                        <Select
                            selectedKeys={[userType]}
                            onSelectionChange={(keys) => onUserTypeChange(Array.from(keys)[0] as string)}
                            className="w-full"
                        >
                            {filterData.userTypes.map((type) => (
                                <SelectItem key={type}>{type}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">School</label>
                        <Select
                            selectedKeys={[school]}
                            onSelectionChange={(keys) => onSchoolChange(Array.from(keys)[0] as string)}
                            className="w-full"
                        >
                            {filterData.schools.map((s) => (
                                <SelectItem key={s}>{s}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Major</label>
                        <Select
                            selectedKeys={[major]}
                            onSelectionChange={(keys) => onMajorChange(Array.from(keys)[0] as string)}
                            className="w-full"
                        >
                            {filterData.majors.map((m) => (
                                <SelectItem key={m}>{m}</SelectItem>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Search</label>
                        <Input
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            startContent={<Search className="text-default-400" size={20} />}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="flat"
                            color="danger"
                            startContent={<X size={16} />}
                            onPress={onReset}
                            className="w-full"
                        >
                            Reset Filters
                        </Button>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
} 