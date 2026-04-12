import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";

import { loginRequest } from "../../api/authApi";
import { loginSuccess } from "../../store/authSlice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      const res = await loginRequest(email, password);

      dispatch(loginSuccess({
        token: res.data.token,
        role: res.data.role,
        name: res.data.name,
        id: res.data.id,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
        location: res.data.location,
        unavailableDates: res.data.unavailableDates || []
      })
      );

      if (res.data.role === "admin") navigate("/admin");
      else if (res.data.role === "serviceProvider") navigate("/organizer/dashboard");
      else navigate("/participant");

    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/download.jpg')" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-black"
          />

          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primaryDark transition shadow-glow"
          >
            Login
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">
            {error}
          </p>
        )}

        <p className="text-center text-sm mt-6 !text-black">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline transition"
          >
            Request one
          </Link>
        </p>
      </div>
    </div>
  );
}