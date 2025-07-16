import React from 'react';

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner = ({ text }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center mb-4 min-h-[120px]">
      <div className="relative mb-2">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl opacity-85">💬</span>
        <span className="block w-[70px] h-[70px] rounded-full border-4 border-t-blue-400 border-b-blue-200 border-l-blue-300 border-r-blue-100 animate-spin" />
      </div>
      {text && <span className="text-blue-400 mt-2 text-base font-semibold text-center drop-shadow">{text || 'กำลังโหลดคอมมูนิตี้ดีๆ ให้คุณ...'}</span>}
    </div>
  );
};

export default LoadingSpinner; 