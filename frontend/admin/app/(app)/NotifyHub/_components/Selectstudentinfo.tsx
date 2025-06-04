import { Switch } from '@heroui/react';
import React, { useState } from 'react';
import { TableInfo } from './TableStudent';

export function SelectStudent() {
  const [showSelect, setShowSelect] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <Switch size="lg" isSelected={showSelect} onValueChange={setShowSelect}>
        All Student
      </Switch>

      {!showSelect && (
        <TableInfo />
      )}
    </div>
  );
}