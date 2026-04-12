import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers, validateUser, rejectUser, updateUserRole, updateUserStatus } from "../../store/adminSlice";
import { Users, Search } from 'lucide-react';

export default function AdminUsers() {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.admin);

  const [filters, setFilters] = useState({ search: "", role: "all", status: "all", sort: "newest" });

  useEffect(() => {
    dispatch(fetchAllUsers(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-8">
      <div className="bg-[#141428] p-6 rounded-3xl shadow-xl border border-gray-800 flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="relative w-full lg:w-[450px] group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-500 group-focus-within:text-[#7C3AED] transition-colors" />
          <input
            name="search"
            placeholder="Search user identities or emails..."
            className="w-full bg-[#1f1f35] border-0 rounded-2xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-[#7C3AED] outline-none placeholder:text-gray-600 font-medium transition-all"
            onChange={handleFilterChange}
          />
        </div>

        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <select name="role" onChange={handleFilterChange} className="bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer">
            <option value="all">Member Roles</option>
            <option value="participant">Participant</option>
            <option value="serviceProvider">Organizer</option>
          </select>
          <select name="status" onChange={handleFilterChange} className="bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer">
            <option value="all">Access Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select name="sort" onChange={handleFilterChange} className="bg-[#1f1f35] border-0 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400 focus:ring-2 focus:ring-[#7C3AED] outline-none cursor-pointer">
            <option value="newest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="bg-[#141428] shadow-2xl rounded-[2rem] overflow-hidden border border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#1f1f35]">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Network User</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Classification</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Authority Status</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Data</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users && users.map(user => (
                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-2xl bg-[#7C3AED]/20 flex items-center justify-center text-[#A78BFA] font-black text-lg border border-[#7C3AED]/30">
                        {user.firstName?.charAt(0) || user.email?.charAt(0) || "?"}
                      </div>
                      <div className="ml-5">
                        <div className="text-sm font-black text-white group-hover:text-[#A78BFA] transition-colors">{user.firstName} {user.lastName}</div>
                        <div className="text-xs text-gray-500 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${user.role === 'serviceProvider' ? 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border
                                        ${user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500 border-green-500/30' :
                          user.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' :
                            user.status === 'BANNED' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-xs text-gray-500 font-medium tracking-tight">
                    {user.role === "serviceProvider" ? (
                      <div className="flex flex-col gap-1">
                        <span className="opacity-60">LOC: {user.location}</span>
                        <span className="text-[#A78BFA]/60">ASSETS: {user.assets}</span>
                      </div>
                    ) : <span className="opacity-30">---</span>}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-right text-xs font-black uppercase tracking-widest">
                    {user.status === "PENDING" ? (
                      <div className="flex justify-end gap-3">
                        <button onClick={() => dispatch(validateUser({ userId: user._id }))} className="px-4 py-2 bg-green-500/20 text-green-500 rounded-xl border border-green-500/30 hover:bg-green-500 hover:text-white transition-all">Approve</button>
                        <button onClick={() => dispatch(rejectUser({ userId: user._id }))} className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all">Reject</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        {user.role === "participant" && (
                          <button onClick={() => dispatch(updateUserRole({ userId: user._id, role: "serviceProvider" }))} className="p-2 text-[#A78BFA] hover:text-white transition-colors">Promote</button>
                        )}
                        {user.role === "serviceProvider" && (
                          <button onClick={() => dispatch(updateUserRole({ userId: user._id, role: "participant" }))} className="p-2 text-orange-400 hover:text-white transition-colors">Demote</button>
                        )}

                        {user.status !== "BANNED" && (
                          <button onClick={() => dispatch(updateUserStatus({ userId: user._id, status: "BANNED" }))} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">Ban</button>
                        )}
                        {user.status === "BANNED" && (
                          <button onClick={() => dispatch(updateUserStatus({ userId: user._id, status: "ACTIVE" }))} className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">Unban</button>
                        )}

                        {user.status !== "SUSPENDED" && user.status !== "BANNED" && (
                          <button onClick={() => dispatch(updateUserStatus({ userId: user._id, status: "SUSPENDED" }))} className="p-2 text-yellow-500 hover:text-white transition-colors font-black">Susp</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!users || users.length === 0) && (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Users size={48} className="text-gray-800" />
              <p className="text-gray-600 font-bold uppercase tracking-widest text-sm italic">No users matching current protocols found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
