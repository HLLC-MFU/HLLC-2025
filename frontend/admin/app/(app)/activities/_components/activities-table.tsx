import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Divider,
  Accordion,
  AccordionItem,
  Card,
} from '@heroui/react';
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  MoreVertical,
  CheckCircle,
  EyeOff,
  Eye,
  Users,
  School,
  GraduationCap,
  MapPin,
  FileText,
  AlignLeft,
} from 'lucide-react';
import { Activities } from '@/types/activities';
import { motion, AnimatePresence } from 'framer-motion';

const columns = [
  { name: 'CODE', uid: 'acronym' },
  { name: 'NAME', uid: 'name' },
  { name: 'OPEN', uid: 'isOpen' },
  { name: 'PROGRESS COUNTING', uid: 'isProgressCount' },
  { name: 'VISIBILITY', uid: 'isVisible' },
  { name: 'ACTIONS', uid: 'actions' },
];

export default function ActivitiesTable({
  activities,
  onEdit,
  onDelete,
}: {
  activities: Activities[];
  onEdit: (activity: Activities) => void;
  onDelete: (activity: Activities) => void;
}) {
  const [expandedKeys, setExpandedKeys] = React.useState<Set<string>>(new Set([]));

  const handleToggleExpand = (id: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(id)) {
      newExpandedKeys.delete(id);
    } else {
      newExpandedKeys.add(id);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const renderCell = React.useCallback(
    (activity: Activities, columnKey: React.Key) => {
      switch (columnKey) {
        case 'acronym':
          return (
            <div className="flex items-center">
              <span className="font-medium text-sm uppercase">
                {activity.acronym}
              </span>
            </div>
          );
        case 'name':
          return (
            <div className="flex flex-col">
              <span className="font-medium text-sm">{activity.name?.en}</span>
              <span className="text-xs text-default-500">
                {activity.name?.th}
              </span>
            </div>
          );
        case 'isVisible':
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                color={activity.metadata?.isVisible ? 'default' : 'default'}
                variant="flat"
                className="justify-center min-w-20"
                startContent={
                  activity.metadata?.isVisible ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} />
                  )
                }
              >
                {activity.metadata?.isVisible ? 'SHOW' : 'HIDE'}
              </Button>
            </div>
          );
        case 'isProgressCount':
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                color={
                  activity.metadata?.isProgressCount ? 'success' : 'default'
                }
                variant="flat"
                className="justify-center min-w-28"
                startContent={
                  activity.metadata?.isProgressCount ? (
                    <CheckCircle size={14} />
                  ) : null
                }
              >
                {activity.metadata?.isProgressCount
                  ? 'PROGRESS'
                  : 'NO PROGRESS'}
              </Button>
            </div>
          );
        case 'isOpen':
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                color={activity.metadata?.isOpen ? 'success' : 'danger'}
                variant="flat"
                className="justify-center min-w-20"
              >
                {activity.metadata?.isOpen ? 'OPEN' : 'CLOSED'}
              </Button>
            </div>
          );
        case 'actions':
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => handleToggleExpand(activity._id)}
                className={
                  expandedKeys.has(activity._id)
                    ? 'text-primary'
                    : 'text-default-400'
                }
              >
                {expandedKeys.has(activity._id) ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </Button>
              <Dropdown>
                <DropdownTrigger>
                  <Button isIconOnly size="sm" variant="light">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Activity Actions">
                  <DropdownItem
                    key="edit"
                    startContent={<Pencil size={16} />}
                    onPress={() => onEdit(activity)}
                  >
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    color="danger"
                    startContent={<Trash2 size={16} />}
                    onPress={() => onDelete(activity)}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          );
        default:
          return null;
      }
    },
    [expandedKeys],
  );

  return (
    <div className="w-full space-y-4">
      <Table
        aria-label="Activities table"
        removeWrapper
        className="rounded-md overflow-hidden border border-default-200"
        classNames={{
          th: 'bg-default-100 text-default-800 font-medium text-xs py-3',
          td: 'py-3',
        }}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn
              key={column.uid}
              align={
                ['actions', 'isOpen', 'isProgressCount', 'isVisible'].includes(
                  column.uid,
                )
                  ? 'center'
                  : 'start'
              }
            >
              {column.name}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={'No activities found'}>
          {activities.map((activity) => (
            <TableRow
              key={activity._id}
              className="hover:bg-default-50 transition-colors"
            >
              {(columnKey) => (
                <TableCell>{renderCell(activity, columnKey)}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AnimatePresence>
        {activities
          .filter((activity) => expandedKeys.has(activity._id))
          .map((activity) => (
            <motion.div
              key={`details-${activity._id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-br from-default-50 to-default-100 border border-default-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 space-y-6">
                  {/* Photos Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Banner Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-default-700">
                        Banner Photo
                      </h4>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-default-200 group">
                        <img
                          src={
                            activity.photo?.bannerPhoto
                              ? `http://localhost:8080/uploads/${activity.photo.bannerPhoto}`
                              : '/placeholder.png'
                          }
                          alt="Banner"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    </div>

                    {/* Logo Photo */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-default-700">
                        Logo Photo
                      </h4>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-default-200 bg-white flex items-center justify-center group">
                        <img
                          src={
                            activity.photo?.logoPhoto
                              ? `http://localhost:8080/uploads/${activity.photo.logoPhoto}`
                              : '/placeholder.png'
                          }
                          alt="Logo"
                          className="max-w-[200px] max-h-[200px] object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>

                  <Divider />

                  {/* Details Sections */}
                  <div className="space-y-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h4 className="text-sm font-semibold text-default-700">
                        Details
                      </h4>
                    </div>

                    {/* Grid Layout: 2 columns */}
                    {/* Details Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Location */}
                      <div className="rounded-xl border border-default-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium text-default-700">
                            Location
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              English
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200">
                              {activity.location?.en || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Thai
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200">
                              {activity.location?.th || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Full Details */}
                      <div className="rounded-xl border border-default-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium text-default-700">
                            Full Details
                          </h5>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              English
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                              {activity.fullDetails?.en || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Thai
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                              {activity.fullDetails?.th || '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Short Details (wide) */}
                      <div className="md:col-span-2 rounded-xl border border-default-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <AlignLeft className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium text-default-700">
                            Short Details
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              English
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                              {activity.shortDetails?.en || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">
                              Thai
                            </p>
                            <p className="rounded-lg bg-default-50 px-3 py-2 border border-default-200 whitespace-pre-wrap">
                              {activity.shortDetails?.th || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Divider />

                  {/* Scope Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-default-700">
                      Activity Scope
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Schools */}
                      <div className="bg-white p-4 rounded-xl border border-default-200">
                        <div className="flex items-center gap-2 mb-3">
                          <School className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium">Schools</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activity.metadata?.scope?.school?.length ? (
                            activity.metadata.scope.school.map(
                              (school, index) => (
                                <Chip key={index} size="sm" variant="flat">
                                  {school}
                                </Chip>
                              ),
                            )
                          ) : (
                            <p className="text-xs text-default-500">
                              No schools specified
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Majors */}
                      <div className="bg-white p-4 rounded-xl border border-default-200">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium">Majors</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activity.metadata?.scope?.major?.length ? (
                            activity.metadata.scope.major.map(
                              (major, index) => (
                                <Chip key={index} size="sm" variant="flat">
                                  {major}
                                </Chip>
                              ),
                            )
                          ) : (
                            <p className="text-xs text-default-500">
                              No majors specified
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Users */}
                      <div className="bg-white p-4 rounded-xl border border-default-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-primary" />
                          <h5 className="text-sm font-medium">Users</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {activity.metadata?.scope?.user?.length ? (
                            <Chip size="sm" variant="flat" color="primary">
                              {activity.metadata.scope.user.length} users
                            </Chip>
                          ) : (
                            <p className="text-xs text-default-500">
                              No users specified
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
