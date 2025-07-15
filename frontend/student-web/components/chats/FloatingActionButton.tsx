import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-28 right-6 z-10 shadow-lg rounded-full bg-gradient-to-tr from-indigo-500 to-blue-400 w-16 h-16 flex items-center justify-center border-2 border-white transition-transform duration-150 active:scale-90 hover:scale-105 focus:outline-none"
      aria-label="Add"
      type="button"
    >
      <span className="text-white text-3xl">＋</span>
    </button>
  );
};

export default FloatingActionButton; 