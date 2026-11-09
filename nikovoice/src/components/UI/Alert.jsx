import { useEffect, useRef } from "react";

const STYLES = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "text-emerald-600",
    role: "status",
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-700",
    icon: "text-red-600",
    role: "alert",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-800",
    icon: "text-amber-600",
    role: "alert",
  },
  info: {
    box: "border-[#673de6]/20 bg-[#673de6]/5 text-gray-800",
    icon: "text-[#673de6]",
    role: "status",
  },
};

function Svg({ className, children }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const ICONS = {
  success: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  error: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </Svg>
  ),
  warning: (p) => (
    <Svg {...p}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </Svg>
  ),
  info: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </Svg>
  ),
};

/**
 * Alert inayojitegemea.
 *
 * variant:     "success" | "error" | "warning" | "info"
 * title:       kichwa kifupi (hiari)
 * children:    maelezo (yanaweza kuwa na link au JSX nyingine)
 * onClose:     ukiipa, kitufe cha kufunga (X) kinaonekana
 * autoHideMs:  inaita onClose yenyewe baada ya muda huo (inahitaji onClose)
 * className:   madarasa ya ziada (mfano "sm:col-span-2")
 */
function Alert({
  variant = "info",
  title,
  children,
  onClose,
  autoHideMs,
  className = "",
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!autoHideMs) return;
    const id = setTimeout(() => closeRef.current?.(), autoHideMs);
    return () => clearTimeout(id);
  }, [autoHideMs]);

  if (!title && !children) return null;

  const s = STYLES[variant] ?? STYLES.info;
  const Icon = ICONS[variant] ?? ICONS.info;

  return (
    <div
      role={s.role}
      className={`flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-[12px] leading-5 ${s.box} ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${s.icon}`} />

      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && (
          <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="-mr-1 -mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded opacity-60 transition-opacity hover:opacity-100"
        >
          <Svg className="h-3.5 w-3.5">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </Svg>
        </button>
      )}
    </div>
  );
}

export default Alert;