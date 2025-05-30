'use client';
import { Milestone } from 'lucide-react';
import { Input, Button, Switch } from '@heroui/react';
import { Selectstudent } from './_components/selectstudent';
import { Informationinfo } from './_components/info';

export default function NotiManage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto flex justify-between items-center px-4 py-6">
        {/* Heder Text */}
        <div className="flex w-full items-center justify-between">
          <h1 className="text-3xl font-bold">Notification Management</h1>
        </div>
      </div>
      <div className="grid grid-cols-2 px-4 py-6 gap-5 min-h-screen ">
        <div
          id="Notification Info"
          className="flex row-span-2  bg-blue-200 rounded-2xl "
        >
          <div className="flex flex-col w-full ">
            <div className="flex flex-col w-full p-5 gap-5">
              <h1 className="text-3xl font-bold ">Preview</h1>
              <Selectstudent />
            </div>
            <div className="flex flex-col w-full p-5 gap-5">
              <Informationinfo />
            </div>
          </div>
        </div>
        <div
          id="Preview (Application)"
          className="flex flex-col items-end bg-green-400 rounded-2xl p-5 gap-5"
        >
          <h1 className="text-3xl font-bold w-full ">Preview In Application</h1>
          <div className="w-full h-full max-h-80 bg-slate-400 rounded-2xl"></div>
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
          className="flex flex-col items-end bg-green-400 rounded-2xl p-5 gap-5"
        >
          <h1 className="text-3xl font-bold w-full ">Preview Notfication</h1>
          <div className="w-full h-full max-h-80 bg-slate-400 rounded-2xl"></div>
          <Button
            color="primary"
            endContent={<Milestone />}
            className="w-fit p-6"
          >
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
