import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";

import { BASE_URL } from "../env";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "user",
  });

  const currentUser = JSON.parse(
    localStorage.getItem("workflowUser") || "null",
  );

  const loadUsers = () => {
    axios
      .get(`${BASE_URL}/users`)
      .then((res) => setUsers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const addUser = async (e) => {
    e.preventDefault();

    if (!form.username || !form.password) return;

    try {
      await axios.post(`${BASE_URL}/users`, {
        id: `USR-${String(users.length + 1).padStart(3, "0")}`,
        ...form,
      });

      setForm({
        username: "",
        password: "",
        role: "user",
      });

      setShowForm(false);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (id === currentUser?.id) return;

    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`${BASE_URL}/users/${id}`);
      setUsers((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage workflow system users
          </p>
        </div>

        {currentUser?.role === "admin" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Plus size={17} />
            Add User
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={addUser}
          className="grid gap-3 rounded-xl border bg-white p-5 sm:grid-cols-4"
        >
          <input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-slate-500"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-slate-500"
          />

          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="h-10 rounded-lg border px-3 text-sm outline-none focus:border-slate-500"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="h-10 rounded-lg bg-slate-950 text-sm font-semibold text-white"
          >
            Save User
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <UsersIcon size={32} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                    ID
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                    Username
                  </th>
                  <th className="px-5 py-3 text-xs font-bold uppercase text-slate-500">
                    Role
                  </th>
                  {currentUser?.role === "admin" && (
                    <th className="px-5 py-3 text-right text-xs font-bold uppercase text-slate-500">
                      Action
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-500">
                      {user.id}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {user.username}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize text-slate-600">
                        {user.role}
                      </span>
                    </td>

                    {currentUser?.role === "admin" && (
                      <td className="px-5 py-4 text-right">
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;
