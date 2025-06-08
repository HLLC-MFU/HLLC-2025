import { Switch } from '@heroui/react';
import React, { useState } from 'react';
import { TableInfo } from './TableStudent';

export function SelectStudent({
  onScopeChange,
}: {
  onScopeChange?: (scope: 'global' | { type: 'individual'; id: string[] }[]) => void;
}) {
  const [showSelect, setShowSelect] = useState(true);

  const handleToggle = (val: boolean) => {
    setShowSelect(val);
    if (val) {
      onScopeChange?.('global');
    } else {
      onScopeChange?.([]); // ยังไม่มี user ถูกเลือก
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Switch size="lg" isSelected={showSelect} onValueChange={handleToggle}>
        All Student
      </Switch>

      {!showSelect && (
        <TableInfo
          onSelectionChange={(ids) => {
            onScopeChange?.([
              {
                type: 'individual',
                id: ids,
              },
            ]);
          }}
        />
      )}
    </div>
  );
}