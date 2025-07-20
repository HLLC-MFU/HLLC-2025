import { useState, useEffect } from 'react';

export const useResponsiveText = () => {
  const [maxCharsPerLine, setMaxCharsPerLine] = useState(30);

  useEffect(() => {
    const updateMaxChars = () => {
      const width = window.innerWidth;
      if (width < 640) setMaxCharsPerLine(25); // Mobile
      else if (width < 768) setMaxCharsPerLine(30); // Tablet
      else if (width < 1024) setMaxCharsPerLine(35); // Small desktop
      else setMaxCharsPerLine(40); // Large desktop
    };

    updateMaxChars();
    window.addEventListener('resize', updateMaxChars);
    
    return () => window.removeEventListener('resize', updateMaxChars);
  }, []);

  const splitTextIntoChunks = (text: string, customMaxChars?: number) => {
    const maxChars = customMaxChars || maxCharsPerLine;
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < text.length; i++) {
      currentChunk += text[i];
      
      // Break at max characters or at natural word boundaries
      if (currentChunk.length >= maxChars) {
        // Try to find a better break point (space, punctuation)
        let breakPoint = currentChunk.length;
        for (let j = currentChunk.length - 1; j >= 0; j--) {
          if (currentChunk[j] === ' ' || currentChunk[j] === ',' || currentChunk[j] === '.' || currentChunk[j] === '!' || currentChunk[j] === '?') {
            breakPoint = j + 1;
            break;
          }
        }
        
        // If no good break point found, force break at max length
        if (breakPoint === currentChunk.length && currentChunk.length > maxChars) {
          breakPoint = maxChars;
        }
        
        chunks.push(currentChunk.substring(0, breakPoint));
        currentChunk = currentChunk.substring(breakPoint);
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  };

  return { maxCharsPerLine, splitTextIntoChunks };
}; 