import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const ScheduleCalendar = ({ events, viewMode, onEventClick }) => {
    return (
        <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={viewMode === 'day' ? 'timeGridDay' : 'timeGridWeek'}
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
            }}
            events={events}
            slotMinTime="08:00:00"
            slotMaxTime="21:00:00"
            allDaySlot={false}
            weekends={false}
            height="auto"
            nowIndicator={true}
            slotDuration="00:30:00"
            eventClick={onEventClick}
            eventContent={(eventInfo) => (
                <div style={{ padding: '2px', overflow: 'hidden' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>{eventInfo.event.title}</div>
                    <div style={{ fontSize: '0.75rem' }}>
                        📍 {eventInfo.event.extendedProps.classroom}
                    </div>
                </div>
            )}
        />
    );
};

export default ScheduleCalendar;
