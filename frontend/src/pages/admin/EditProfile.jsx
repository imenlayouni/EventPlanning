import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../store/authSlice";
import { updateProfile as apiUpdateProfile } from "../../api/authApi";

export default function EditProfile() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user) || {};

  const PASSWORD_PLACEHOLDER = "********";
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", location: "", password: PASSWORD_PLACEHOLDER });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        password: PASSWORD_PLACEHOLDER,
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, location: form.location };
      if (form.password && form.password !== PASSWORD_PLACEHOLDER) body.password = form.password;
      const res = await apiUpdateProfile(body);
      dispatch(updateUser(res.data));
      setMessage({ type: "success", text: "Profile updated successfully" });
      setForm(f => ({ ...f, password: PASSWORD_PLACEHOLDER }));
    } catch (err) {
      setMessage({ type: "error", text: err?.response?.data?.message || "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none";
  const labelClass = "block text-xs font-black text-gray-500 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-[#0b0b16] text-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-black text-white/90 mb-8">Edit Profile</h2>

        <form onSubmit={handleSave} className="space-y-6 bg-[#141428] p-10 rounded-3xl border border-gray-800 shadow-xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>First Name</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Last Name</label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+216 XX XXX XXX" />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Leave unchanged to keep current password" />
            </div>
          </div>

          {message && (
            <p className={`text-sm font-semibold ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>{message.text}</p>
          )}

          <button type="submit" disabled={saving} className="w-full bg-[#7C3AED] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save Profile Updates"}
          </button>
        </form>
      </div>
    </div>
  );
}
