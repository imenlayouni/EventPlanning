import { useState } from "react";
import { registerRequest } from "../../api/authApi";
import { Link } from "react-router-dom";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [assets, setAssets] = useState("");
  const [cinPhoto, setCinPhoto] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function validateForm() {
    if (!firstName.trim()) return "First name is required";
    if (!lastName.trim()) return "Last name is required";
    if (!email.trim()) return "Email is required";
    if (!role) return "Role is required";
    if (!cinPhoto) return "CIN photo is required";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("email", email);
    formData.append("role", role);
    if (role === "serviceProvider") {
      formData.append("location", location);
      formData.append("assets", assets);
    }
    formData.append("cinPhoto", cinPhoto);

    try {
      await registerRequest(formData); // ✅ BACKEND @ 3000

      setMessage(
        "Registration request sent. Wait for admin validation."
      );
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/download.jpg')" }}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Account Request
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-1/2 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
            />

            <input
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-1/2 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
            />
          </div>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
          >
            <option value="">Select role</option>
            <option value="participant">Participant</option>
            <option value="serviceProvider">Service Provider</option>
          </select>

          {role === "serviceProvider" && (
            <>
              <input
                placeholder="Main Location (Optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
              />
              <input
                placeholder="Key Assets (Optional)"
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none text-black"
              />
            </>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCinPhoto(e.target.files[0])}
            className="w-full border rounded-lg px-4 py-2 text-black"
          />

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primaryDark transition shadow-glow"
          >
            Submit Request
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">
            {error}
          </p>
        )}

        {message && (
          <p className="text-green-600 text-sm mt-4 text-center">
            {message}
          </p>
        )}

        <p className="text-center text-sm mt-6 !text-black">
          Already have access?{" "}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline transition"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}