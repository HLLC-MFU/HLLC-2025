'use client';

export default function QRCodeSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="
          py-8 px-4 rounded-2xl shadow-lg
          bg-white/10
          animate-pulse
          border border-white/20
          flex flex-col items-center justify-center text-center
          gap-6
          mx-4
        "
      >
        {/* Name */}
        <div className="h-8 w-48 rounded bg-white/20" />

        {/* Student ID */}
        <div className="h-5 w-32 rounded bg-white/10" />

        {/* QR Code placeholder */}
        <div className="h-[200px] w-[200px] rounded-lg bg-white/20" />

        {/* Text below QR */}
        <div className="h-4 w-64 rounded bg-white/10" />

        {/* Button placeholder */}
        <div className="mt-4 h-10 w-40 rounded-full bg-white/20" />
      </div>
    </div>
  );
}
