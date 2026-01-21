import { useState, useEffect } from 'react';

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is mobile/tablet size (less than 1024px)
      const width = window.innerWidth;
      const isMobileDevice = width < 1024;
      
      // Also check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
      const isMobileUserAgent = mobileKeywords.some(keyword => userAgent.includes(keyword));
      
      setIsMobile(isMobileDevice || isMobileUserAgent);
    };

    // Check on mount
    checkMobile();

    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
