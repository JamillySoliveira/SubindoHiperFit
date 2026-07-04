import { Sun, Moon, LogOut } from "lucide-react";
import { User } from "../types";

interface NavbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  user: User | null;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function Navbar({
  activeView,
  onViewChange,
  user,
  onLogout,
  darkMode,
  onToggleDarkMode
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white dark:bg-[#1a1a1a] border-b-2 border-black dark:border-white/20 transition-colors duration-200">
      <nav className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <span 
            onClick={() => onViewChange("dashboard")}
            className="font-headline font-extrabold text-2xl tracking-tighter text-[#a04100] dark:text-[#ff6b00] cursor-pointer select-none"
          >
            HIPERFIT
          </span>

          {/* Nav Links */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => onViewChange("dashboard")}
                className={`font-semibold text-sm transition-colors relative py-1 ${
                  activeView === "dashboard"
                    ? "text-[#a04100] dark:text-[#ff6b00] border-b-2 border-[#a04100] dark:border-[#ff6b00]"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onViewChange("calculator")}
                className={`font-semibold text-sm transition-colors relative py-1 ${
                  activeView === "calculator"
                    ? "text-[#a04100] dark:text-[#ff6b00] border-b-2 border-[#a04100] dark:border-[#ff6b00]"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                Calculator
              </button>
              <button
                onClick={() => onViewChange("history")}
                className={`font-semibold text-sm transition-colors relative py-1 ${
                  activeView === "history"
                    ? "text-[#a04100] dark:text-[#ff6b00] border-b-2 border-[#a04100] dark:border-[#ff6b00]"
                    : "text-zinc-500 hover:text-black dark:hover:text-white"
                }`}
              >
                History
              </button>
            </div>
          )}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-4">
          {/* Light/Dark mode button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 border-2 border-black dark:border-white/20 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md active:translate-y-0.5 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.15)]"
            title="Alternar Modo de Cor"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-[#ff6b00]" />
            ) : (
              <Moon className="h-5 w-5 text-[#a04100]" />
            )}
          </button>

          {/* User Account Controls */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline font-mono text-xs text-zinc-500 dark:text-zinc-400">
                Olá, {user.name}
              </span>
              <div 
                onClick={() => onViewChange("history")}
                className="w-10 h-10 rounded-full border-2 border-black overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {user.photoURL ? (
                  <img
                    className="w-full h-full object-cover"
                    alt="User Profile"
                    src={user.photoURL}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#ff6b00] text-white flex items-center justify-center font-bold text-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                className="p-2 text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewChange("login")}
                className="px-3 py-1.5 font-semibold text-xs border-2 border-black dark:border-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-[2px_2px_0px_0px_black] dark:shadow-[2px_2px_0px_0px_white]"
              >
                LOGIN
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
