import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Grid2x2,
  AudioLines,
  Languages,
  Search,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquareWarning,
  CircleHelp,
  Sparkles,
} from "lucide-react";

const topLinks = [{ id: "home", label: "Home", icon: Home, to: "/home" }];

const groups = [
  {
    id: "tools",
    label: "Tools",
    items: [
      { id: "voices", label: "Voices", icon: Grid2x2, to: "/voices" },
      {
        id: "text-to-speech",
        label: "Text to Speech",
        icon: AudioLines,
        to: "/app/text-to-speech",
      },
      { id: "dubbing", label: "Dubbing", icon: Languages, to: "/dubbing" },
    ],
  },
];

const footerLinks = [
  { id: "feedback", label: "Feedback", icon: MessageSquareWarning },
  { id: "support", label: "Support & resources", icon: CircleHelp },
  { id: "whats-new", label: "What's new", icon: Sparkles },
];

const baseClass =
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-gray-900 transition-colors";

// Link ya kuhamia page
function NavItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      title={item.label}
      className={({ isActive }) =>
        `${baseClass} ${collapsed ? "justify-center px-0" : ""} ${
          isActive ? "bg-gray-200" : "hover:bg-gray-100"
        }`
      }
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-gray-700" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

// Kitufe cha kawaida (footer)
function FooterItem({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      title={item.label}
      className={`${baseClass} hover:bg-gray-100 ${
        collapsed ? "justify-center px-0" : ""
      }`}
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0 text-gray-700" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function SideBarSection({ collapsed, onToggle }) {
  const [open, setOpen] = useState({ tools: true });

  return (
    <aside
      className="flex h-full shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-200"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* Logo + toggle */}
      <div
        className={`flex items-center px-3.5 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
        style={{ height: 52 }}
      >
        {!collapsed && (
          <NavLink
            to="/"
            className="select-none text-[26px] font-bold lowercase leading-none tracking-tight text-gray-500"
          >
            nikovoice
          </NavLink>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-label="Toggle sidebar"
          className="grid h-8 w-8 place-items-center rounded-md text-gray-800 hover:bg-gray-100"
        >
          {collapsed ? (
            <PanelLeftOpen size={18} strokeWidth={1.75} />
          ) : (
            <PanelLeftClose size={18} strokeWidth={1.75} />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {/* Search */}
        {collapsed ? (
          <button
            type="button"
            aria-label="Search"
            className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100"
          >
            <Search size={16} />
          </button>
        ) : (
          <div className="mb-3 flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-400">
            <Search size={16} className="shrink-0 text-gray-600" />
            <span className="flex-1">Search</span>
            <span className="font-mono text-xs text-gray-500">ctrl K</span>
          </div>
        )}

        {/* Top links */}
        <nav className="flex flex-col gap-0.5">
          {topLinks.map((item) => (
            <NavItem key={item.id} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Groups */}
        {groups.map((group) => (
          <div key={group.id} className="mt-5">
            {!collapsed && (
              <button
                type="button"
                onClick={() =>
                  setOpen((o) => ({ ...o, [group.id]: !o[group.id] }))
                }
                className="mb-1 flex w-full items-center gap-1.5 px-3 py-1 text-[14px] text-gray-600 hover:text-gray-900"
              >
                <span>{group.label}</span>
                <ChevronUp
                  size={14}
                  className={`transition-transform ${
                    open[group.id] ? "" : "rotate-180"
                  }`}
                />
              </button>
            )}
            {(open[group.id] || collapsed) && (
              <nav className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.id} item={item} collapsed={collapsed} />
                ))}
              </nav>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-2 py-2">
        {footerLinks.map((item) => (
          <FooterItem key={item.id} item={item} collapsed={collapsed} />
        ))}
      </div>
    </aside>
  );
}

export default SideBarSection;