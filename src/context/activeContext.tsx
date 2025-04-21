import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ErrorCode } from '../errors/errorCodes';

/**
 * Interface for error information to be displayed in the UI
 */
export interface ErrorInfo {
  code: ErrorCode;
  message: string;
  traceId: string;
}

/**
 * Interface for the active context
 */
interface ActiveContextType {
  lastError: ErrorInfo | null;
  setLastError: (error: ErrorInfo | null) => void;
  clearLastError: () => void;
}

// Create the context with a default value
const ActiveContext = createContext<ActiveContextType | undefined>(undefined);

/**
 * Props for the ActiveContextProvider component
 */
interface ActiveContextProviderProps {
  children: ReactNode;
}

/**
 * Provider component for the active context
 */
export function ActiveContextProvider({ children }: ActiveContextProviderProps) {
  // State for the last error
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);

  // Function to clear the last error
  const clearLastError = () => setLastError(null);

  // Value for the context
  const value = {
    lastError,
    setLastError,
    clearLastError,
  };

  return (
    <ActiveContext.Provider value={value}>
      {children}
    </ActiveContext.Provider>
  );
}

/**
 * Hook to use the active context
 * @returns The active context
 * @throws Error if used outside of an ActiveContextProvider
 */
export function useActiveContext() {
  const context = useContext(ActiveContext);
  if (context === undefined) {
    throw new Error('useActiveContext must be used within an ActiveContextProvider');
  }
  return context;
}

/**
 * Hook to use just the last error from the active context
 * @returns The last error and a function to clear it
 */
export function useLastError() {
  const { lastError, clearLastError } = useActiveContext();
  return { lastError, clearLastError };
}
