import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMyEvents } from "../../store/eventsSlice";
import Navbar from "../../components/Navbar";

export default function PlanNow() {

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { myEvents, loading } = useSelector(
    state => state.events
  );

  useEffect(() => {
    dispatch(fetchMyEvents());
  }, [dispatch]);

  // ONLY EVENTS THAT HAVE SERVICES
  const validEvents = myEvents.filter(
    e => e.services && e.services.length > 0
  );

  return (
    <div className="bg-[#0b0b16] text-white min-h-screen">
      <Navbar />
      <div className="pt-32 px-4 pb-16 flex items-center justify-center">

        {/* FORM CONTAINER */}
        <div className="w-full max-w-xl bg-[#141428] rounded-2xl p-8 shadow-lg">

          {/* HEADER */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Plan Your Event
          </h1>

          <p className="text-gray-400 text-center mb-6">
            Tell us more about your event and we’ll help you organize it.
          </p>

          {/* FORM */}
          <form className="space-y-4">

            {/* FULL NAME */}
            <input
              type="text"
              placeholder="Full Name"
              className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none"
            />

            {/* EMAIL */}
            <input
              type="email"
              placeholder="Email Address"
              className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none"
            />

            {/* PHONE */}
            <input
              type="text"
              placeholder="Phone Number"
              className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none"
            />

            {/* EVENT TYPE (FROM REDUX) */}
            <select className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none">

              <option>Select Event Type</option>

              {loading && <option>Loading events...</option>}
              {!loading && validEvents.map(event => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))}
              {!loading && validEvents.length === 0 && <option disabled>No events with services found</option>}

            </select>

            {/* DATE */}
            <input
              type="date"
              className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none"
            />

            {/* MESSAGE */}
            <textarea
              placeholder="Additional Details..."
              className="w-full bg-[#1f1f35] p-3 rounded-xl outline-none h-28 resize-none"
            />

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full bg-[#7C3AED] p-3 rounded-xl font-semibold hover:bg-[#6D28D9]"
            >
              Submit Request
            </button>

            {/* BACK BUTTON */}
            <button
              type="button"
              onClick={() => navigate("/feed")}
              className="w-full text-gray-400 hover:text-white"
            >
              ← Back to Feed
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}
