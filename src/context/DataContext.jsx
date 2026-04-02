import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true);

  // Monitorar conexão básica
  React.useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  return (
    <DataContext.Provider value={{ isOnline }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
