'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Dropdown,
  DropdownMenu,
  DropdownTrigger,
  DropdownItem,
  Input,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';

import { MoreVertical, Search, Download, Pencil, Globe } from 'lucide-react';
import { saveAs } from 'file-saver';

const columns = [
  { name: 'Code', uid: 'code' },
  { name: 'Name', uid: 'name' },
  { name: 'Open', uid: 'open' },
  { name: 'Progress counting', uid: 'progress' },
  { name: 'Visibility', uid: 'visibility' },
  { name: 'Actions', uid: 'actions' },
];

export default function ActivityPage() {
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'th'>('en');

  const fetchActivities = useCallback(async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
    });
    const res = await fetch(`/api/activities?${params}`);
    const data = await res.json();
    setActivities(data.items);
    setTotal(data.total);
  }, [page, limit, search]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const exportCSV = () => {
    const csv = [Object.keys(columns.filter(c => c.uid !== 'actions')[0]).join(',')].concat(
      activities.map((item) => `${item.code},${item.name},${item.open},${item.progress},${item.visibility}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'activities.csv');
  };

  const toggleLang = () => setLanguage(lang => lang === 'en' ? 'th' : 'en');

  const renderCell = (activity, columnKey) => {
    switch (columnKey) {
      case 'open':
        return <Chip color="success" variant="flat">🔒 {activity.open}</Chip>;
      case 'progress':
        return <Chip color={activity.progress === 'PROGRESS' ? 'success' : 'warning'} variant="flat">{activity.progress === 'PROGRESS' ? '🔄 PROGRESS' : '🔄 NO PROGRESS'}</Chip>;
      case 'visibility':
        return <Chip color={activity.visibility === 'SHOW' ? 'success' : 'default'} variant="flat">{activity.visibility === 'SHOW' ? '👁️ SHOW' : '🙈 HIDE'}</Chip>;
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <MoreVertical className="text-default-400 h-4 w-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem startContent={<Pencil size={16} />} onClick={() => { setEditItem(activity); setIsEditOpen(true); }}>Edit</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return activity[columnKey];
    }
  };

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="flex justify-between items-center">
        <Input
          isClearable
          placeholder={language === 'th' ? 'ค้นหากิจกรรม...' : 'Search activities...'}
          value={search}
          startContent={<Search className="text-default-400 h-4 w-4" />}
          onClear={() => setSearch('')}
          onValueChange={val => {
            setPage(1);
            setSearch(val);
          }}
          className="w-full max-w-md"
        />
        <div className="flex gap-2">
          <Button onClick={exportCSV} startContent={<Download size={16} />}>CSV</Button>
          <Button onClick={toggleLang} startContent={<Globe size={16} />}>{language.toUpperCase()}</Button>
        </div>
      </div>

      <Table aria-label="Activities Table">
        <TableHeader columns={columns}>
          {column => (
            <TableColumn key={column.uid} align={column.uid === 'actions' ? 'center' : 'start'}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={activities}>
          {item => (
            <TableRow key={item.code}>
              {columnKey => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Pagination
        isCompact
        showControls
        showShadow
        page={page}
        total={Math.ceil(total / limit)}
        onChange={setPage}
        color="primary"
      />

      <Modal isOpen={isEditOpen} onOpenChange={setIsEditOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{language === 'th' ? 'แก้ไขกิจกรรม' : 'Edit Activity'}</ModalHeader>
              <ModalBody>
                <p>{language === 'th' ? 'ชื่อกิจกรรม:' : 'Activity Name:'} <strong>{editItem?.name}</strong></p>
                <p>{language === 'th' ? 'รหัสกิจกรรม:' : 'Code:'} {editItem?.code}</p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
                <Button color="primary" onPress={onClose}>{language === 'th' ? 'บันทึก' : 'Save'}</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
