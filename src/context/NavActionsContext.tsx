"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface NavActions {
    alertCount: number;
    onBellClick?: () => void;
    onCalendarClick?: () => void;
}

interface NavActionsContextValue extends NavActions {
    setNavActions: (actions: Partial<NavActions>) => void;
}

const NavActionsContext = createContext<NavActionsContextValue>({
    alertCount: 0,
    setNavActions: () => {},
});

export function NavActionsProvider({ children }: { children: React.ReactNode }) {
    const [actions, setActionsState] = useState<NavActions>({ alertCount: 0 });

    const setNavActions = useCallback((next: Partial<NavActions>) => {
        setActionsState((prev) => ({ ...prev, ...next }));
    }, []);

    return (
        <NavActionsContext.Provider value={{ ...actions, setNavActions }}>
            {children}
        </NavActionsContext.Provider>
    );
}

export function useNavActions() {
    return useContext(NavActionsContext);
}
