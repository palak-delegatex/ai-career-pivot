"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface CareerCoachContextValue {
  widgetActive: boolean;
  setWidgetActive: (v: boolean) => void;
}

const CareerCoachContext = createContext<CareerCoachContextValue>({
  widgetActive: false,
  setWidgetActive: () => {},
});

export function CareerCoachProvider({ children }: { children: ReactNode }) {
  const [widgetActive, setWidgetActive] = useState(false);
  return (
    <CareerCoachContext.Provider value={{ widgetActive, setWidgetActive }}>
      {children}
    </CareerCoachContext.Provider>
  );
}

export function useCareerCoach() {
  return useContext(CareerCoachContext);
}
