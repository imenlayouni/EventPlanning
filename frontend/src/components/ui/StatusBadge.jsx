
const variants = {
    pending:   "bg-yellow-400/10 text-yellow-400 border border-yellow-500/30",
    accepted:  "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30",
    active:    "bg-emerald-400/10 text-emerald-400 border border-emerald-500/30",
    declined:  "bg-red-400/10 text-red-400 border border-red-500/30",
    banned:    "bg-red-400/10 text-red-400 border border-red-500/30",
    suspended: "bg-orange-400/10 text-orange-400 border border-orange-500/30",
};

export default function StatusBadge({ status }) {
    const cls = variants[status] ?? "bg-gray-400/10 text-gray-400 border border-gray-500/30";
    return (
        <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${cls}`}>
            {status}
        </span>
    );
}
