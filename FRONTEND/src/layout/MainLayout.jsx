import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserRound,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "ECF",
    path: "/ecf",
    icon: ClipboardList,
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function MainLayout() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("workflowUser");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Invalid saved user:", error);
      localStorage.removeItem("workflowUser");
      return null;
    }
  });

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
  }, [navigate, user]);

  const handleLogout = () => {
    localStorage.removeItem("workflowUser");
    navigate("/login", { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white">
        <div className="flex h-full items-center justify-between px-5">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950">
              <span className="text-sm font-black text-white">WF</span>
            </div>

            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-slate-900">
                Workflow Tracking System
              </h1>
              <p className="text-[11px] text-slate-500">
                ECF & Procurement Workflow
              </p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user.username}
              </p>
              <p className="text-[11px] font-medium uppercase text-slate-500">
                {user.role}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
              <UserRound size={18} className="text-slate-600" />
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Logged in as
              </p>

              <p className="mt-1 truncate text-sm font-bold text-slate-800">
                {user.username}
              </p>

              <p className="mt-0.5 text-xs font-medium capitalize text-slate-500">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen pt-16 lg:pl-60">
        <div className="p-5 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
