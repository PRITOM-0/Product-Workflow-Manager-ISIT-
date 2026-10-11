import {
  LayoutDashboard,
  Workflow,
  ClipboardList,
  FileText,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar() {
  const menuItems = [
    {
      label: "Dashboard",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Workflows",
      path: "/workflows",
      icon: Workflow,
    },
    {
      label: "My Tasks",
      path: "/workflows",
      icon: ClipboardList,
    },
    {
      label: "ECF",
      path: "/ecf/new",
      icon: FileText,
    },
    {
      label: "Approvals",
      path: "/workflows",
      icon: CheckCircle2,
    },
  ];

  return (
    <aside className="fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200">
      <div className="h-full flex flex-col">
        {/* Main Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="px-3 pt-2 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          <div className="pt-5">
            <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              System
            </p>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              <Settings size={18} strokeWidth={1.8} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <p className="text-[11px] text-slate-400">Workflow Tracking System</p>
          <p className="text-[10px] text-slate-400 mt-1">IT & Procurement</p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
