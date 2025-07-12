"use client"
import { useEffect, useState } from "react";
import { useReport } from "@/hooks/useReport";
import {
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Spinner,
    addToast,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";

export default function ReportPage() {
    const [selectedTopic, setSelectedTopic] = useState("");
    const [description, setDescription] = useState("");
    const {
        topics,
        fetchReportTypes,
        submitReport,
        fetching,
        loading,
        error,
    } = useReport();

    const DESCRIPTION_LIMIT = 300;

    useEffect(() => {
        fetchReportTypes();
    }, []);

    const handleSubmit = async () => {
        if (!selectedTopic || !description.trim()) return;

        const success = await submitReport(selectedTopic, description);

        if (success) {
            addToast({
                title: "Success",
                description: "ส่งรายงานสำเร็จ",
                color: "success",
            })
            setDescription("");
            setSelectedTopic("");
        } else {
            addToast({
                title: "Fail",
                description: "ส่งรายงานไม่สำเร็จ",
                color: "danger",
            })
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h2 className="text-xl font-bold">รายงานปัญหา</h2>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">หัวข้อ</label>
                <Select
                    selectedKeys={selectedTopic ? [selectedTopic] : []}
                    placeholder={fetching ? "กำลังโหลด..." : "เลือกหัวข้อ"}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    isDisabled={fetching || loading}
                >
                    {topics.map((t) => (
                        <SelectItem key={t._id}>{t.name.th}</SelectItem>
                    ))}
                </Select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium">รายละเอียด</label>
                <Textarea
                    placeholder="อธิบายปัญหาที่คุณพบ"
                    value={description}
                    maxLength={DESCRIPTION_LIMIT}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-sm text-right text-gray-400">
                    {description.length}/{DESCRIPTION_LIMIT}
                </p>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    variant="ghost"
                    onClick={() => {
                        setDescription("");
                        setSelectedTopic("");
                    }}
                >
                    ล้างข้อมูล
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={!selectedTopic || !description.trim() || loading}
                    color="primary"
                >
                    {loading ? <Spinner size="sm" /> : "ส่งรายงาน"}
                </Button>
            </div>
        </div>
    );
}
