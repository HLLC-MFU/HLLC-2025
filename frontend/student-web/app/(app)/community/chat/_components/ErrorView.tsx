import React from 'react';

interface ErrorViewProps {
  message: string;
  onRetry: () => void;
}

const ErrorView = ({ message, onRetry }: ErrorViewProps) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] bg-[#121212] p-8 rounded-xl">
    <div className="text-6xl text-red-500 mb-4">&#10006;</div>
    <div className="text-red-500 text-lg text-center mb-4">{message}</div>
    <button 
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full mt-2 transition-colors"
      onClick={onRetry}
    >
      ลองใหม่
    </button>
  </div>
);

export default ErrorView; 