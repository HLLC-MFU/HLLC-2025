import { Select, SelectItem, Switch, Avatar } from '@heroui/react';
import React, { useState } from 'react';

export const animals = [
  { key: 'cat', label: 'Cat' },
  { key: 'dog', label: 'Dog' },
  { key: 'elephant', label: 'Elephant' },
  { key: 'lion', label: 'Lion' },
  { key: 'tiger', label: 'Tiger' },
  { key: 'giraffe', label: 'Giraffe' },
  { key: 'dolphin', label: 'Dolphin' },
  { key: 'penguin', label: 'Penguin' },
  { key: 'zebra', label: 'Zebra' },
  { key: 'shark', label: 'Shark' },
  { key: 'whale', label: 'Whale' },
  { key: 'otter', label: 'Otter' },
  { key: 'crocodile', label: 'Crocodile' },
];

export function Selectstudent() {
  return (
    <div className="flex flex-col gap-5">
      <Switch defaultSelected size="lg">
        All Student
      </Switch>
      <Select
        className="max-w"
        label="Student Select"
        selectionMode="multiple"
        size="lg"
        labelPlacement="inside"
        variant="faded" //flat
      >
        {animals.map(animal => (
          <SelectItem key={animal.key}>{animal.label}</SelectItem>
        ))}
      </Select>
    </div>
  );
}
