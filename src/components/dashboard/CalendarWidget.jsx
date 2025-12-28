import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function CalendarWidget() {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

    // Mock schedule
    const schedule = [
        { id: 1, title: 'CS102 Lecture', time: '09:00', duration: '2h', dayOffset: 0, type: 'lecture' },
        { id: 2, title: 'Calculus Lab', time: '13:00', duration: '1h', dayOffset: 0, type: 'lab' },
        { id: 3, title: 'Physics Quiz', time: '10:00', duration: '1h', dayOffset: 1, type: 'exam' },
    ];

    const getDayEvents = (offset) => schedule.filter(s => s.dayOffset === offset);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                    Weekly Schedule
                </h3>
                <span className="text-xs font-mono text-gray-400">{format(today, 'MMM yyyy')}</span>
            </div>

            <div className="flex justify-between mb-4 border-b border-gray-100 pb-2">
                {[0, 1, 2, 3, 4].map((offset) => {
                    const date = addDays(weekStart, offset);
                    const isToday = isSameDay(date, today);
                    return (
                        <div key={offset} className={`flex flex-col items-center p-2 rounded-lg ${isToday ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
                            <span className="text-[10px] font-bold uppercase">{format(date, 'EEE')}</span>
                            <span className={`text-sm font-semibold ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full mt-1' : 'mt-1'}`}>
                                {format(date, 'd')}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="space-y-3">
                {getDayEvents(0).length > 0 ? (
                    getDayEvents(0).map(event => (
                        <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                            <div className={`w-1 h-full rounded-full self-stretch ${event.type === 'lecture' ? 'bg-blue-400' :
                                    event.type === 'lab' ? 'bg-purple-400' : 'bg-red-400'
                                }`}></div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{event.time} ({event.duration})</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-400 text-sm py-4">No classes today</p>
                )}
            </div>
        </div>
    );
}
