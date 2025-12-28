export default function StatCard({ title, value, unit, icon: Icon, color, trend, trendValue }) {
    const colorMap = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
    };

    const badgeColor = colorMap[color] || colorMap.blue;

    return (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                        {unit && <span className="text-sm font-medium text-gray-400">{unit}</span>}
                    </div>
                </div>
                <div className={`p-2.5 rounded-lg ${badgeColor}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend === 'up' ? '↗' : '↘'} {trendValue}
                    </span>
                    <span className="text-xs text-gray-400">vs last term</span>
                </div>
            )}
        </div>
    );
}
