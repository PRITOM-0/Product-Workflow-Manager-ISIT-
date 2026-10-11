 
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  FilePlus2,
  MapPin,
  Save,
} from "lucide-react";
import axios from "axios";

import { BASE_URL } from "../env";

const WORKFLOW_STEPS = [
  "ECF Raise",
  "Approve",
  "CS Approve",
  "Work Order",
  "Product Inhouse",
  "Asset Code Request",
  "Document Update",
  "Product Delivery",
  "User Acknowledgement",
];

function ECFCreate() {
  const navigate = useNavigate();

  const [lists, setLists] = useState({
    company: [],
    Location: [],
  });

  const [form, setForm] = useState({
    estimatedDeliveryDate: getCurrentDateTime(),
    company: "",
    location: "",
    amount: "",
    equipmentDetails: "",
    quantity: "",
  });

  const [loadingLists, setLoadingLists] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("workflowUser");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      console.error("Invalid logged-in user:", error);
      localStorage.removeItem("workflowUser");
      return null;
    }
  });

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoadingLists(true);
        setError("");
       

        const response = await axios.get(`${BASE_URL}/lists`, {
          withCredentials: true,
        });
        console.log("Fetched lists:", response.data);

        setLists({
          company: Array.isArray(response.data?.company)
            ? response.data.company
            : [],
          Location: Array.isArray(response.data?.Location)
            ? response.data.Location
            : [],
        });
      } catch (error) {
        console.error("Failed to load lists:", error);
        setError("Unable to load company and location lists.");
      } finally {
        setLoadingLists(false);
      }
    };

    fetchLists();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!user) {
      setError("User session was not found. Please login again.");
      return;
    }

    if (!form.estimatedDeliveryDate)
      return setError("Please select estimated delivery date.");

    if (!form.company) return setError("Please select a company.");

    if (!form.location) return setError("Please select a location.");

    if (!form.amount) return setError("Please enter the amount.");

    if (Number(form.amount) < 0)
      return setError("Amount cannot be negative.");

    if (!form.equipmentDetails.trim())
      return setError("Please enter equipment details.");

    if (!form.quantity) return setError("Please enter the quantity.");

    if (Number(form.quantity) <= 0)
      return setError("Quantity must be greater than zero.");

    setSaving(true);

    try {
      const now = new Date().toISOString();

      /* Get existing ECFs */
      const { data: existingECFs } = await axios.get(`${BASE_URL}/ecf`);

      const nextNumber = getNextECFNumber(existingECFs);
      const year = new Date().getFullYear();

      const ecfId = `ECF-${year}-${String(nextNumber).padStart(4, "0")}`;

      /* Create workflow array */
      const workflow = WORKFLOW_STEPS.map((stepName, index) => ({
        serial: index + 1,
        stepName,
        stepStatus: index === 0 ? "completed" : null,
        startDateTime: index === 0 ? now : null,
        endDateTime: index === 0 ? now : null,
        notes: null,
        itPerson: index === 0 ? user.id : null,
      }));

      /* ECF data */
      const ecfData = {
        id: ecfId,
        ecfId,

        ecf: {
          estimatedDeliveryDate: new Date(
            form.estimatedDeliveryDate,
          ).toISOString(),
          company: form.company,
          location: form.location,
          amount: Number(form.amount),
          equipmentDetails: form.equipmentDetails.trim(),
          quantity: Number(form.quantity),
          itPerson: user.id,
        },

        workflow,

        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
      };

      await axios.post(`${BASE_URL}/ecf`, ecfData);

      /* Create history */
      const { data: histories } = await axios.get(
        `${BASE_URL}/ecfHistory`,
      );

      const historyNumber = getNextHistoryId(histories);

      const historyData = {
        id: `HIS-${String(historyNumber).padStart(3, "0")}`,
        ecfId,
        serial: 1,
        stepName: "ECF Raise",
        stepStatus: "completed",
        performedBy: user.id,
        dateTime: now,
        notes: "ECF created",
      };

      await axios.post(`${BASE_URL}/ecfHistory`, historyData);

      navigate(`/ecf/${ecfId}`);
    } catch (error) {
      console.error("Failed to create ECF:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create ECF. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/ecf"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
          title="Back to ECF"
        >
          <ArrowLeft size={18} />
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <FilePlus2 size={20} className="text-slate-700" />
            <h1 className="text-2xl font-bold text-slate-900">
              Raise ECF
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Create a new ECF and start the procurement workflow.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-bold text-slate-900">
              ECF Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Enter the basic information required to raise the ECF.
            </p>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Estimated Delivery Date */}
              <div>
                <label
                  htmlFor="estimatedDeliveryDate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Estimated Delivery Date
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="estimatedDeliveryDate"
                    name="estimatedDeliveryDate"
                    type="datetime-local"
                    value={form.estimatedDeliveryDate}
                    onChange={handleChange}
                    disabled={saving}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* IT Person */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  IT Person
                </label>

                <input
                  type="text"
                  value={user?.username || ""}
                  readOnly
                  className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 outline-none"
                />
              </div>

              {/* Company */}
              <div>
                <label
                  htmlFor="company"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Company
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <select
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  disabled={loadingLists || saving}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingLists
                      ? "Loading companies..."
                      : "Select company"}
                  </option>

                  {lists.company.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Location
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    disabled={loadingLists || saving}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                  >
                    <option value="">
                      {loadingLists
                        ? "Loading locations..."
                        : "Select location"}
                    </option>

                    {lists.Location.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Amount
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Enter amount"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>

              {/* Quantity */}
              <div>
                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Quantity
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  disabled={saving}
                  placeholder="Enter quantity"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>

              {/* Equipment Details */}
              <div className="md:col-span-2">
                <label
                  htmlFor="equipmentDetails"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Equipment Details
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  id="equipmentDetails"
                  name="equipmentDetails"
                  value={form.equipmentDetails}
                  onChange={handleChange}
                  disabled={saving}
                  rows={5}
                  placeholder="Describe the required equipment, specification, purpose, or other relevant details..."
                  className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              ECF ID will be generated automatically.
            </p>

            <div className="flex gap-3">
              <Link
                to="/ecf"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={saving || loadingLists || !user}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "Creating..." : "Create ECF"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* Current local datetime for datetime-local input */
function getCurrentDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

/* Generates 0001, 0002, 0003... */
function getNextECFNumber(ecfs) {
  let highestNumber = 0;

  ecfs.forEach((ecf) => {
    const value = String(ecf.ecfId || ecf.id || "");

    const match = value.match(/ECF-\d{4}-(\d+)/i);

    if (match) {
      highestNumber = Math.max(highestNumber, Number(match[1]));
    }
  });

  return highestNumber + 1;
}

/* Generates HIS-001, HIS-002, HIS-003... */
function getNextHistoryId(histories) {
  let highestNumber = 0;

  histories.forEach((history) => {
    const value = String(history.id || "");

    const match = value.match(/HIS-(\d+)/i);

    if (match) {
      highestNumber = Math.max(highestNumber, Number(match[1]));
    }
  });

  return highestNumber + 1;
}

export default ECFCreate;
 