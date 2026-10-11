import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ECF from "./pages/ECF";
import ECFCreate from "./pages/ECFCreate";
import ECFDetails from "./pages/ECFDetails";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
const isLoggedIn = () => {
  return Boolean(localStorage.getItem("workflowUser"));
};
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
function App() {
  return (
    <BrowserRouter>
      
      <Routes>
        
        {/* Public Routes */} <Route path="/splash" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        {/* Protected Application Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              
              <MainLayout />
            </ProtectedRoute>
          }
        >
          
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} /> {/* ECF */}
          <Route path="ecf" element={<ECF />} />
          <Route path="ecf/create" element={<ECFCreate />} />
          <Route path="ecf/:id" element={<ECFDetails />} />
          {/* Users */} <Route path="users" element={<Users />} />
          {/* Settings */} <Route path="settings" element={<Settings />} />
        </Route>
        {/* Unknown Route */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
