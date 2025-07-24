"use client";

import React, { useState, useMemo } from "react";
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
} from "@heroui/react";
import { Device } from "@/hooks/useDevices";

type Props = {
  devices: Device[];
  loading: boolean;
};

export default function DeviceTable({ devices, loading }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const columns = [
    { name: "DEVICE ID", uid: "deviceId" },
    { name: "BRAND", uid: "brand" },
    { name: "PLATFORM", uid: "platform" },
    { name: "OS", uid: "osName" },
    { name: "APP VERSION", uid: "appVersion" },
  ];

  // ดึง unique brands และ platforms มาใช้ทำ filter options
  const brands = useMemo(
    () => Array.from(new Set(devices.map((d) => d.brand).filter(Boolean))),
    [devices]
  );

  const platforms = useMemo(
    () => Array.from(new Set(devices.map((d) => d.platform).filter(Boolean))),
    [devices]
  );

  // กรอง devices ตาม search, brand, platform
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        [device.deviceId, device.brand, device.platform, device.osName]
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesBrand = selectedBrand ? device.brand === selectedBrand : true;
      const matchesPlatform = selectedPlatform
        ? device.platform === selectedPlatform
        : true;

      return matchesSearch && matchesBrand && matchesPlatform;
    });
  }, [devices, searchQuery, selectedBrand, selectedPlatform]);

  return (
    <div>
      {/* Search bar */}
      <Input
        placeholder="Search devices..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
        aria-label="Search devices"
      />

      {/* Filter dropdowns */}
      <div className="flex gap-4 mb-4">
        {/* Brand filter */}
        <Dropdown>
          <DropdownTrigger>
            <Button>
              Brand: {selectedBrand ?? "All"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onClick={() => setSelectedBrand(null)} key={"brand"}>
              All
            </DropdownItem>
            <>
            {brands.map((brand) => (
              <DropdownItem key={brand} onClick={() => setSelectedBrand(brand)}>
                {brand}
              </DropdownItem>
            ))}
            </>
          </DropdownMenu>
        </Dropdown>

        {/* Platform filter */}
        <Dropdown>
          <DropdownTrigger>
            <Button>
              Platform: {selectedPlatform ?? "All"}
            </Button>
          </DropdownTrigger>
          <DropdownMenu>
            <DropdownItem onClick={() => setSelectedPlatform(null)} key={"platform"}>
              All
            </DropdownItem>
            <>
            {platforms.map((platform) => (
              <DropdownItem
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
              >
                {platform}
              </DropdownItem>
            ))}
            </>
          </DropdownMenu>
        </Dropdown>
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
              <TableCell>
                {device.osName} {device.osVersion}
              </TableCell>
              <TableCell>{device.appVersion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
