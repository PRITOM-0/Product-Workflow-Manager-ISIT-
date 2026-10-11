 
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Edit3,
  FileText,
  MapPin,
  Package,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";

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

function ECFDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ecfData, setEcfData] = useState(null);

  const [lists, setLists] = useState({
    company: [],
    Location: [],
  });

  const [user] = useState(() => {
    const savedUser = localStorage.getItem("workflowUser");

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("workflowUser");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    estimatedDeliveryDate: "",
    company: "",
    location: "",
    amount: "",
    equipmentDetails: "",
    quantity: "",
  });

  const [selectedStep, setSelectedStep] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    fetchECF();
    fetchLists();
  }, [id]);

  const fetchECF = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(`${BASE_URL}/ecf/${id}`);

      setEcfData(response.data);
    } catch (error) {
      console.error("Failed to load ECF:", error);
      setError("Unable to load ECF details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/companyinfo`);

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
    }
  };

  /* -------------------------------------------------
     EDIT ECF
  ------------------------------------------------- */

  const openEdit = () => {
    if (!ecfData?.ecf) return;

    setEditForm({
      estimatedDeliveryDate: toDateTimeLocal(
        ecfData.ecf.estimatedDeliveryDate,
      ),
      company: ecfData.ecf.company || "",
      location: ecfData.ecf.location || "",
      amount: ecfData.ecf.amount ?? "",
      equipmentDetails: ecfData.ecf.equipmentDetails || "",
      quantity: ecfData.ecf.quantity ?? "",
    });

    setEditOpen(true);
    setError("");
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveECF = async (event) => {
    event.preventDefault();

    if (!editForm.estimatedDeliveryDate)
      return setError("Please select estimated delivery date.");

    if (!editForm.company)
      return setError("Please select a company.");

    if (!editForm.location)
      return setError("Please select a location.");

    if (editForm.amount === "" || Number(editForm.amount) < 0)
      return setError("Please enter a valid amount.");

    if (!editForm.equipmentDetails.trim())
      return setError("Please enter equipment details.");

    if (!editForm.quantity || Number(editForm.quantity) <= 0)
      return setError("Quantity must be greater than zero.");

    try {
      setSaving(true);
      setError("");

      const updatedData = {
        ...ecfData,

        ecf: {
          ...ecfData.ecf,
          estimatedDeliveryDate: new Date(
            editForm.estimatedDeliveryDate,
          ).toISOString(),
          company: editForm.company,
          location: editForm.location,
          amount: Number(editForm.amount),
          equipmentDetails: editForm.equipmentDetails.trim(),
          quantity: Number(editForm.quantity),
        },

        updatedAt: new Date().toISOString(),
      };

      const response = await axios.put(
        `${BASE_URL}/ecf/${id}`,
        updatedData,
      );

      setEcfData(response.data);
      setEditOpen(false);
    } catch (error) {
      console.error("Failed to update ECF:", error);
      setError("Unable to update ECF.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------
     DELETE ECF
  ------------------------------------------------- */

  const deleteECF = async () => {
    const confirmed = window.confirm(
      `Delete ${ecfData?.ecfId}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError("");

      await axios.delete(`${BASE_URL}/ecf/${id}`);

      navigate("/ecf");
    } catch (error) {
      console.error("Failed to delete ECF:", error);
      setError("Unable to delete ECF.");
      setDeleting(false);
    }
  };

  /* -------------------------------------------------
     WORKFLOW
  ------------------------------------------------- */

  const getWorkflow = () => {
    const existing = Array.isArray(ecfData?.workflow)
      ? ecfData.workflow
      : [];

    return WORKFLOW_STEPS.map((stepName, index) => {
      const found = existing.find(
        (step) =>
          step?.serial === index + 1 ||
          step?.stepName === stepName,
      );

      return {
        serial: index + 1,
        stepName,
        stepStatus: found?.stepStatus || null,
        startDateTime: found?.startDateTime || null,
        endDateTime: found?.endDateTime || null,
        notes: found?.notes || null,
        itPerson: found?.itPerson || null,
      };
    });
  };

  const workflow = getWorkflow();

  const activeIndex = workflow.findIndex(
    (step) => step.stepStatus !== "completed",
  );

  const isWorkflowComplete =
    workflow.length === 9 &&
    workflow.every((step) => step.stepStatus === "completed");

  const openStep = (step, index) => {
    if (index !== activeIndex) return;

    setSelectedStep(step);
    setNote(step.notes || "");
    setError("");
  };

  const completeStep = async () => {
    if (!selectedStep || !ecfData) return;

    try {
      setSaving(true);
      setError("");

      const now = new Date().toISOString();

      const updatedWorkflow = workflow.map((step) => ({
        ...step,
      }));

      const stepIndex = updatedWorkflow.findIndex(
        (step) => step.serial === selectedStep.serial,
      );

      if (stepIndex === -1) {
        setError("Workflow step was not found.");
        return;
      }

      const currentStep = updatedWorkflow[stepIndex];

      /* Complete current step */
      updatedWorkflow[stepIndex] = {
        ...currentStep,
        stepStatus: "completed",
        startDateTime: currentStep.startDateTime || now,
        endDateTime: now,
        notes: note.trim() || null,
        itPerson: user?.id || null,
      };

      /* Start next step automatically */
      const nextIndex = stepIndex + 1;

      if (nextIndex < updatedWorkflow.length) {
        updatedWorkflow[nextIndex] = {
          ...updatedWorkflow[nextIndex],
          startDateTime:
            updatedWorkflow[nextIndex].startDateTime || now,
        };
      }

      const allCompleted = updatedWorkflow.every(
        (step) => step.stepStatus === "completed",
      );

      const updatedData = {
        ...ecfData,
        workflow: updatedWorkflow,

        /* ECF status automatically changes after final step */
        status: allCompleted ? "completed" : "in-progress",

        updatedAt: now,
      };

      const response = await axios.put(
        `${BASE_URL}/ecf/${id}`,
        updatedData,
      );

      setEcfData(response.data);
      setSelectedStep(null);
      setNote("");

      /* Save workflow history */
      try {
        const historyResponse = await axios.get(
          `${BASE_URL}/ecfHistory`,
        );

        const histories = Array.isArray(historyResponse.data)
          ? historyResponse.data
          : [];

        const nextHistory = getNextHistoryId(histories);

        await axios.post(`${BASE_URL}/ecfHistory`, {
          id: `HIS-${String(nextHistory).padStart(3, "0")}`,
          ecfId: ecfData.ecfId,
          serial: currentStep.serial,
          stepName: currentStep.stepName,
          stepStatus: "completed",
          performedBy: user?.id || null,
          dateTime: now,
          notes: note.trim() || null,
        });
      } catch (historyError) {
        console.error(
          "Workflow updated but history failed:",
          historyError,
        );
      }
    } catch (error) {
      console.error("Failed to complete workflow step:", error);
      setError("Unable to complete workflow step.");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------
     RENDER
  ------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Clock3 size={18} className="animate-pulse" />
          Loading ECF...
        </div>
      </div>
    );
  }

  if (!ecfData) {
    return (
      <div>
        <Link
          to="/ecf"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Back to ECF
        </Link>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
          {error || "ECF not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* -------------------------------------------------
          HEADER
      ------------------------------------------------- */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/ecf"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"
            title="Back to ECF"
          >
            <ArrowLeft size={18} />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-slate-700" />

              <h1 className="text-2xl font-bold text-slate-900">
                ECF Details
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {ecfData.ecfId}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Edit3 size={16} />
            Edit
          </button>

          <button
            type="button"
            onClick={deleteECF}
            disabled={deleting}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-400 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* -------------------------------------------------
          ECF INFORMATION
      ------------------------------------------------- */}

      <section className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              ECF Information
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Basic information of this ECF.
            </p>
          </div>

          <StatusBadge
            status={
              ecfData.status ||
              (isWorkflowComplete ? "completed" : "in-progress")
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 md:grid-cols-2">
          <InfoItem
            icon={FileText}
            label="ECF ID"
            value={ecfData.ecfId}
          />

          <InfoItem
            icon={User}
            label="IT Person"
            value={ecfData.ecf?.itPerson}
          />

          <InfoItem
            icon={CalendarDays}
            label="Estimated Delivery Date"
            value={formatDateTime(ecfData.ecf?.estimatedDeliveryDate)}
          />

          <InfoItem
            icon={MapPin}
            label="Company"
            value={ecfData.ecf?.company}
          />

          <InfoItem
            icon={MapPin}
            label="Location"
            value={ecfData.ecf?.location}
          />

          <InfoItem
            icon={Package}
            label="Amount"
            value={formatAmount(ecfData.ecf?.amount)}
          />

          <InfoItem
            icon={Package}
            label="Quantity"
            value={ecfData.ecf?.quantity}
          />

          <div className="md:col-span-2">
            <InfoItem
              icon={FileText}
              label="Equipment Details"
              value={ecfData.ecf?.equipmentDetails}
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------
          WORKFLOW
      ------------------------------------------------- */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Workflow
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Complete each step in sequence.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              {workflow.filter(
                (step) => step.stepStatus === "completed",
              ).length}{" "}
              / {workflow.length} completed
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="relative">
            {workflow.map((step, index) => {
              const completed = step.stepStatus === "completed";
              const active = index === activeIndex && !completed;
              const waiting = index > activeIndex;

              return (
                <div
                  key={step.serial}
                  className="relative flex gap-4 pb-6 last:pb-0"
                >
                  {/* Connector */}
                  {index < workflow.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-8 h-[calc(100%-8px)] w-px ${
                        completed
                          ? "bg-emerald-400"
                          : "bg-slate-200"
                      }`}
                    />
                  )}

                  {/* Step Circle */}
                  <div className="relative z-10 shrink-0">
                    {completed ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                        <Check size={16} strokeWidth={2.5} />
                      </div>
                    ) : active ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-900 bg-white ring-4 ring-slate-100">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-400">
                        <span className="text-xs font-bold">
                          {step.serial}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Step Card */}
                  <div
                    className={`min-w-0 flex-1 rounded-xl border p-4 transition ${
                      active
                        ? "border-slate-300 bg-slate-50 shadow-sm"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {step.stepName}
                          </h3>

                          <StepBadge
                            completed={completed}
                            active={active}
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                          Step {step.serial} of {workflow.length}
                        </p>
                      </div>

                      {active && (
                        <button
                          type="button"
                          onClick={() => openStep(step, index)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Update
                          <ChevronRight size={15} />
                        </button>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <TimeInfo
                        label="Started"
                        value={formatDateTime(step.startDateTime)}
                      />

                      <TimeInfo
                        label="Finished"
                        value={formatDateTime(step.endDateTime)}
                      />

                      <TimeInfo
                        label="Time Spent"
                        value={getDuration(
                          step.startDateTime,
                          step.endDateTime,
                        )}
                      />
                    </div>

                    {step.notes && (
                      <div className="mt-4 border-t border-slate-200 pt-3">
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                          Note
                        </p>

                        <p className="text-sm text-slate-600">
                          {step.notes}
                        </p>
                      </div>
                    )}

                    {step.itPerson && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                        <User size={13} />
                        {step.itPerson}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Workflow completed */}
          {isWorkflowComplete && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
              <CheckCircle2
                size={21}
                className="shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Workflow Completed
                </p>

                <p className="mt-0.5 text-xs text-emerald-700">
                  All ECF workflow steps have been completed.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* -------------------------------------------------
          EDIT MODAL
      ------------------------------------------------- */}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Edit ECF
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update ECF information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveECF}>
              <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                {/* Estimated Delivery */}
                <FormField label="Estimated Delivery Date">
                  <input
                    name="estimatedDeliveryDate"
                    type="datetime-local"
                    value={editForm.estimatedDeliveryDate}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="input"
                  />
                </FormField>

                {/* Company */}
                <FormField label="Company">
                  <select
                    name="company"
                    value={editForm.company}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="input"
                  >
                    <option value="">Select company</option>

                    {lists.company.map((company) => (
                      <option key={company} value={company}>
                        {company}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Location */}
                <FormField label="Location">
                  <select
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="input"
                  >
                    <option value="">Select location</option>

                    {lists.Location.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </FormField>

                {/* Amount */}
                <FormField label="Amount">
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.amount}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="input"
                  />
                </FormField>

                {/* Quantity */}
                <FormField label="Quantity">
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.quantity}
                    onChange={handleEditChange}
                    disabled={saving}
                    className="input"
                  />
                </FormField>

                {/* Equipment */}
                <div className="md:col-span-2">
                  <FormField label="Equipment Details">
                    <textarea
                      name="equipmentDetails"
                      rows={4}
                      value={editForm.equipmentDetails}
                      onChange={handleEditChange}
                      disabled={saving}
                      className="input resize-y py-3"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------
          WORKFLOW NOTE MODAL
      ------------------------------------------------- */}

      {selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                    {selectedStep.serial}
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {selectedStep.stepName}
                    </h2>

                    <p className="text-xs text-slate-500">
                      Step {selectedStep.serial} of {workflow.length}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <label
                htmlFor="workflowNote"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Note
              </label>

              <textarea
                id="workflowNote"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={5}
                placeholder="Add a note for this step..."
                disabled={saving}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />

              <p className="mt-2 text-xs text-slate-400">
                Step status, date/time and IT person will be updated
                automatically.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedStep(null)}
                disabled={saving}
                className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={completeStep}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Check size={16} />
                {saving ? "Updating..." : "Complete Step"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------
   SMALL COMPONENTS
------------------------------------------------- */

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value ?? "-"}
        </p>
      </div>
    </div>
  );
}

function TimeInfo({ label, value }) {
  return (
    <div className="rounded-lg bg-white/70 px-3 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-600">
        {value}
      </p>
    </div>
  );
}

function StepBadge({ completed, active }) {
  if (completed) {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
        Completed
      </span>
    );
  }

  if (active) {
    return (
      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
        In Progress
      </span>
    );
  }

  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
      Waiting
    </span>
  );
}

function StatusBadge({ status }) {
  const completed = status === "completed";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        completed
          ? "bg-emerald-50 text-emerald-600"
          : "bg-blue-50 text-blue-600"
      }`}
    >
      {completed ? (
        <CheckCircle2 size={14} />
      ) : (
        <Circle size={14} />
      )}

      {completed ? "Completed" : "In Progress"}
    </span>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

/* -------------------------------------------------
   HELPERS
------------------------------------------------- */

function toDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();

  return new Date(date.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return Number(value).toLocaleString();
}

function getDuration(start, end) {
  if (!start) return "-";

  const startTime = new Date(start).getTime();

  if (Number.isNaN(startTime)) return "-";

  const endTime = end
    ? new Date(end).getTime()
    : Date.now();

  const seconds = Math.max(
    0,
    Math.floor((endTime - startTime) / 1000),
  );

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }

  return `${secs}s`;
}

function getNextHistoryId(histories) {
  let highestNumber = 0;

  histories.forEach((history) => {
    const match = String(history?.id || "").match(/HIS-(\d+)/i);

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number(match[1]),
      );
    }
  });

  return highestNumber + 1;
}

export default ECFDetails;
 