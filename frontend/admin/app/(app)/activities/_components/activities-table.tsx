import React, { useState } from "react";
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
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Card,
  CardBody,
  Divider,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import { ChevronDown, ChevronUp, Pencil, Trash2, MoreVertical, Calendar, CheckCircle, EyeOff, Eye } from "lucide-react";
import { Activities } from "@/types/activities";

const columns = [
  { name: "CODE", uid: "acronym" },
  { name: "NAME", uid: "name" },
  { name: "OPEN", uid: "isOpen" },
  { name: "PROGRESS COUNTING", uid: "isProgressCount" },
  { name: "VISIBILITY", uid: "isVisible" },
  { name: "ACTIONS", uid: "actions" },
];

export default function ActivitiesTable({ 
  activities,
  onEdit,
  onDelete 
}: { 
  activities: Activities[];
  onEdit: (activity: Activities) => void;
  onDelete: (activity: Activities) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set([]));

  const handleToggleExpand = (id: string) => {
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(id)) {
      newExpandedKeys.delete(id);
    } else {
      newExpandedKeys.add(id);
    }
    setExpandedKeys(newExpandedKeys);
  };

  const renderCell = React.useCallback((activity: Activities, columnKey: React.Key) => {
    switch (columnKey) {
      case "acronym":
        return (
          <div className="flex items-center">
            <span className="font-medium text-sm uppercase">{activity.acronym}</span>
          </div>
        );
      case "name":
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{activity.name?.en}</span>
            <span className="text-xs text-default-500">{activity.name?.th}</span>
          </div>
        );
      case "isVisible":
        return (
          <Button 
            size="sm" 
            color={activity.metadata?.isVisible ? "default" : "default"}
            variant="flat"
            className="w-full justify-center"
            startContent={activity.metadata?.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          >
            {activity.metadata?.isVisible ? "SHOW" : "HIDE"}
          </Button>
        );
      case "isProgressCount":
        return (
          <Button 
            size="sm" 
            color={activity.metadata?.isProgressCount ? "success" : "default"}
            variant="flat"
            className="w-full justify-center"
            startContent={activity.metadata?.isProgressCount ? <CheckCircle size={14} /> : null}
          >
            {activity.metadata?.isProgressCount ? "PROGRESS" : "NO PROGRESS"}
          </Button>
        );
      case "isOpen":
        return (
          <Button 
            size="sm" 
            color={activity.metadata?.isOpen ? "success" : "danger"}
            variant="flat"
            className="w-full justify-center"
          >
            {activity.metadata?.isOpen ? "OPEN" : "CLOSED"}
          </Button>
        );
      case "actions":
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={() => handleToggleExpand(activity._id)}
              className={expandedKeys.has(activity._id) ? "text-primary" : "text-default-400"}
            >
              {expandedKeys.has(activity._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                >
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
  }, [expandedKeys]);

  return (
    <div className="w-full">
      <Table 
        aria-label="Activities table"
        removeWrapper
        className="rounded-md overflow-hidden border border-default-200"
        classNames={{
          th: "bg-default-100 text-default-800 font-medium text-xs py-3",
          td: "py-3",
        }}
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn 
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
            >
              {column.name}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody emptyContent={"No activities found"}>
          {activities.map((activity) => (
            <TableRow 
              key={activity._id}
              className="hover:bg-default-50 transition-colors"
            >
              {(columnKey) => <TableCell>{renderCell(activity, columnKey)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Activity Details Accordion */}
      <div className="mt-2">
        <Accordion className="px-0">
          {activities.filter(activity => expandedKeys.has(activity._id)).map((activity) => (
            <AccordionItem
              key={activity._id}
              aria-label={`Details for ${activity.name?.en}`}
              title={null}
              subtitle={null}
              startContent={null}
              isCompact
              hideIndicator
              disableAnimation={true}
              classNames={{
                base: "border-0 mb-0",
                title: "hidden",
                content: "pt-0 px-0"
              }}
            >
              <div className="bg-default-50 px-6 py-4 rounded-b-lg border border-default-200 border-t-0">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Activity Banner Image */}
                  <div className="w-full md:w-1/3">
                    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
                      <img 
                        src={activity.photo?.bannerPhoto 
                          ? `http://localhost:8080/uploads/${activity.photo.bannerPhoto}`
                          : "/placeholder.png"
                        } 
                        alt={activity.name?.en} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Activity Information */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{activity.name?.en}</h3>
                      <p className="text-sm text-default-500">{activity.name?.th}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {activity.shortDetails?.en || "No description available."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-default-500 mb-1">Location</p>
                        <p className="text-sm">{activity.location?.en || "No location specified"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500 mb-1">Type</p>
                        <p className="text-sm">{activity.type || "No type specified"}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="flat" 
                        color="primary"
                        onPress={() => onEdit(activity)}
                        startContent={<Pencil size={16} />}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="flat" 
                        color="danger"
                        onPress={() => onDelete(activity)}
                        startContent={<Trash2 size={16} />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}