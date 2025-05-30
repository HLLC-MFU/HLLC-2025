'use client';
import { Milestone } from 'lucide-react';
import { Input, Button, Switch } from '@heroui/react';
import { SelectStudent } from './_components/Selectstudentinfo';
import { Informationinfo } from './_components/InfoFrom';
import { PreviewApp, PreviewOutApp } from './_components/Preview';

export default function NotiManage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto flex justify-between items-center px-4 py-6">
        {/* Heder Text */}
        <div className="flex w-full items-center justify-between ">
          <h1 className="text-3xl font-bold">Notification Management</h1>
        </div>
      </div>
      <div className="grid grid-cols-2 px-4 py-6 gap-5 min-h-screen ">
        <div id="Notification Info" className="flex row-span-2 ">
          <div className="flex flex-col w-full gap-5">
            <div className="flex flex-col w-full px-5 py-6 gap-5 bg-white rounded-2xl border border-gray-300 shadow-md">
              <h1 className="text-3xl font-bold ">Preview</h1>
              <SelectStudent />
            </div>
            <div className="flex flex-col w-full px-5 py-6 gap-5 bg-white rounded-2xl border border-gray-300 shadow-md">
              <Informationinfo />
            </div>
          </div>
        </div>
        <div
          id="Preview (Application)"
          className="flex flex-col  bg-white rounded-2xl border border-gray-300  p-6 gap-6 shadow-md items-end"
        >
          <h1 className="text-3xl font-bold w-full ">Preview In Application</h1>
          <PreviewApp />
          <Button
            color="primary"
            endContent={<Milestone />}
            className="w-fit p-6"
          >
            Post
          </Button>
        </div>
        <div
          id="Preview (Application)"
          className="flex flex-col bg-white rounded-2xl border border-gray-300  p-6 gap-6 shadow-md items-end"
        >
          <h1 className="text-3xl font-bold w-full ">Preview Notfication</h1>
          <PreviewOutApp />
        </div>
      </div>
    </div>
  );
}
