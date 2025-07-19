'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Textarea, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, Divider } from "@heroui/react";
import { Ban, MicOff, AlertTriangle, CheckCircle, XCircle, Clock, UserX } from "lucide-react";
import { RoomMember } from '@/types/chat';
import { useRestriction } from '@/hooks/useRestriction';

interface RestrictionAction {
  userId: string;
  roomId: string;
  action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick';
  duration: 'temporary' | 'permanent';
  timeValue: number;
  timeUnit: 'minutes' | 'hours';
  restriction: 'can_view' | 'cannot_view';
  reason: string;
}

interface RestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: RoomMember;
  action: 'ban' | 'mute' | 'unban' | 'unmute' | 'kick';
  roomId: string;
  onSuccess: () => void;
}

// Ban Dialog Component
export function BanDialog({ isOpen, onClose, member, roomId, onSuccess }: RestrictionDialogProps) {
  const { banUser, loading, error } = useRestriction();
  const [restrictionData, setRestrictionData] = useState<RestrictionAction>({
    userId: member?.user._id || '',
    roomId: roomId,
    action: 'ban',
    duration: 'temporary',
    timeValue: 15,
    timeUnit: 'minutes',
    restriction: 'can_view',
    reason: ''
  });

  const handleSubmit = async () => {
    if (!restrictionData.userId || !restrictionData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await banUser({
      userId: restrictionData.userId,
      roomId: restrictionData.roomId,
      duration: restrictionData.duration,
      timeValue: restrictionData.timeValue,
      timeUnit: restrictionData.timeUnit,
      reason: restrictionData.reason,
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error || 'Failed to ban user');
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${user.name.first || ''} ${user.name.last || ''}`.trim();
      }
    }
    return user.username || 'user';
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100">
              <Ban size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ban User</h3>
              <p className="text-sm text-default-500">Ban user from this room</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* User Info Section */}
          <div className="p-4 bg-default-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {getDisplayName(member.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{member.user.username}</h4>
                <p className="text-sm text-default-500">{getDisplayName(member.user)}</p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Ban Duration</h4>
            <Dropdown>
              <DropdownTrigger>
                <Button className="w-full justify-start" variant="bordered" size="sm">
                  {restrictionData.duration === 'permanent' ? 'Permanent' : 'Temporary'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[restrictionData.duration]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setRestrictionData({ ...restrictionData, duration: selected as 'temporary' | 'permanent' });
                }}
              >
                <DropdownItem key="temporary">Temporary</DropdownItem>
                <DropdownItem key="permanent">Permanent</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Time Settings for Temporary Ban */}
          {restrictionData.duration === 'temporary' && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Duration Value</h4>
                  <Input
                    type="number"
                    min="1"
                    value={restrictionData.timeValue.toString()}
                    onChange={(e) => setRestrictionData({ ...restrictionData, timeValue: parseInt(e.target.value) || 1 })}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Time Unit</h4>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button className="w-full justify-start" variant="bordered" size="sm">
                        {restrictionData.timeUnit === 'hours' ? 'Hours' : 'Minutes'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      selectedKeys={[restrictionData.timeUnit]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setRestrictionData({ ...restrictionData, timeUnit: selected as 'minutes' | 'hours' });
                      }}
                    >
                      <DropdownItem key="minutes">Minutes</DropdownItem>
                      <DropdownItem key="hours">Hours</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </div>
          )}

          <Divider />

          {/* Reason Input */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Reason</h4>
            <Textarea
              isRequired
              placeholder="Enter reason for banning this user..."
              value={restrictionData.reason}
              onChange={(e) => setRestrictionData({ ...restrictionData, reason: e.target.value })}
              minRows={3}
              maxRows={5}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="danger"
            isDisabled={!restrictionData.userId || !restrictionData.reason || loading}
            isLoading={loading}
            startContent={<Ban size={16} />}
            onPress={handleSubmit}
          >
            Ban User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Mute Dialog Component
export function MuteDialog({ isOpen, onClose, member, roomId, onSuccess }: RestrictionDialogProps) {
  const { muteUser, loading, error } = useRestriction();
  const [restrictionData, setRestrictionData] = useState<RestrictionAction>({
    userId: member?.user._id || '',
    roomId: roomId,
    action: 'mute',
    duration: 'temporary',
    timeValue: 15,
    timeUnit: 'minutes',
    restriction: 'can_view',
    reason: ''
  });

  const handleSubmit = async () => {
    if (!restrictionData.userId || !restrictionData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await muteUser({
      userId: restrictionData.userId,
      roomId: restrictionData.roomId,
      duration: restrictionData.duration,
      timeValue: restrictionData.timeValue,
      timeUnit: restrictionData.timeUnit,
      restriction: restrictionData.restriction,
      reason: restrictionData.reason,
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error || 'Failed to mute user');
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${user.name.first || ''} ${user.name.last || ''}`.trim();
      }
    }
    return user.username || 'user';
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-yellow-100">
              <MicOff size={20} className="text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Mute User</h3>
              <p className="text-sm text-default-500">Mute user in this room</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* User Info Section */}
          <div className="p-4 bg-default-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {getDisplayName(member.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{member.user.username}</h4>
                <p className="text-sm text-default-500">{getDisplayName(member.user)}</p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Mute Duration</h4>
            <Dropdown>
              <DropdownTrigger>
                <Button className="w-full justify-start" variant="bordered" size="sm">
                  {restrictionData.duration === 'permanent' ? 'Permanent' : 'Temporary'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[restrictionData.duration]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setRestrictionData({ ...restrictionData, duration: selected as 'temporary' | 'permanent' });
                }}
              >
                <DropdownItem key="temporary">Temporary</DropdownItem>
                <DropdownItem key="permanent">Permanent</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          {/* Time Settings for Temporary Mute */}
          {restrictionData.duration === 'temporary' && (
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Duration Value</h4>
                  <Input
                    type="number"
                    min="1"
                    value={restrictionData.timeValue.toString()}
                    onChange={(e) => setRestrictionData({ ...restrictionData, timeValue: parseInt(e.target.value) || 1 })}
                    size="sm"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Time Unit</h4>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button className="w-full justify-start" variant="bordered" size="sm">
                        {restrictionData.timeUnit === 'hours' ? 'Hours' : 'Minutes'}
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                      selectedKeys={[restrictionData.timeUnit]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setRestrictionData({ ...restrictionData, timeUnit: selected as 'minutes' | 'hours' });
                      }}
                    >
                      <DropdownItem key="minutes">Minutes</DropdownItem>
                      <DropdownItem key="hours">Hours</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </div>
          )}

          {/* Message Visibility */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Message Visibility</h4>
            <Dropdown>
              <DropdownTrigger>
                <Button className="w-full justify-start" variant="bordered" size="sm">
                  {restrictionData.restriction === 'can_view' ? 'Can View Messages' : 'Cannot View Messages'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                selectedKeys={[restrictionData.restriction]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setRestrictionData({ ...restrictionData, restriction: selected as 'can_view' | 'cannot_view' });
                }}
              >
                <DropdownItem key="can_view">Can View Messages</DropdownItem>
                <DropdownItem key="cannot_view">Cannot View Messages</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>

          <Divider />

          {/* Reason Input */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Reason</h4>
            <Textarea
              isRequired
              placeholder="Enter reason for muting this user..."
              value={restrictionData.reason}
              onChange={(e) => setRestrictionData({ ...restrictionData, reason: e.target.value })}
              minRows={3}
              maxRows={5}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="warning"
            isDisabled={!restrictionData.userId || !restrictionData.reason || loading}
            isLoading={loading}
            startContent={<MicOff size={16} />}
            onPress={handleSubmit}
          >
            Mute User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Kick Dialog Component
export function KickDialog({ isOpen, onClose, member, roomId, onSuccess }: RestrictionDialogProps) {
  const { kickUser, loading, error } = useRestriction();
  const [restrictionData, setRestrictionData] = useState<RestrictionAction>({
    userId: member?.user._id || '',
    roomId: roomId,
    action: 'kick',
    duration: 'temporary',
    timeValue: 15,
    timeUnit: 'minutes',
    restriction: 'can_view',
    reason: ''
  });

  const handleSubmit = async () => {
    if (!restrictionData.userId || !restrictionData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    const result = await kickUser({
      userId: restrictionData.userId,
      roomId: restrictionData.roomId,
      reason: restrictionData.reason,
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error || 'Failed to kick user');
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${user.name.first || ''} ${user.name.last || ''}`.trim();
      }
    }
    return user.username || 'user';
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-orange-100">
              <UserX size={20} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Kick User</h3>
              <p className="text-sm text-default-500">Remove user from this room</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* User Info Section */}
          <div className="p-4 bg-default-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {getDisplayName(member.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{member.user.username}</h4>
                <p className="text-sm text-default-500">{getDisplayName(member.user)}</p>
              </div>
            </div>
          </div>

          <div className="text-center py-6">
            <div className="p-3 rounded-full bg-warning/10 w-fit mx-auto mb-4">
              <UserX size={24} className="text-warning" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Kick User from Room</h4>
            <p className="text-sm text-default-600 mb-6">
              This will immediately remove the user from the room. They can rejoin if they have permission.
            </p>
          </div>

          <Divider />

          {/* Reason Input */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Reason</h4>
            <Textarea
              isRequired
              placeholder="Enter reason for kicking this user..."
              value={restrictionData.reason}
              onChange={(e) => setRestrictionData({ ...restrictionData, reason: e.target.value })}
              minRows={3}
              maxRows={5}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="secondary"
            isDisabled={!restrictionData.userId || !restrictionData.reason || loading}
            isLoading={loading}
            startContent={<UserX size={16} />}
            onPress={handleSubmit}
          >
            Kick User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Unban Dialog Component
export function UnbanDialog({ isOpen, onClose, member, roomId, onSuccess }: RestrictionDialogProps) {
  const { unbanUser, loading, error } = useRestriction();

  const handleSubmit = async () => {
    const result = await unbanUser({
      userId: member.user._id,
      roomId: roomId
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error || 'Failed to unban user');
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${user.name.first || ''} ${user.name.last || ''}`.trim();
      }
    }
    return user.username || 'user';
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unban User</h3>
              <p className="text-sm text-default-500">Remove ban restrictions for this user</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* User Info Section */}
          <div className="p-4 bg-default-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {getDisplayName(member.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{member.user.username}</h4>
                <p className="text-sm text-default-500">{getDisplayName(member.user)}</p>
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-4">
              <CheckCircle size={24} className="text-success" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Unban User</h4>
            <p className="text-sm text-default-600">
              This will remove all current ban restrictions for this user in this room.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="success"
            isLoading={loading}
            startContent={<CheckCircle size={16} />}
            onPress={handleSubmit}
          >
            Unban User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Unmute Dialog Component
export function UnmuteDialog({ isOpen, onClose, member, roomId, onSuccess }: RestrictionDialogProps) {
  const { unmuteUser, loading, error } = useRestriction();

  const handleSubmit = async () => {
    const result = await unmuteUser({
      userId: member.user._id,
      roomId: roomId
    });

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      alert(result.error || 'Failed to unmute user');
    }
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'user';
    if (user.name) {
      if (typeof user.name === 'string') return user.name;
      if (user.name.first || user.name.last) {
        return `${user.name.first || ''} ${user.name.last || ''}`.trim();
      }
    }
    return user.username || 'user';
  };

  return (
    <Modal isOpen={isOpen} size="2xl" onClose={onClose} scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100">
              <XCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Unmute User</h3>
              <p className="text-sm text-default-500">Remove mute restrictions for this user</p>
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* User Info Section */}
          <div className="p-4 bg-default-50 rounded-lg mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                {getDisplayName(member.user).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-base">{member.user.username}</h4>
                <p className="text-sm text-default-500">{getDisplayName(member.user)}</p>
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <div className="p-3 rounded-full bg-success/10 w-fit mx-auto mb-4">
              <XCircle size={24} className="text-success" />
            </div>
            <h4 className="text-lg font-semibold mb-2">Unmute User</h4>
            <p className="text-sm text-default-600">
              This will remove all current mute restrictions for this user in this room.
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button 
            color="success"
            isLoading={loading}
            startContent={<XCircle size={16} />}
            onPress={handleSubmit}
          >
            Unmute User
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 