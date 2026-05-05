import { useEffect } from 'react';

export function useVisitorTracking(skipTracking: boolean = false) {
  useEffect(() => {
    // Don't track if explicitly skipped (e.g., admin pages)
    if (skipTracking) {
      return;
    }

    const trackVisitor = async () => {
      try {
        const response = await fetch('/api/analytics/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('Visitor tracking initialized');
        }
      } catch (error) {
        // Silently handle tracking errors
        console.log('Visitor tracking failed');
      }
    };

    // Track visitor on page load
    trackVisitor();
  }, [skipTracking]);
}