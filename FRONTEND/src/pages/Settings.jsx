import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Settings as SettingsIcon } from "lucide-react";

import { BASE_URL } from "../env";

function Settings() {
  const [lists, setLists] = useState({});
  const [selected, setSelected] = useState("company");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const user = JSON.parse(localStorage.getItem("workflowUser") || "null");

  useEffect(() => {
    axios
      .get(`${ BASE_URL}/list`)
      .then((res) => setLists(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!value.trim()) return;

    setSaving(true);

    try {
      const updated = {
        ...lists,
        [selected]: [...(lists[selected] || []), value.trim()],
      };

      await axios.put(`${ BASE_URL}/list`, updated);
      setLists(updated);
      setValue("");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove "${item}"?`)) return;

    try {
      const updated = {
        ...lists,
        [selected]: lists[selected].filter((x) => x !== item),
      };

      await axios.put(`${ BASE_URL}/list`, updated);
      setLists(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <SettingsIcon size={32} className="mx-auto text-slate-300" />
        <h2 className="mt-3 font-bold text-slate-800">Access Restricted</h2>
        <p className="mt-1 text-sm text-slate-500">
          Only administrators can manage settings.
        </p>
      </div>
    );
  }

  const keys = Object.keys(lists);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage system lists and options
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          {keys.map((key) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`mb-1 flex w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                selected === key
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-5">
            <h2 className="font-bold capitalize text-slate-900">{selected}</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : (
            <>
              <div className="flex gap-2 border-b p-5">
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && save()}
                  placeholder={`Add ${selected}`}
                  className="h-10 flex-1 rounded-lg border px-3 text-sm outline-none focus:border-slate-500"
                />

                <button
                  onClick={save}
                  disabled={saving || !value.trim()}
                  className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving" : "Add"}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {(lists[selected] || []).map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {item}
                    </span>

                    <button
                      onClick={() => remove(item)}
                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {!lists[selected]?.length && (
                  <p className="p-8 text-center text-sm text-slate-400">
                    No items found.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
