import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface LogEntry {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  content: string;
}

interface LogContextType {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'createdAt'>) => void;
  deleteLog: (logId: string) => void;
  getLogById: (logId: string) => LogEntry | undefined;
  updateLog: (logId: string, updatedData: { title: string; content: string }) => void;
}

const LogContext = createContext<LogContextType | undefined>(undefined);

const initialLogs: LogEntry[] = [
    {
        id: '1',
        title: 'System Maintenance Report',
        author: 'John Doe',
        createdAt: new Date().toLocaleString(),
        content: '<p>This is the full content of the system maintenance report.</p><p>All systems were checked and are running optimally.</p><ul><li>Server A: OK</li><li>Server B: OK</li><li>Database: OK</li></ul>',
    },
    {
        id: '2',
        title: 'Daily Security Checkup',
        author: 'Jane Smith',
        createdAt: new Date().toLocaleString(),
        content: '<p>Daily security audit completed. No vulnerabilities found.</p>',
    },
];

export const LogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const localData = localStorage.getItem('logs');
      if (localData) {
        return JSON.parse(localData);
      } else {
        localStorage.setItem('logs', JSON.stringify(initialLogs));
        return initialLogs;
      }
    } catch (error) {
      console.error("Could not load logs from localStorage", error);
      return initialLogs;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('logs', JSON.stringify(logs));
    } catch (error) {
      console.error("Could not save logs to localStorage", error);
    }
  }, [logs]);

  const addLog = (log: Omit<LogEntry, 'id' | 'createdAt'>) => {
    const newLog = {
      ...log,
      id: Date.now().toString(),
      createdAt: new Date().toLocaleString(),
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  const deleteLog = (logId: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
  };

  const getLogById = (logId: string) => {
    return logs.find(log => log.id === logId);
  };

  const updateLog = (logId: string, updatedData: { title: string; content: string }) => {
    setLogs(prevLogs =>
      prevLogs.map(log =>
        log.id === logId ? { ...log, ...updatedData } : log
      )
    );
  };

  return (
    <LogContext.Provider value={{ logs, addLog, deleteLog, getLogById, updateLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogContext);
  if (context === undefined) {
    throw new Error('useLogs must be used within a LogProvider');
  }
  return context;
};
