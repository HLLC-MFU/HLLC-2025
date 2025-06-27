import { Major } from "@/types/major";
import { School } from "@/types/school";
import { User } from "@/types/user";
import { Button, Checkbox, Chip, Input, Pagination, Selection, Tab, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tabs, Tooltip } from "@heroui/react";
import { ChevronsRight, GraduationCap, RotateCcw, SchoolIcon, SearchIcon, ShieldUser, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Notification, Target } from "@/types/notification";

type NotificationScopeSelectorProps = {
	notification: Notification;
	onChange: React.Dispatch<React.SetStateAction<Notification>>;
	schools: School[];
	majors: Major[];
	users: User[];
};

const ScopeGroupOptions = [
	{title: "School", key: "school"},
	{title: "Major", key: "major"},
	{title: "User", key: "user"},
]

export function NotificationScopeSelector({ notification, onChange, schools, majors, users }: NotificationScopeSelectorProps) {
	const [isGlobal, setIsGlobal] = useState(true);
	const [selectedScopeGroup, setSelectedScopeGroup] = useState("school");
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [page, setPage] = useState(1);
	const pageSize = 8;
	const [selectedScopeKeys, setSelectedScopeKeys] = useState<Selection>(new Set());

	const getMappedScopes = (keys: Selection): Target[] | "global"=> {
		if (keys === "all") return "global";

		const selected = Array.from(keys ?? []) as string[];

		const userIds = selected.filter(id => users.some(u => u._id === id));
		const schoolIds = selected.filter(id => schools.some(s => s._id === id));
		const majorIds = selected.filter(id => majors.some(m => m._id === id));

		const result: Target[] = [];
		if (userIds.length) result.push({ type: "user", id: userIds });
		if (schoolIds.length) result.push({ type: "school", id: schoolIds });
		if (majorIds.length) result.push({ type: "major", id: majorIds });

		return result;
	};

	const handleGlobalChange = (checked: boolean) => {
    setIsGlobal(checked);
    if (checked) {
      onChange({ ...notification, scope: "global" });
			
    } else {
			onChange({ ...notification, scope: getMappedScopes(selectedScopeKeys) });
    }
  };

	const handleSelectionChange = (keys: Selection) => {
		setSelectedScopeKeys(keys);
		if (!isGlobal) {
			onChange({ ...notification, scope: getMappedScopes(keys) });
		}
	};

	const columns = useMemo(() => {
		const baseColumns = [
			{
				key: "name",
				label: "NAME",
			},
			{
				key: "school",
				label: "SCHOOL",
			},
			{
				key: "major",
				label: "MAJOR",
			},
			{
				key: "actions",
				label: "ACTIONS",
			},
		];

		return baseColumns.filter((col) => {
			if (selectedScopeGroup === "school") {
				return col.key !== "school" && col.key !== "major";
			}
			if (selectedScopeGroup === "major") {
				return col.key !== "major";
			}
			if (selectedScopeGroup === "user") {
				return col.key !== "actions";
			}
			return true;
		});
	}, [selectedScopeGroup]);

	function renderCell(item: School | Major | User , columnKey: string) {
		if ('majors' in item) {
			switch (columnKey) {
				case 'name':
					return (
						<div className="flex flex-row items-center gap-2">
							<div className="border rounded-full p-1.5 bg-gray-200 shadow-lg">
								<SchoolIcon width={24} height={24}/>
							</div>
							<div className="flex flex-col">
								<p>{item.name.en}</p>
								<p className="text-default-500">{item.acronym}</p>
							</div>
						</div>
					);
				case "actions":
					return (
						<div className="relative flex items-center justify-center">
							<Tooltip content={`See majors in ${item.acronym}`}>
								<Button 
									isIconOnly
									size="sm"
									variant="light" 
									onPress={()=> {
										setSearchQuery(item.name.en);
										setSelectedScopeGroup("major")
									}}
								>
									<ChevronsRight color="#006FEE" />
								</Button>
							</Tooltip>
						</div>
					);
			}
		}

		if ('school' in item) {
			switch (columnKey) {
				case 'name':
					return (
						<div className="flex flex-row items-center gap-2">
							<div className="border rounded-full p-1.5 bg-gray-200 shadow-lg">
								<GraduationCap width={24} height={24}/>
							</div>
							<div className="flex flex-col">
								<p>{item.name.en}</p>
								<p className="text-default-500">{item.acronym}</p>
							</div>
						</div>
					);
				case 'school':

					return typeof item.school !== 'string' ? 
						<Chip size="sm">{item.school?.name.en}</Chip> : '';
				case "actions":
					return (
						<div className="relative flex items-center justify-center">
							<Tooltip content={`See users in ${item.acronym}`}>
								<Button 
									isIconOnly 
									size="sm" 
									variant="light" 
									onPress={()=> {
										setSearchQuery(item.name.en);
										setSelectedScopeGroup("user")
									}}
								>
									<ChevronsRight color="#006FEE" className="text-default-300" />
								</Button>
							</Tooltip>
						</div>
					);
			}
		}

		if ('username' in item) {
			switch (columnKey) {
				case 'name':
					return (
						<div className="flex flex-row items-center gap-2">
							<div className="border rounded-full p-1.5 bg-gray-200 shadow-lg">
								{item.role.name === 'Administrator' ? <ShieldUser width={24} height={24}/> : <UserRound width={24} height={24}/>}
							</div>
							<div className="flex flex-col">
								<p>{`${item.name.first} ${!!item.name.middle || ''} ${item.name.last}`}</p>
								<p className="text-default-500">{item.username}</p>
							</div>
						</div>
					);
				case 'school':
					return	item.metadata ? <Chip size="sm">{item.metadata.major.school.name.en}</Chip> : '';
				case 'major':
					return	item.metadata ? <Chip size="sm">{item.metadata.major.name.en}</Chip> : '';
			}
		}

		return null;
	}

	const filteredItems = useMemo(() => {
		const selected = selectedScopeGroup;
		const allItems: (User | School | Major)[] = [
			...(selected === "school" ? schools : []),
			...(selected === "major" ? majors : []),
			...(selected === "user" ? users : []),
		];

		if (!searchQuery.trim()) return allItems;

		const lowerQuery = searchQuery.toLowerCase();

		return allItems.filter((item) => {
			if ("majors" in item) {
				return (
					item.name.en.toLowerCase().includes(lowerQuery) ||
					item.acronym.toLowerCase().includes(lowerQuery)
				);
			}
			if ("school" in item) {
				return (
					item.name.en.toLowerCase().includes(lowerQuery) ||
					item.acronym.toLowerCase().includes(lowerQuery) ||
					(typeof item.school !== "string" && item.school?.name.en.toLowerCase().includes(lowerQuery))
				);
			}
			if ("username" in item) {
				return (
					item.username.toLowerCase().includes(lowerQuery) ||
					`${item.name.first} ${item.name.last}`.toLowerCase().includes(lowerQuery) ||
					item.metadata?.major.name.en.toLowerCase().includes(lowerQuery) ||
					item.metadata?.major.school.name.en.toLowerCase().includes(lowerQuery)
				);
			}
			return false;
		});
	}, [schools, majors, users, selectedScopeGroup, searchQuery]);

	const pages = Math.ceil(filteredItems.length / pageSize);

	const paginatedItems = useMemo(() => {
		const start = (page - 1) * pageSize;
		return filteredItems.slice(start, start + pageSize);
	}, [filteredItems, page]);

	const getItemById = (id: string): { name: string; type: 'school' | 'major' | 'user'; icon: React.ReactNode } | null => {
		const school = schools.find(s => s._id === id);
		if (school) return { name: school.name.en, type: 'school', icon: <SchoolIcon size={16} /> };

		const major = majors.find(m => m._id === id);
		if (major) return { name: major.name.en, type: 'major', icon: <GraduationCap size={16} /> };

		const user = users.find(u => u._id === id);
		if (user) return { name: `${user.name.first} ${user.name.last}`, type: 'user', icon: <UserRound size={16} /> };

		return null;
	};

	const NotificationTableTopContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
					<Input
            isClearable
            className="w-full sm:max-w-[40%]"
            placeholder="Search by school, major or name"
            startContent={<SearchIcon />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />

          <div className="flex gap-3 items-center">
						<Tabs 
							items={ScopeGroupOptions}
							selectedKey={selectedScopeGroup} 
							onSelectionChange={(key) => {
								if (key !== null) setSelectedScopeGroup(key as string);
							}}	
						>
							{(scope) => (
								<Tab
									key={scope.key}
									title={scope.title}
								></Tab>
							)}
						</Tabs>
						<Tooltip content="Reset scope">
							<Button
								color="danger"
								variant="flat"
								isIconOnly
								startContent={<RotateCcw size={20}/>}
								onPress={() => {
									setSearchQuery("");
									setSelectedScopeGroup("school");
									setSelectedScopeKeys(new Set());
								}}
							/>
						</Tooltip>
          </div>

        </div>
      </div>
    );
  }, [
		selectedScopeGroup,
		searchQuery
  ]);

	const NotificationTableBottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
					Showing {paginatedItems.length} of {filteredItems.length} items
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [filteredItems.length, paginatedItems.length, page, pages, selectedScopeKeys]);

  return (
		<>
			<Checkbox 
				defaultSelected
				size="lg"
				isSelected={isGlobal}
				onValueChange={handleGlobalChange}
			>
        All Student
      </Checkbox>

			{!isGlobal && (
				<>
					<Table
						aria-label="Scope Table"
						isCompact
						removeWrapper
						selectionMode="multiple"
						topContent={NotificationTableTopContent}
						bottomContent={NotificationTableBottomContent}
						selectedKeys={selectedScopeKeys}
						onSelectionChange={handleSelectionChange}
					>
						<TableHeader columns={columns}>
							{(column) => (
								<TableColumn
									key={column.key}
									align={column.key === "actions" ? "center" : "start"}
								>
									{column.label}
								</TableColumn>
							)}
						</TableHeader>
						<TableBody 
							emptyContent={"No schools, majors, users found"} 
							items={paginatedItems}
						>
							{(item) => (
								<TableRow key={item._id}>
									{(columnKey) => <TableCell>{renderCell(item, columnKey as string)}</TableCell>}
								</TableRow>
							)}
						</TableBody>
					</Table>
					{selectedScopeKeys !== 'all' && selectedScopeKeys instanceof Set && selectedScopeKeys.size > 0 && (
						<div className="flex flex-wrap gap-2">
							{Array.from(selectedScopeKeys).map((id) => {
								const item = getItemById(id.toString());
								if (!item) return null;
								return (
									<Chip
										key={id}
										variant="flat"
										startContent={item.icon}
										onClose={() => {
											const newKeys = new Set(selectedScopeKeys);
											newKeys.delete(id);
											setSelectedScopeKeys(newKeys);
											onChange({ ...notification, scope: getMappedScopes(newKeys) });
										}}
									>
										{item.name}
									</Chip>
								);
							})}
						</div>
					)}
				</>
			)}
		</>
	)

} 