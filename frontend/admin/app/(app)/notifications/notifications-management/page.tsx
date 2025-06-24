'use client';
import { PageHeader } from '@/components/ui/page-header';
import { useNotification } from '@/hooks/useNotification';
import { BellDot } from 'lucide-react';
import { useMemo, useState } from 'react';
import InformationCard from './_components/NotificationInfoCard';
import TopContent from './_components/NotificationTopContent';

export default function NotificationManagement() {
  const { notification } = useNotification();
  const [search, setSearch] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const uniqueScopes = useMemo(() => {
    const scopes = notification.flatMap((notification) => {
      const scope = notification.scope;
      if (Array.isArray(scope)) {
        return scope.map((t) => t.type);
      }
      return [scope];
    });

    return Array.from(new Set(scopes));
  }, [notification]);

  const filteredNotifications = notification.filter((item) => {
    const matchSearch =
      item.title.en.toLowerCase().includes(search.toLowerCase()) ||
      item.body.en.toLowerCase().includes(search.toLowerCase());

    const scopeList = Array.isArray(item.scope)
      ? item.scope.map((t) => t.type)
      : [item.scope];

    const matchType =
      selectedTypes.length === 0 ||
      scopeList.some((scope) => selectedTypes.includes(scope));

    return matchSearch && matchType;
  });

  return (
    <>
      <PageHeader
        title="Notifications Management"
        description="Manage notification information"
        icon={<BellDot />}
      />
      <TopContent
        search={search}
        setSearch={setSearch}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        uniqueScopes={uniqueScopes}
      />
      <InformationCard notification={filteredNotifications} />
    </>
  );
}
