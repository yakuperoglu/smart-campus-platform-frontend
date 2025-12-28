export default function ActivityFeed() {
    const activities = [
        { id: 1, text: 'Midterm Grade Uploaded for CS102', time: '2 hours ago', type: 'grade' },
        { id: 2, text: 'Registered for "AI Workshop"', time: 'Yesterday', type: 'event' },
        { id: 3, text: 'Wallet top-up: 500 TRY', time: '2 days ago', type: 'wallet' },
    ];

    const typeStyles = {
        grade: 'bg-blue-100 text-blue-600',
        event: 'bg-purple-100 text-purple-600',
        wallet: 'bg-green-100 text-green-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="relative pl-4 border-l-2 border-gray-100 space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="relative">
                        <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-white ${typeStyles[activity.type]?.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-300'}`}></div>
                        <p className="text-sm text-gray-800 font-medium">{activity.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
