'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '@heroui/react';
import { Device } from '@/hooks/useDevices';

type Props = {
  devices: Device[];
  loading: boolean;
  onFilteredCountChange?: (count: number) => void;
};

export default function DeviceTable({ devices, loading, onFilteredCountChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const columns = [
    { name: 'DEVICE ID', uid: 'deviceId' },
    { name: 'BRAND', uid: 'brand' },
    { name: 'PLATFORM', uid: 'platform' },
    { name: 'OS', uid: 'osName' },
    { name: 'APP VERSION', uid: 'appVersion' },
  ];

  const brands = useMemo(
    () => Array.from(new Set(devices.map((d) => d.brand).filter(Boolean))),
    [devices],
  );

  const platforms = useMemo(
    () => Array.from(new Set(devices.map((d) => d.platform).filter(Boolean))),
    [devices],
  );

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = [
        device.deviceId,
        device.brand,
        device.platform,
        device.osName,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesBrand = selectedBrand
        ? device.brand === selectedBrand
        : true;
      const matchesPlatform = selectedPlatform
        ? device.platform === selectedPlatform
        : true;

      return matchesSearch && matchesBrand && matchesPlatform;
    });
  }, [devices, searchQuery, selectedBrand, selectedPlatform]);

  useEffect(() => {
    onFilteredCountChange?.(filteredDevices.length);
  }, [filteredDevices.length, onFilteredCountChange]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <Input
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search devices"
          className="flex-grow max-w-full md:max-w-md"
        />
        <div className="flex gap-4">
          <Dropdown>
            <DropdownTrigger>
              <Button>Brand: {selectedBrand ?? 'All'}</Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onClick={() => setSelectedBrand(null)} key={'brand'}>All</DropdownItem>
              <>
              {brands.map((brand) => (
                <DropdownItem key={brand} onClick={() => setSelectedBrand(brand)}>
                  {brand}
                </DropdownItem>
              ))}</>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button>Platform: {selectedPlatform ?? 'All'}</Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onClick={() => setSelectedPlatform(null)} key={'platform'}>All</DropdownItem>
              <>
              {platforms.map((platform) => (
                <DropdownItem key={platform} onClick={() => setSelectedPlatform(platform)}>
                  {platform}
                </DropdownItem>
              ))}</>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <Table aria-label="Devices Table">
        <TableHeader>
          {columns.map((col) => (
            <TableColumn key={col.uid}>{col.name}</TableColumn>
          ))}
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner label="Loading devices..." />}
        >
          {filteredDevices.map((device) => (
            <TableRow key={device._id}>
              <TableCell>{device.deviceId}</TableCell>
              <TableCell>{device.brand}</TableCell>
              <TableCell>{device.platform}</TableCell>
              <TableCell>{device.osName} {device.osVersion}</TableCell>
              <TableCell>{device.appVersion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
