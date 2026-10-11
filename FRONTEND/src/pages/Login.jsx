import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../env";
 
function Login() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const savedUser = localStorage.getItem("workflowUser");
    if (savedUser) {
      navigate("/dashboard", { replace: true });
      return;
    }
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/users/userslist`, {
          withCredentials: true
        });
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load users:", error);
        setError("Unable to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);
  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    if (!selectedUser) {
      setError("Please select a user.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    try {
      setLoggingIn(true);
     
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        user_id: selectedUser,
        password
      }, {
        withCredentials: true
      });
       
      localStorage.setItem("workflowUser", JSON.stringify(response.data.user));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      setError("Login failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      
      <div className="w-full max-w-md">
        
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          
          {/* Header */}
          <div className="bg-slate-950 px-8 py-8 text-center">
            
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white">
              
              <span className="text-xl font-black text-slate-950">
                
                WF
              </span>
            </div>
            <h1 className="text-xl font-bold text-white">
              
              Workflow Tracking System
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              
              Sign in to continue
            </p>
          </div>
          {/* Form */}
          <form onSubmit={handleLogin} className="p-8">
            
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                
                {error}
              </div>
            )}
            {/* User */}
            <div>
              
              <label
                htmlFor="user"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                
                User
              </label>
              <div className="relative">
                
                <UserRound
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  id="user"
                  value={selectedUser}
                  onChange={(event) => {
                    setSelectedUser(event.target.value);
                    setError("");
                  }}
                  disabled={loading || loggingIn}
                  className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  
                  <option value="">
                    
                    {loading ? "Loading users..." : "Select user"}
                  </option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      
                      {user.username} {user.role ? ` — ${user.role}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Password */}
            <div className="mt-5">
              
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                
                Password
              </label>
              <div className="relative">
                
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  disabled={loading || loggingIn}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-11 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading || loggingIn}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700 disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || loggingIn}
              className="mt-7 flex h-11 w-full items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              
              {loggingIn ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">
          
          Workflow Tracking System
        </p>
      </div>
    </div>
  );
}
export default Login;
