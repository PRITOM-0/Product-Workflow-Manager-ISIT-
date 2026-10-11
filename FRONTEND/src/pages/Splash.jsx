import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedUser = localStorage.getItem("workflowUser");
      if (savedUser) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      {" "}
      <div className="text-center">
        {" "}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white">
          {" "}
          <span className="text-2xl font-black text-slate-950"> WF </span>{" "}
        </div>{" "}
        <h1 className="text-2xl font-bold tracking-wide text-white">
          {" "}
          Workflow Tracking System{" "}
        </h1>{" "}
        <p className="mt-2 text-sm text-slate-400">
          {" "}
          ECF & Procurement Workflow{" "}
        </p>{" "}
        <div className="mt-8 flex justify-center">
          {" "}
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-white" />{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
export default Splash;
