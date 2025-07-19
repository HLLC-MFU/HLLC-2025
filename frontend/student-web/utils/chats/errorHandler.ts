// Error handling utilities for chat system

export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Don't show error for network-related issues
    if (event.reason?.message?.includes('fetch') || 
        event.reason?.message?.includes('network') ||
        event.reason?.message?.includes('WebSocket')) {
      console.warn('Network-related error, not showing to user:', event.reason);
      return;
    }
    
    // Log the error for debugging
    console.error('Chat system error:', {
      message: event.reason?.message,
      stack: event.reason?.stack,
      timestamp: new Date().toISOString()
    });
  });

  // Handle general errors
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't show error for script loading issues
    if (event.filename?.includes('chunk') || event.filename?.includes('hot-update')) {
      console.warn('Script loading error, not showing to user:', event.error);
      return;
    }
  });
};

export const safeAsync = async <T>(
  asyncFn: () => Promise<T>,
  fallback?: T,
  errorMessage?: string
): Promise<T | undefined> => {
  try {
    return await asyncFn();
  } catch (error) {
    console.error(errorMessage || 'Async operation failed:', error);
    return fallback;
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}; 