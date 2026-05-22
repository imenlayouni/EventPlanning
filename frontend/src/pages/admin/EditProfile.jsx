import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateUser } from "../../store/authSlice";
import { updateProfile as apiUpdateProfile } from "../../api/authApi";
import { User, Lock, MapPin, Phone, Mail, Save } from "lucide-react";
import LocationPicker from "../../components/LocationPicker";

export default function EditProfile() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user) || {};

  const PASSWORD_PLACEHOLDER = "********";
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", location: "", password: PASSWORD_PLACEHOLDER });
  const [coordinates, setCoordinates] = useState(null);
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
      if (user.coordinates?.lat) setCoordinates(user.coordinates);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const body = { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone, location: form.location, coordinates };
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

  const inputClass = "w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-black text-gray-500 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-full bg-gray-50 p-8 lg:p-12">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] font-black text-2xl">
            {user.firstName?.[0] || "A"}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">Edit Profile</h1>
            <p className="text-gray-500 text-sm">Manage your admin account information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="flex gap-8 items-start">

          {/* Left: form fields */}
          <div className="flex-1 space-y-8">
            {/* Personal Info */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <User size={18} className="text-[#7C3AED]" />
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Personal Information</h2>
              </div>
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className={inputClass} placeholder="First name" />
                  </div>
                  <div>
                    <label className={labelClass}>Last Name</label>
                    <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className={inputClass} placeholder="Last name" />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <Mail size={18} className="text-[#7C3AED]" />
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Contact Details</h2>
              </div>
              <div className="p-8 grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}><Mail size={12} className="inline mr-1" />Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="admin@example.com" />
                </div>
                <div>
                  <label className={labelClass}><Phone size={12} className="inline mr-1" />Phone Number</label>
                  <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+216 XX XXX XXX" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}><MapPin size={12} className="inline mr-1" />City</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Auto-filled from map" />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex items-center gap-3">
                <Lock size={18} className="text-[#7C3AED]" />
                <h2 className="font-black text-gray-900 uppercase tracking-widest text-sm">Security</h2>
              </div>
              <div className="p-8">
                <label className={labelClass}>New Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="Leave blank to keep current password" />
                <p className="text-xs text-gray-400 mt-2">Leave unchanged to keep your current password.</p>
              </div>
            </div>

            {/* Feedback */}
            {message && (
              <div className={`px-5 py-4 rounded-2xl border text-sm font-semibold ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"}`}>
                {message.type === "success" ? "✅ " : "❌ "}{message.text}
              </div>
            )}

            <button type="submit" disabled={saving} className="flex items-center gap-3 px-10 py-4 bg-[#7C3AED] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-[#7C3AED]/20 hover:bg-[#6D28D9] transition-all disabled:opacity-50">
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile Updates"}
            </button>
          </div>

          {/* Right: sticky map */}
          <div className="w-96 sticky top-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-6" style={{ minHeight: 460 }}>
              <LocationPicker
                coordinates={coordinates}
                locationName={form.location}
                onLocationChange={({ lat, lng, locationName }) => {
                  setCoordinates({ lat, lng });
                  if (locationName) setForm(f => ({ ...f, location: locationName }));
                  apiUpdateProfile({ coordinates: { lat, lng }, ...(locationName && { location: locationName }) })
                    .then(res => dispatch(updateUser(res.data)))
                    .catch(() => {});
                }}
              />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
