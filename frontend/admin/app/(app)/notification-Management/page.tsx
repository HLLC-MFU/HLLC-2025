"use client"
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';
import { BellDot, ChevronDown, Search } from 'lucide-react';
import NotificationCard, { capitalize } from './_components/NotificationInformationCard';
import { useMemo, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/react';
import React from 'react';

export default function Notification_Management() {
    const { notification } = useNotification();
    const [search, setSearch] = useState('');
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    const uniqueScopes = useMemo(() => {
        const scopes = notification.flatMap((notification) => {
            const scope = notification.scope;
            if (Array.isArray(scope)) {
                return scope.map((t) => capitalize(t.type));
            }
            return [capitalize(scope)];
        });

        return Array.from(new Set(scopes));
    }, [notification]);


    const filteredNotifications = notification.filter((item) => {
        const matchSearch =
            item.title.en.toLowerCase().includes(search.toLowerCase()) ||
            item.body.en.toLowerCase().includes(search.toLowerCase());

        const scopeList = Array.isArray(item.scope)
            ? item.scope.map((t) => capitalize(t.type))
            : [capitalize(item.scope)];

        const matchType = selectedTypes.length === 0 || scopeList.some(scope => selectedTypes.includes(scope));

        return matchSearch && matchType ;
    });

    return (
        <>
            <PageHeader description='I don know' icon={<BellDot />} />

            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    classNames={{
                        base: 'w-full sm:max-w-[35%]',
                        inputWrapper: 'border-1',
                    }}
                    placeholder="Search by Title name"
                    size="md"
                    startContent={<Search className="text-default-300" />}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className='flex gap-3'>
                    <Dropdown>
                        <DropdownTrigger className="hidden sm:flex">
                            <Button
                                endContent={<ChevronDown className="text-small" />}
                                size="md"
                                variant="flat"
                            >
                                Type
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Select Types"
                            closeOnSelect={false}
                            selectedKeys={new Set(selectedTypes)}
                            selectionMode="multiple"
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys) as string[];
                                setSelectedTypes(selected);
                            }}
                            className="max-h-48 overflow-y-auto"
                        >
                            {uniqueScopes.map((scope) => (
                                <DropdownItem key={scope} className="capitalize">
                                    {scope}
                                </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </div>
            </div>

            <div className='w-full mt-7 justify-center items-center '>
                <NotificationCard notification={filteredNotifications} />
            </div>
        </>
    )
}
