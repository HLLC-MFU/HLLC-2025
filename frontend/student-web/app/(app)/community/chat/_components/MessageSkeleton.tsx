import React from 'react';

interface MessageSkeletonProps {
  count?: number;
  isMyMessage?: boolean;
}

const MessageSkeleton = ({ count = 3, isMyMessage = false }: MessageSkeletonProps) => {
  return (
    <div className={`w-full flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} mb-2`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex items-end ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} mb-2`}
        >
          {/* Avatar skeleton */}
          {!isMyMessage && (
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse mr-2" />
          )}
          
          <div className={`flex flex-col max-w-[80%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
            {/* Username skeleton */}
            {!isMyMessage && (
              <div className="w-16 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 ml-1" />
            )}
            
            {/* Message bubble skeleton */}
            <div
              className={`px-4 py-2.5 rounded-2xl transition-all duration-300 ease-out ${
                isMyMessage
                  ? 'bg-gray-200 dark:bg-gray-700 rounded-br-sm'
                  : 'bg-gray-200 dark:bg-gray-700 rounded-bl-sm'
              }`}
            >
              {/* Random width for message content */}
              <div 
                className={`h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse ${
                  index % 3 === 0 ? 'w-32' : 
                  index % 3 === 1 ? 'w-48' : 'w-24'
                }`}
              />
            </div>
            
            {/* Timestamp skeleton */}
            <div className="w-12 h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1 ml-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton; 