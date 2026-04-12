import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPendingRequests, approveListing, rejectListing } from "../../store/adminSlice";

export default function AdminRequests() {
  const dispatch = useDispatch();
  const { pendingRequests } = useSelector(s => s.admin);

  useEffect(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-black mb-2">Publishing Requests</h1>
      <p className="text-gray-400 text-sm mb-8">Review and approve listings submitted by providers.</p>

      {pendingRequests.listings && pendingRequests.listings.length > 0 ? (
        <div className="grid gap-4">
          {pendingRequests.listings.map(listing => (
            <div key={listing._id} className="p-6 bg-[#141428] rounded-2xl border border-gray-800 flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-20 h-20 rounded-xl object-cover border border-gray-700" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-[#1f1f35] border border-gray-700 flex items-center justify-center text-gray-500 text-xs">No Image</div>
                )}
                <div>
                  <div className="font-black text-lg cursor-pointer hover:text-[#7C3AED] transition"
                  onClick={() => window.open(`/listing/${listing._id}`, '_blank')}>{listing.title}</div>
                  <div className="text-sm text-gray-400 mt-1">By: {listing.organizer?.firstName} {listing.organizer?.lastName}</div>
                  <div className="text-sm text-gray-500">📍 {listing.location} • {listing.category} • {listing.price}</div>
                  <div className="text-xs text-gray-600 mt-1 max-w-md truncate">{listing.description}</div>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => dispatch(approveListing({ listingId: listing._id }))}
                  className="px-4 py-2 bg-green-500/20 text-green-500 rounded-xl border border-green-500/30 hover:bg-green-500 hover:text-white transition-all font-bold text-sm"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => dispatch(rejectListing({ listingId: listing._id }))}
                  className="px-4 py-2 bg-red-500/20 text-red-500 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all font-bold text-sm"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 bg-[#141428] rounded-3xl border border-gray-800 border-dashed text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400 font-bold">No pending listings to review.</p>
          <p className="text-gray-600 text-sm mt-1">New listing submissions will appear here.</p>
        </div>
      )}
    </div>
  );
}