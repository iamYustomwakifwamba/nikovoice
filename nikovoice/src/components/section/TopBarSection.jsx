import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  FlaskConical,
  Gift,
  LogOut,
  MessageSquareText,
  Monitor,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";

const THEME_KEY = "nikovoice-theme";

const THEMES = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor },
];

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) || "light";
  } catch {
    return "light";
  }
}

function applyTheme(mode) {
  const dark =
    mode === "dark" ||
    (mode === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function MenuItem({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-gray-900 transition-colors hover:bg-gray-100"
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-gray-600" />
      <span className="truncate">{children}</span>
    </button>
  );
}

function AccountMenu({ email, onLogout }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(readTheme);
  const wrapRef = useRef(null);

  // Funga ukibofya nje au ukibonyeza Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Hifadhi na tumia theme
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* hifadhi imezuiwa */
    }
  }, [theme]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const logout = async () => {
    try {
      await onLogout();
      setOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Account"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full bg-[#673de6] text-white transition-opacity hover:opacity-90"
      >
        <User size={16} fill="currentColor" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 w-[240px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-lg"
        >
          {/* Email */}
          <p
            title={email}
            className="truncate px-3 pb-2 pt-1.5 text-[14px] text-gray-900"
          >
            {email}
          </p>

          {/* Theme */}
          <div
            role="group"
            aria-label="Theme"
            className="mx-1 mb-1.5 grid grid-cols-3 overflow-hidden rounded-md border border-gray-200"
          >
            {THEMES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-label={`${label} theme`}
                aria-pressed={theme === id}
                title={label}
                onClick={() => setTheme(id)}
                className={`grid h-8 place-items-center border-gray-200 transition-colors [&:not(:first-child)]:border-l ${
                  theme === id
                    ? "bg-gray-100 text-gray-950"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} />
              </button>
            ))}
          </div>

          {/* Links */}
          <MenuItem icon={Gift} onClick={() => setOpen(false)}>
            Refer &amp; earn
          </MenuItem>
          <MenuItem icon={FlaskConical} onClick={() => setOpen(false)}>
            Early access features
          </MenuItem>
          <MenuItem icon={Settings} onClick={() => go("/settings")}>
            Settings
          </MenuItem>
          <MenuItem icon={LogOut} onClick={logout}>
            Logout
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function TopBarSection({ title }) {
  const { user, logout } = useAuth();
  const email = user?.email ?? "";

  return (
    <header
      className="flex h-13 shrink-0 items-center justify-between bg-white px-5"
      style={{ height: 52 }}
    >
      <span className="text-[14px] text-gray-900">{title}</span>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2 text-[14px] text-gray-900 hover:opacity-80"
        >
          <span className="grid h-6 w-6 place-items-center rounded-md bg-[#ece8fd] text-[#673de6]">
            <MessageSquareText size={14} />
          </span>
          <span>Ask agent</span>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center text-gray-800"
        >
          <Bell size={18} strokeWidth={1.75} />
          <span className="absolute right-0 top-0 grid h-4 w-4 place-items-center rounded-full bg-red-700 text-[10px] font-medium text-white">
            3
          </span>
        </button>

        <div className="flex h-8 items-stretch overflow-hidden rounded-md border border-gray-200 bg-white">
          <span className="grid place-items-center px-2.5 font-mono text-[13px] text-gray-900">
            $0.00
          </span>
          <button
            type="button"
            className="bg-[#d9f5e3] px-3 text-[14px] text-emerald-800 hover:bg-[#c7efd7]"
          >
            Load credits
          </button>
        </div>

        <AccountMenu email={email} onLogout={logout} />
      </div>
    </header>
  );
}

export default TopBarSection;
