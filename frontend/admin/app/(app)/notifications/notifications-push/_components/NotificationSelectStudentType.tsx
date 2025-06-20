import { Switch } from '@heroui/react';
import React, { useState } from 'react';
import { TableStudentInformation } from './NotificationTableStudent';

type SelectionScope = {
    type: 'major' | 'school' | 'individual';
    id: string[];
};

export function SelectStudentType({ onScopeChange }: { onScopeChange?: (scope: 'global' | SelectionScope[]) => void }) {
  
  const [showSelect, setShowSelect] = useState(true);
  const [tableKey, setTableKey] = useState(0); 

  const handleToggle = (val: boolean) => {
    setShowSelect(val);

    if (val) {
      setTableKey((prev) => prev + 1); 
      onScopeChange?.('global');
    } else {
      onScopeChange?.([]); 
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Switch size="md" isSelected={showSelect} onValueChange={handleToggle}>
        All Student
      </Switch>

      {!showSelect && (
        <TableStudentInformation
          key={tableKey} 
          onSelectionChange={(scope) => {
            onScopeChange?.(scope);
          }}
        />
      )}
    </div>
  );
}
