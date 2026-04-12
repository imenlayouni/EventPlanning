import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import AdminDashboard from "./pages/admin/adminDashboard";
import AdminLayout from "./components/layout/AdminLayout";
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import EditProfile from "./pages/admin/EditProfile";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import Feed from "./pages/public/Feed";
import ListingDetails from "./pages/public/ListingDetails";
import UserDashboard from "./pages/public/UserDashboard";
import PlanNow from "./pages/public/Plan";
import MyEvents from "./pages/public/MyEvents";
import PaymentSuccess from "./pages/public/PaymentSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/events" element={<MyEvents />} />
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="/listings/:id" element={<ListingDetails />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="edit-profile" element={<EditProfile />} />
        </Route>
        <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />

        <Route path="*" element={<Navigate to="/feed" />} />
        <Route path="/plan-now" element={<PlanNow />} />

        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}
