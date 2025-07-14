"use client";

import { Card, CardBody, CardHeader, Button, DatePicker } from "@heroui/react";
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

    const formatDateTime = (date: Date) => {
        return {
            date: date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
            })
        };
    };

    return (
        <Card className="border border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-600" />
                    <h3 className="text-base font-medium text-slate-800">Schedule (Optional)</h3>
                </div>
                {(startAt || endAt) && (
                    <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={handleClear}
                        disabled={disabled}
                        className="text-slate-500 hover:text-slate-700"
                    >
                        <X size={16} />
                    </Button>
                )}
            </CardHeader>
            <CardBody className="space-y-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker
                        label="Start Date & Time"
                        value={startAt ? fromDate(startAt, 'Asia/Bangkok') as any : null}
                        onChange={handleStartAtChange}
                        isDisabled={disabled}
                        granularity="minute"
                        classNames={{
                            label: "text-slate-600",
                            inputWrapper: "border-slate-200 hover:border-slate-300"
                        }}
                    />
                    <DatePicker
                        label="End Date & Time"
                        value={endAt ? fromDate(endAt, 'Asia/Bangkok') as any : null}
                        onChange={handleEndAtChange}
                        isDisabled={disabled}
                        granularity="minute"
                        classNames={{
                            label: "text-slate-600",
                            inputWrapper: "border-slate-200 hover:border-slate-300"
                        }}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(1)}
                        disabled={disabled}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                        1 Hour
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(2)}
                        disabled={disabled}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                        2 Hours
                    </Button>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<Clock size={14} />}
                        onPress={() => handleQuickSet(4)}
                        disabled={disabled}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    >
                        4 Hours
                    </Button>
                </div>

                {(startAt || endAt) && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <Calendar size={14} />
                            Schedule Preview
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {startAt && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-slate-600">START</span>
                                    <div className="text-sm text-slate-800">
                                        <div className="font-medium">{formatDateTime(startAt).date}</div>
                                        <div className="text-slate-600">{formatDateTime(startAt).time}</div>
                                    </div>
                                </div>
                            )}
                            {endAt && (
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs font-medium text-slate-600">END</span>
                                    <div className="text-sm text-slate-800">
                                        <div className="font-medium">{formatDateTime(endAt).date}</div>
                                        <div className="text-slate-600">{formatDateTime(endAt).time}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
} 