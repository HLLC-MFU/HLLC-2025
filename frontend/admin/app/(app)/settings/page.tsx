'use client'
import { LucideUserSquare, SettingsIcon } from "lucide-react";

import SettingAccoardion from "./_components/SettingAccoardion";
import SettingsList from "./_components/SettingsList";

import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
    return (
        <>
            <PageHeader description='The is Management Page' icon={<SettingsIcon />} />
            <div className="flex flex-col min-h-screen">
                <SettingsList description={""} icon={<LucideUserSquare />} />
                <SettingAccoardion />
            </div>
        </>
    );
}
