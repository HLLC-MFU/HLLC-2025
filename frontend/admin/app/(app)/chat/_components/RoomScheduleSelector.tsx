"use client";

import { Card, CardBody, CardHeader, Button, DatePicker, Divider } from "@heroui/react";
import { Calendar, Clock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { fromDate } from '@internationalized/date';

import { RoomSchedule } from "@/types/room";

type RoomScheduleSelectorProps = {
    schedule?: RoomSchedule | null;
    onChange: (schedule: RoomSchedule | null) => void;
    disabled?: boolean;
};

export function RoomScheduleSelector({ schedule, onChange, disabled = false }: RoomScheduleSelectorProps) {
    const [startAt, setStartAt] = useState<Date | null>(null);
    const [endAt, setEndAt] = useState<Date | null>(null);

    useEffect(() => {
        if (schedule?.startAt) {
            setStartAt(new Date(schedule.startAt));
        } else {
            setStartAt(null);
        }

        if (schedule?.endAt) {
            setEndAt(new Date(schedule.endAt));
        } else {
            setEndAt(null);
        }
    }, [schedule]);

    const updateSchedule = (newStartAt: Date | null, newEndAt: Date | null) => {
        if (!newStartAt && !newEndAt) {
            onChange(null);
            return;
        }

        const newSchedule: RoomSchedule = {};
        if (newStartAt) {
            newSchedule.startAt = newStartAt.toISOString();
        }
        if (newEndAt) {
            newSchedule.endAt = newEndAt.toISOString();
        }

        onChange(newSchedule);
    };

    const handleStartAtChange = (value: any) => {
        const newStartAt = value?.toDate() ?? null;
        setStartAt(newStartAt);
        updateSchedule(newStartAt, endAt);
    };

    const handleEndAtChange = (value: any) => {
        const newEndAt = value?.toDate() ?? null;
        setEndAt(newEndAt);
        updateSchedule(startAt, newEndAt);
    };

    const handleQuickSet = (hours: number) => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now.getTime() + hours * 60 * 60 * 1000);

        setStartAt(start);
        setEndAt(end);
        updateSchedule(start, end);
    };

    const handleClear = () => {
        setStartAt(null);
        setEndAt(null);
        onChange(null);
    };

    const dateOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    } as const;
    const timeOptions = {
        hour: "2-digit",
        minute: "2-digit"
    } as const;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={20} />
                    <h3 className="text-lg font-semibold">Schedule (Optional)</h3>
                </div>
                {(startAt || endAt) && (
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={handleClear}
                        disabled={disabled}
                    >
                        <X size={16} />
                    </Button>
                )}
            </CardHeader>
            <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker
                        label="Start Date & Time"
                        value={startAt ? fromDate(startAt, 'Asia/Bangkok') as any : null}
                        onChange={handleStartAtChange}
                        isDisabled={disabled}
                        granularity="minute"
                    />
                    <DatePicker
                        label="End Date & Time"
                        value={endAt ? fromDate(endAt, 'Asia/Bangkok') as any : null}
                        onChange={handleEndAtChange}
                        isDisabled={disabled}
                        granularity="minute"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(1)}
                        disabled={disabled}
                    >
                        1 Hour
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(2)}
                        disabled={disabled}
                    >
                        2 Hours
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(4)}
                        disabled={disabled}
                    >
                        4 Hours
                    </Button>
                </div>

                {(startAt || endAt) && (
                    <>
                        <Divider />
                        <div className="p-3 bg-default-50 rounded-lg">
                            <p className="text-sm font-medium text-default-900 mb-2">Schedule Preview:</p>
                            <div className="space-y-2">
                                {startAt && (
                                    <div>
                                        <p className="text-sm font-medium text-success-600">Start:</p>
                                        <p className="text-sm text-default-600">{new Date(startAt).toLocaleDateString('en-US', dateOptions)}</p>
                                        <p className="text-sm text-default-600">{new Date(startAt).toLocaleTimeString('en-US', timeOptions)}</p>
                                    </div>
                                )}
                                {endAt && (
                                    <div>
                                        <p className="text-sm font-medium text-danger-600">End:</p>
                                        <p className="text-sm text-default-600">{new Date(endAt).toLocaleDateString('en-US', dateOptions)}</p>
                                        <p className="text-sm text-default-600">{new Date(endAt).toLocaleTimeString('en-US', timeOptions)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </CardBody>
        </Card>
    );
} 