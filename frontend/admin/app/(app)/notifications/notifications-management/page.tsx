'use client';
import { BellDot } from 'lucide-react';
import { useMemo, useState } from 'react';

import InformationCard from './_components/NotificationInfoCard';
import TopContent from './_components/NotificationTopContent';

import { useNotification } from '@/hooks/useNotification';
import { PageHeader } from '@/components/ui/page-header';

export default function NotificationManagement() {
  const { notifications } = useNotification();
  const [search, setSearch] = useState('');
  const [types, setTypes] = useState<string[]>([]);

  const uniqueScopes = useMemo(() => {
    const scopes = notifications.flatMap((notifications) => {
      const scope = notifications.scope;

      if (Array.isArray(scope)) {
        return scope.map((t) => t.type);
      }

      return [scope];
    });

    return Array.from(new Set(scopes));
  }, [notifications]);

  const filteredNotifications = notifications.filter((item) => {
    const matchSearch =
      item.title.en.toLowerCase().includes(search.toLowerCase()) ||
      item.body.en.toLowerCase().includes(search.toLowerCase());

    const scopeList = Array.isArray(item.scope)
      ? item.scope.map((t) => t.type)
      : [item.scope];

    const matchType =
      types.length === 0 ||
      scopeList.some((scope) => types.includes(scope));

    return matchSearch && matchType;
  });

  return (
    <>
      <PageHeader
        description="Manage notification information"
        icon={<BellDot />}
        title="Notifications Management"
      />
      <TopContent
        search={search}
        setSearch={setSearch}
        setTypes={setTypes}
        types={types}
        uniqueScopes={uniqueScopes}
      />
      <InformationCard notifications={filteredNotifications} />
    </>
  );
}
