import React from 'react';

interface FileMessageProps {
  message: any;
  onImagePreview: (imageUrl: string) => void;
  onUnsend: () => void;
}

const FileMessage = ({ message, onImagePreview, onUnsend }: FileMessageProps) => {
  const isImage = message.fileType === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl || '');

  if (isImage) {
    return (
      <button 
        className="bg-transparent p-0 border-0 rounded-xl hover:scale-[1.02] transition-transform duration-200 shadow-sm hover:shadow-md" 
        onClick={() => onImagePreview(message.fileUrl || '')} 
        onContextMenu={onUnsend}
      >
        <img
          src={message.fileUrl || ''}
          alt="file"
          className="w-56 h-56 rounded-xl object-cover bg-gray-100 dark:bg-gray-800"
          onError={e => { (e.target as HTMLImageElement).src = 'https://www.gravatar.com/avatar/?d=mp'; }}
        />
      </button>
    );
  }

  return (
    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200" onContextMenu={onUnsend}>
      <div className="flex items-center">
        <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">{message.fileName}</span>
      </div>
    </div>
  );
};

export default FileMessage; 