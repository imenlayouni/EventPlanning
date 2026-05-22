import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { Trash2, Star } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews(res.data || []);
    } catch (err) {
      toast.error("Failed to load reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    setDeleting(reviewId);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:3000/api/admin/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
    } catch (err) {
      toast.error("Failed to delete review.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900">User Reviews & Comments</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and moderate all user comments on the platform.</p>
      </div>

      {loading && (
        <div className="text-gray-400 animate-pulse py-12 text-center">Loading reviews...</div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center shadow-sm">
          <Star size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-bold">No reviews yet.</p>
        </div>
      )}

      <div className="grid gap-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex justify-between items-start gap-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center font-black text-[#7C3AED] text-lg flex-shrink-0">
                {review.user?.firstName?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className="font-black text-gray-900">
                    {review.user?.firstName} {review.user?.lastName}
                  </span>
                  {review.user?.email && (
                    <span className="text-xs text-gray-400">{review.user.email}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Star rating */}
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-base ${star <= review.rating ? "text-yellow-400" : "text-gray-200"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>

                {review.provider && (
                  <div className="mt-2 text-xs text-gray-400">
                    Provider: <span className="font-bold text-gray-600">{review.provider.firstName} {review.provider.lastName}</span>
                  </div>
                )}
                {review.listing && (
                  <div className="mt-1 text-xs text-gray-400">
                    Listing: <span className="font-bold text-gray-600">{review.listing.title}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDelete(review._id)}
              disabled={deleting === review._id}
              className="flex-shrink-0 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
              title="Delete comment"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
