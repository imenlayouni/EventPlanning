import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#0b0b16] text-white flex items-center justify-center">
            <div className="text-center bg-[#141428] p-12 rounded-3xl border border-emerald-500/30">
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-3xl font-black text-emerald-400 mb-4">Payment Successful!</h1>
                <p className="text-gray-400 mb-8">Your event services have been confirmed and paid.</p>
                <button
                    onClick={() => navigate('/user/dashboard')}
                    className="bg-[#7C3AED] px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-[#6D28D9] transition-all"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}