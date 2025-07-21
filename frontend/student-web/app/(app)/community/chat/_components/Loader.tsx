import React from 'react';

const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px] bg-[#121212] rounded-xl">
    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid mb-4" />
    <span className="text-blue-400 mt-3 text-lg">กำลังโหลด...</span>
  </div>
);

export default Loader; 