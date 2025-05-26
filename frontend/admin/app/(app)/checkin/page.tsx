'use client';

import { QrCodeScan } from "./_components/QrCodeScan";



export default function checkin() {
    
    return(
        <div className="flex flex-col min-h-screen">
            <div className="container mx-auto flex justify-center items-center px-4 py-6">
                <div className="flex w-full items-center ">
                    <h1 className="text-3xl font-bold">Checkin</h1>
                </div>
            </div>
            <QrCodeScan/>

        </div>
    )
}