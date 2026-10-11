import {
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

function Navbar() {
  const logoutUser = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // Include cookies in the request
      });
      window.location.href = "/login"; // Redirect to login page after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Logo / App Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-900 text-white flex items-center justify-center font-bold">
            PWS
          </div>

          <div>
            <h1 className="text-base font-bold text-slate-900">
              Workflow Tracking System
            </h1>
            <p className="text-[11px] text-slate-500">
              IT & Procurement
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-5">
          {/* Notification */}
          <button
            type="button"
            className="relative text-slate-600 hover:text-slate-900 transition"
          >
            <Bell size={20} />

            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-5">
            <UserCircle
              size={34}
              strokeWidth={1.6}
              className="text-slate-600"
            />

            <p>{localStorage.getItem("workflowUser") ? JSON.parse(localStorage.getItem("workflowUser")).username : ""}</p>


            <div className=" ">
              <p className="text-sm font-semibold text-slate-900">
                IT User
              </p>

              <p className="text-[11px] text-slate-500">
                Administrator
              </p>
            </div>
          </div>

          {/* Logout */}

          <button
            type="button"
            className="text-slate-500 hover:text-red-600 transition"
            title="Logout"
            onClick={() => {
              localStorage.removeItem("workflowUser");
              logoutUser(); // Call the logout function to clear the cookie
              window.location.href = "/login";
            }
          >
            
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;