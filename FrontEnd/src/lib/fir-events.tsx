/**
 * Lumina — FIR Event Context
 * Lightweight global event bus so the ReportModal can notify any page
 * that a new FIR was created, triggering an immediate data refetch.
 */
import { createContext, useContext, useCallback, useState } from "react";

interface FIREventContextValue {
  /** Increments every time a new FIR is successfully created. */
  firCreatedCount: number;
  /** Call this after api.createFir() succeeds. */
  notifyFIRCreated: () => void;
}

const FIREventContext = createContext<FIREventContextValue>({
  firCreatedCount: 0,
  notifyFIRCreated: () => {},
});

export function FIREventProvider({ children }: { children: React.ReactNode }) {
  const [firCreatedCount, setFirCreatedCount] = useState(0);

  const notifyFIRCreated = useCallback(() => {
    setFirCreatedCount((n) => n + 1);
  }, []);

  return (
    <FIREventContext.Provider value={{ firCreatedCount, notifyFIRCreated }}>
      {children}
    </FIREventContext.Provider>
  );
}

export function useFIREvents() {
  return useContext(FIREventContext);
}
