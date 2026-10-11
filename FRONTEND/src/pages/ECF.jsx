 
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Eye,
  FilePlus2,
  FileText,
  RefreshCw,
  Search,
} from "lucide-react";
import axios from "axios";

import { BASE_URL } from "../env";

function ECF() {
  const [ecfs, setEcfs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchECFs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await axios.get(`${BASE_URL}/ecf`);

      setEcfs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load ECFs:", error);
      setError("Unable to load ECF records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchECFs();
  }, []);

  // Get overall ECF status from workflow array
  const getStatus = (ecf) => {
    const workflow = Array.isArray(ecf.workflow) ? ecf.workflow : [];

    if (!workflow.length) {
      return "pending";
    }

    if (workflow.some((step) => step.stepStatus === "rejected")) {
      return "rejected";
    }

    if (workflow.every((step) => step.stepStatus === "completed")) {
      return "completed";
    }

    return "pending";
  };

  // Get the current workflow step
  const getCurrentStep = (ecf) => {
    const workflow = Array.isArray(ecf.workflow) ? ecf.workflow : [];

    if (!workflow.length) {
      return null;
    }

    const activeStep = workflow.find(
      (step) =>
        step.stepStatus !== "completed" &&
        step.stepStatus !== "rejected"
    );

    return activeStep || workflow[workflow.length - 1];
  };

  const getCurrentStepLabel = (ecf) => {
    const status = getStatus(ecf);

    if (status === "completed") {
      return "Completed";
    }

    if (status === "rejected") {
      const rejectedStep = ecf.workflow?.find(
        (step) => step.stepStatus === "rejected"
      );

      return rejectedStep?.stepName || "Rejected";
    }

    const currentStep = getCurrentStep(ecf);

    return currentStep?.stepName || "ECF Raise";
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

  const filteredECFs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...ecfs]
      .filter((ecf) => {
        if (!query) return true;

        return [
          ecf.id,
          ecf.ecfId,
          ecf.ecf?.company,
          ecf.ecf?.location,
          ecf.ecf?.itPerson,
          ecf.ecf?.equipmentDetails,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .filter((ecf) => {
        if (statusFilter === "all") return true;

        return getStatus(ecf) === statusFilter;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0) -
          new Date(a.updatedAt || a.createdAt || 0)
      );
  }, [ecfs, search, statusFilter]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950">
              <FileText size={19} className="text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">ECF</h1>

              <p className="text-sm text-slate-500">
                Manage ECF and procurement workflows.
              </p>
            </div>
          </div>
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
        <div className="mb-5 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => fetchECFs(true)}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ECF ID, company, location, IT person..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() => fetchECFs(true)}
            disabled={refreshing}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ECF Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {loading
                ? "Loading records..."
                : `${filteredECFs.length} record${
                    filteredECFs.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-950" />
          </div>
        ) : filteredECFs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <FileText size={34} className="text-slate-300" />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              No ECF records found
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Try changing your search or create a new ECF.
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
            <table className="w-full min-w-[1050px] text-left">
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
                    Amount
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Current Step
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Estimated Delivery
                  </th>

                  <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredECFs.map((ecf) => {
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

                      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                        {ecf.ecf?.amount !== undefined &&
                        ecf.ecf?.amount !== null
                          ? Number(ecf.ecf.amount).toLocaleString()
                          : "N/A"}
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
                        {formatDate(ecf.ecf?.estimatedDeliveryDate)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/ecf/${ecf.id}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                        >
                          <Eye size={14} />
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

function StatusBadge({ status }) {
  const config = {
    completed: {
      label: "Completed",
      className: "border-green-200 bg-green-50 text-green-700",
    },
    rejected: {
      label: "Rejected",
      className: "border-red-200 bg-red-50 text-red-700",
    },
    pending: {
      label: "Pending",
      className: "border-amber-200 bg-amber-50 text-amber-700",
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

export default ECF;
 