'use client'
import SettingAccoardion from "./_components/SettingAccoardion";

export default function SettingsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold mb-8">Settings</h1>
            </div>
            <div className="flex flex-col gap-10">
                <div>
                    <SettingAccoardion />
                </div>
            </div>


        </div>
    );
}
