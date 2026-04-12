
export default function StatsCard({
    icon,
    label,
    value,
    color = "text-[#7C3AED]",
    borderColor = "hover:border-[#7C3AED]/50",
}) {
    return (
        <div className={`bg-[#141428] p-6 rounded-2xl border border-gray-800 shadow-xl ${borderColor} transition-all`}>
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
        </div>
    );
}
