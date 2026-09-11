import { createContext, useContext, useEffect, ReactNode } from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme: Theme = "light";

  const enforceLightTheme = () => {
    const root = document.documentElement;

    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  };

  // Force light mode at all times.
  useEffect(() => {
    enforceLightTheme();
  }, []);

  const toggleTheme = () => enforceLightTheme();
  const setTheme = (_theme: Theme) => enforceLightTheme();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
