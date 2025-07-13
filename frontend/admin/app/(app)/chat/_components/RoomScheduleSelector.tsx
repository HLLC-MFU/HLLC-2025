"use client";

import { Button, Card, CardBody, Input, Switch, Select, SelectItem, Divider } from "@heroui/react";
import { CalendarClock, Clock, RotateCcw, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { RoomSchedule, ScheduleType } from "@/types/chat";

type RoomScheduleSelectorProps = {
    schedule?: RoomSchedule | null;
    onChange: (schedule: RoomSchedule | null) => void;
    disabled?: boolean;
};

export function RoomScheduleSelector({ schedule, onChange, disabled = false }: RoomScheduleSelectorProps) {
    const [enabled, setEnabled] = useState(schedule?.enabled || false);
    const [scheduleType, setScheduleType] = useState<ScheduleType>(schedule?.type || ScheduleType.ONE_TIME);
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");

    useEffect(() => {
        if (schedule) {
            setEnabled(schedule.enabled);
            setScheduleType(schedule.type);
            
            if (schedule.startAt) {
                const startDateTime = new Date(schedule.startAt);
                setStartDate(startDateTime.toISOString().split('T')[0]);
                setStartTime(startDateTime.toTimeString().slice(0, 5));
            }
            
            if (schedule.endAt) {
                const endDateTime = new Date(schedule.endAt);
                setEndDate(endDateTime.toISOString().split('T')[0]);
                setEndTime(endDateTime.toTimeString().slice(0, 5));
            }
        }
    }, [schedule]);

    const updateSchedule = (
        isEnabled: boolean,
        type: ScheduleType,
        sDate: string,
        sTime: string,
        eDate: string,
        eTime: string
    ) => {
        if (!isEnabled) {
            onChange(null);
            return;
        }

        let startAt: string | undefined;
        let endAt: string | undefined;

        if (type === ScheduleType.ONE_TIME) {
            if (sDate && sTime) {
                startAt = new Date(`${sDate}T${sTime}`).toISOString();
            }
            if (eDate && eTime) {
                endAt = new Date(`${eDate}T${eTime}`).toISOString();
            }
        } else {
            if (sTime) {
                startAt = new Date(`1970-01-01T${sTime}`).toISOString();
            }
            if (eTime) {
                endAt = new Date(`1970-01-01T${eTime}`).toISOString();
            }
        }

        onChange({
            type,
            startAt,
            endAt,
            enabled: isEnabled
        });
    };

    const handleToggleEnabled = (value: boolean) => {
        setEnabled(value);
        updateSchedule(value, scheduleType, startDate, startTime, endDate, endTime);
    };

    const handleTypeChange = (type: ScheduleType) => {
        setScheduleType(type);
        updateSchedule(enabled, type, startDate, startTime, endDate, endTime);
    };

    const handleDateTimeChange = (field: 'startDate' | 'startTime' | 'endDate' | 'endTime', value: string) => {
        const updates = { startDate, startTime, endDate, endTime, [field]: value };
        
        if (field === 'startDate') setStartDate(value);
        if (field === 'startTime') setStartTime(value);
        if (field === 'endDate') setEndDate(value);
        if (field === 'endTime') setEndTime(value);
        
        updateSchedule(enabled, scheduleType, updates.startDate, updates.startTime, updates.endDate, updates.endTime);
    };

    const handleQuickSet = (hours: number) => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now.getTime() + (hours * 60 * 60 * 1000));

        if (scheduleType === ScheduleType.ONE_TIME) {
            setStartDate(start.toISOString().split('T')[0]);
            setStartTime(start.toTimeString().slice(0, 5));
            setEndDate(end.toISOString().split('T')[0]);
            setEndTime(end.toTimeString().slice(0, 5));
            updateSchedule(enabled, scheduleType, 
                start.toISOString().split('T')[0], 
                start.toTimeString().slice(0, 5),
                end.toISOString().split('T')[0], 
                end.toTimeString().slice(0, 5)
            );
        }
    };

    return (
        <Card>
            <CardBody className="p-4">
                <div className="flex items-center gap-3 mb-4">
                    <CalendarClock className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Room Schedule</h3>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm font-medium">Enable Scheduling</p>
                        <p className="text-xs text-gray-500">Control when users can access this room</p>
                    </div>
                    <Switch
                        isSelected={enabled}
                        onValueChange={handleToggleEnabled}
                        isDisabled={disabled}
                    />
                </div>

                {enabled && (
                    <>
                        <Divider className="my-4" />
                        
                        <div className="space-y-4">
                            <Select
                                label="Schedule Type"
                                selectedKeys={[scheduleType]}
                                onSelectionChange={(keys) => handleTypeChange(Array.from(keys)[0] as ScheduleType)}
                                isDisabled={disabled}
                            >
                                <SelectItem key={ScheduleType.ONE_TIME} startContent={<Calendar className="w-4 h-4" />}>
                                    One-time Event
                                </SelectItem>
                                <SelectItem key={ScheduleType.LOOP} startContent={<RotateCcw className="w-4 h-4" />}>
                                    Daily Repeat
                                </SelectItem>
                            </Select>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-3">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Start Time
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {scheduleType === ScheduleType.ONE_TIME && (
                                            <Input
                                                type="date"
                                                label="Start Date"
                                                value={startDate}
                                                onValueChange={(value) => handleDateTimeChange('startDate', value)}
                                                isDisabled={disabled}
                                                size="sm"
                                            />
                                        )}
                                        <Input
                                            type="time"
                                            label="Start Time"
                                            value={startTime}
                                            onValueChange={(value) => handleDateTimeChange('startTime', value)}
                                            isDisabled={disabled}
                                            size="sm"
                                            className={scheduleType === ScheduleType.LOOP ? "col-span-2" : ""}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        End Time
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {scheduleType === ScheduleType.ONE_TIME && (
                                            <Input
                                                type="date"
                                                label="End Date"
                                                value={endDate}
                                                onValueChange={(value) => handleDateTimeChange('endDate', value)}
                                                isDisabled={disabled}
                                                size="sm"
                                            />
                                        )}
                                        <Input
                                            type="time"
                                            label="End Time"
                                            value={endTime}
                                            onValueChange={(value) => handleDateTimeChange('endTime', value)}
                                            isDisabled={disabled}
                                            size="sm"
                                            className={scheduleType === ScheduleType.LOOP ? "col-span-2" : ""}
                                        />
                                    </div>
                                </div>
                            </div>

                            {scheduleType === ScheduleType.ONE_TIME && (
                                <>
                                    <Divider className="my-3" />
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Quick Set</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {[1, 2, 4, 8, 24].map((hours) => (
                                                <Button
                                                    key={hours}
                                                    size="sm"
                                                    variant="flat"
                                                    onPress={() => handleQuickSet(hours)}
                                                    isDisabled={disabled}
                                                >
                                                    {hours}h from now
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
} 