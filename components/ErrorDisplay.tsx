import React from 'react';
import { useLastError } from '@/src/context/activeContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';

/**
 * Component to display error information from the activeContext
 * This can be used in any page or component to show the last error
 */
export function ErrorDisplay() {
  const { lastError, clearLastError } = useLastError();
  
  if (!lastError) {
    return null;
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <div className="flex justify-between items-start">
        <div>
          <AlertTitle className="text-red-600">
            Error {lastError.code}
          </AlertTitle>
          <AlertDescription className="mt-1">
            {lastError.message}
          </AlertDescription>
          <div className="text-xs text-gray-500 mt-1">
            Trace ID: {lastError.traceId}
          </div>
        </div>
        <button 
          onClick={clearLastError}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close error message"
        >
          <X size={18} />
        </button>
      </div>
    </Alert>
  );
}

/**
 * Higher-order component that adds error handling to a page or component
 * @param Component The component to wrap with error handling
 */
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => (
    <>
      <ErrorDisplay />
      <Component {...props} />
    </>
  );
}
