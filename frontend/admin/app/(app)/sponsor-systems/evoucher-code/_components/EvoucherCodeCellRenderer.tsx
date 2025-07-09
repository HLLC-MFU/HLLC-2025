import React, { Key, ReactNode } from 'react';
import { EvoucherCode } from '@/types/evoucher-code';
import { User } from '@/types/user';

export type EvoucherCodeColumnKey = 'code' | 'usedAt' | 'isUsed' | 'user';

type EvoucherCodeCellRendererProps = {
  evoucherCodes: EvoucherCode;
  columnKey: Key;
};

export default function EvoucherCodeCellRenderer({
  evoucherCodes,
  columnKey,
}: EvoucherCodeCellRendererProps): ReactNode {
  switch (columnKey) {
    case 'code':
      return <span>{evoucherCodes.code}</span>;
    case 'usedAt':
      return (
        <span>
          {evoucherCodes.usedAt ? evoucherCodes.usedAt.toLocaleString() : '-'}
        </span>
      );
    case 'isUsed':
      const used = evoucherCodes.isUsed.toString();
      return <span className="capitalize">{used}</span>;
    case 'user':
      const user = evoucherCodes.user as User;
      const userName = [user?.name.first, user?.name.middle, user?.name.last].filter(Boolean).join(' ');
      return (
        <span>{!!userName ? userName : '-'}</span>
      );
    default:
      return <span>-</span>;
  }
}
