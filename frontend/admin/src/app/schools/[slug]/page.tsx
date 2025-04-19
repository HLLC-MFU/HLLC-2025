"use client";

import { useParams } from "next/navigation";

export default function SchoolDetail() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">School: {slug}</h1>
    </div>
  );
}
