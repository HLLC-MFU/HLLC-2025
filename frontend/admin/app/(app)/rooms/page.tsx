"use client";

import { title } from "@/components/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/card";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/dropdown";
import { Input } from "@nextui-org/input";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@nextui-org/modal";
import { useCallback, useEffect, useState } from "react";
import { FiMoreVertical, FiPlus } from "react-icons/fi";
import { Room, roomService } from "./services/roomService";
import { toast } from "@heroui/react";

export default function RoomPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState({
    thName: "",
    enName: "",
    capacity: 0,
  });

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await roomService.getRooms();
      setRooms(response.rooms);
    } catch (error) {
      toast.error("Failed to fetch rooms");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setSelectedRoom(room);
      setFormData({
        thName: room.name.thName,
        enName: room.name.enName,
        capacity: room.capacity,
      });
    } else {
      setSelectedRoom(null);
      setFormData({
        thName: "",
        enName: "",
        capacity: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedRoom) {
        // Update
        const updated = await roomService.updateRoom(selectedRoom.id, {
          name: {
            thName: formData.thName,
            enName: formData.enName,
          },
          capacity: formData.capacity,
        });
        if (updated) {
          toast.success("Room updated successfully");
          fetchRooms();
        }
      } else {
        // Create
        const created = await roomService.createRoom({
          name: {
            thName: formData.thName,
            enName: formData.enName,
          },
          capacity: formData.capacity,
        });
        if (created) {
          toast.success("Room created successfully");
          fetchRooms();
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error(selectedRoom ? "Failed to update room" : "Failed to create room");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this room?")) {
      try {
        const success = await roomService.deleteRoom(id);
        if (success) {
          toast.success("Room deleted successfully");
          fetchRooms();
        } else {
          toast.error("Failed to delete room");
        }
      } catch (error) {
        toast.error("Failed to delete room");
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className={title()}>Room Management</h1>
        <Button variant="default" onClick={() => handleOpenModal()}>
          <FiPlus className="mr-2" /> Add New Room
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="w-full">
            <CardHeader className="flex justify-between">
              <h3 className="text-xl font-semibold">{room.name.enName}</h3>
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="ghost" size="sm">
                    <FiMoreVertical />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Room actions">
                  <DropdownItem key="edit" onClick={() => handleOpenModal(room)}>
                    Edit
                  </DropdownItem>
                  <DropdownItem
                    key="delete"
                    className="text-danger"
                    onClick={() => handleDelete(room.id)}
                  >
                    Delete
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-default-500">Thai Name</p>
                  <p className="text-lg">{room.name.thName}</p>
                </div>
                <div>
                  <p className="text-sm text-default-500">English Name</p>
                  <p className="text-lg">{room.name.enName}</p>
                </div>
              </div>
            </CardBody>
            <CardFooter className="flex justify-between text-small text-default-500">
              <div>Capacity: {room.capacity}</div>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalContent>
          <ModalHeader>
            {selectedRoom ? "Edit Room" : "Create New Room"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Thai Name"
                value={formData.thName}
                onChange={(e) =>
                  setFormData({ ...formData, thName: e.target.value })
                }
              />
              <Input
                label="English Name"
                value={formData.enName}
                onChange={(e) =>
                  setFormData({ ...formData, enName: e.target.value })
                }
              />
              <Input
                type="number"
                label="Capacity"
                value={formData.capacity.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedRoom ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
