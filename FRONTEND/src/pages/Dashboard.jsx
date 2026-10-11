 
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FilePlus2,
  FileText,
  PackageCheck,
  XCircle,
} from "lucide-react";
import axios from "axios";

import { BASE_URL } from "../env";

const WORKFLOW_STEPS = [
  { key: "ecfRaise", label: "ECF Raise" },
  { key: "approve", label: "Approve" },
  { key: "csApprove", label: "CS Approve" },
  { key: "workOrder", label: "Work Order" },
  { key: "productInhouse", label: "Product Inhouse" },
  { key: "assetCodeRequest", label: "Asset Code Request" },
  { key: "documentUpdate", label: "Document Update" },
  { key: "productDelivery", label: "Product Delivery" },
  { key: "userAcknowledgement", label: "User Acknowledgement" },
];

function Dashboard() {
  const [ecfs, setEcfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchECFs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${ BASE_URL}/ecf`);

        setEcfs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Failed to load ECFs:", error);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchECFs();
  }, []);

  const totalECFs = ecfs.length;

  const completedECFs = ecfs.filter(
    (item) =>
      item.workflow?.currentStep === "completed" ||
      WORKFLOW_STEPS.every(
        (step) => item.workflow?.[step.key]?.status === "completed"
      )
  ).length;

  const rejectedECFs = ecfs.filter((item) =>
    WORKFLOW_STEPS.some(
      (step) => item.workflow?.[step.key]?.status === "rejected"
    )
  ).length;

  const pendingECFs = totalECFs - completedECFs - rejectedECFs;

  const getCurrentStepLabel = (ecf) => {
    const currentStep = ecf.workflow?.currentStep;

    if (currentStep === "completed") {
      return "Completed";
    }

    const step = WORKFLOW_STEPS.find(
      (item) => item.key === currentStep
    );

    return step?.label || "ECF Raise";
  };

  const getStatus = (ecf) => {
    if (
      WORKFLOW_STEPS.some(
        (step) => ecf.workflow?.[step.key]?.status === "rejected"
      )
    ) {
      return "rejected";
    }

    if (
      ecf.workflow?.currentStep === "completed" ||
      WORKFLOW_STEPS.every(
        (step) => ecf.workflow?.[step.key]?.status === "completed"
      )
    ) {
      return "completed";
    }

    return "pending";
  };

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of ECF and procurement workflow activities.
          </p>
        </div>

        <Link
          to="/ecf/create"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <FilePlus2 size={17} />
          Raise ECF
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total ECF"
          value={loading ? "—" : totalECFs}
          icon={FileText}
          description="All ECF records"
        />

        <StatCard
          title="Pending"
          value={loading ? "—" : pendingECFs}
          icon={Clock3}
          description="Currently in workflow"
        />

        <StatCard
          title="Completed"
          value={loading ? "—" : completedECFs}
          icon={CheckCircle2}
          description="Workflow completed"
        />

        <StatCard
          title="Rejected"
          value={loading ? "—" : rejectedECFs}
          icon={XCircle}
          description="Rejected workflow"
        />
      </div>

      {/* Recent ECF */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent ECF
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest ECF records and their current workflow step.
            </p>
          </div>

          <Link
            to="/ecf"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 transition hover:text-slate-950"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          </div>
        ) : ecfs.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
            <PackageCheck
              size={30}
              className="text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No ECF records found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Create your first ECF to start a workflow.
            </p>

            <Link
              to="/ecf/create"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <FilePlus2 size={15} />
              Raise ECF
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    ECF ID
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Company
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Location
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Current Step
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {[...ecfs]
                  .sort(
                    (a, b) =>
                      new Date(b.updatedAt || b.createdAt || 0) -
                      new Date(a.updatedAt || a.createdAt || 0)
                  )
                  .slice(0, 8)
                  .map((ecf) => {
                    const status = getStatus(ecf);

                    return (
                      <tr
                        key={ecf.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/ecf/${ecf.id}`}
                            className="text-sm font-bold text-slate-900 hover:underline"
                          >
                            {ecf.ecfId || ecf.id}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {ecf.ecf?.company || "N/A"}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700">
                          {ecf.ecf?.location || "N/A"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-slate-700">
                            {getCurrentStepLabel(ecf)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={status} />
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-500">
                          {formatDate(
                            ecf.updatedAt ||
                              ecf.createdAt ||
                              ecf.ecf?.dateTime
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            to={`/ecf/${ecf.id}`}
                            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
          <Icon size={19} className="text-slate-700" />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    completed: {
      label: "Completed",
      className:
        "border-green-200 bg-green-50 text-green-700",
    },
    rejected: {
      label: "Rejected",
      className:
        "border-red-200 bg-red-50 text-red-700",
    },
    pending: {
      label: "Pending",
      className:
        "border-amber-200 bg-amber-50 text-amber-700",
    },
  };

  const current = config[status] || config.pending;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${current.className}`}
    >
      {current.label}
    </span>
  );
}

export default Dashboard;
 
