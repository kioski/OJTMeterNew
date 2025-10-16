import React, { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { TimeLog } from '../types/index';

interface CalendarProps {
  timeLogs: TimeLog[];
  onDateClick?: (date: string) => void;
  onEventClick?: (event: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({ timeLogs, onDateClick, onEventClick }) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Convert time logs to calendar events
  const events = timeLogs.map(log => ({
    id: log.id,
    title: `${log.hours}h${log.description ? ` - ${log.description}` : ''}`,
    date: log.date,
    backgroundColor: getHoursColor(log.hours),
    borderColor: getHoursColor(log.hours),
    textColor: '#ffffff',
    extendedProps: {
      hours: log.hours,
      description: log.description,
      projectId: log.projectId,
    }
  }));

  // Color coding based on hours worked
  function getHoursColor(hours: number): string {
    if (hours >= 8) return '#10b981'; // Green for full day
    if (hours >= 6) return '#f59e0b'; // Yellow for partial day
    if (hours >= 4) return '#f97316'; // Orange for half day
    return '#ef4444'; // Red for less than half day
  }

  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(info.dateStr);
    }
  };

  const handleEventClick = (info: any) => {
    if (onEventClick) {
      onEventClick(info.event);
    }
  };

  const calendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    events: events,
    dateClick: handleDateClick,
    eventClick: handleEventClick,
    dayMaxEvents: 3,
    moreLinkClick: 'popover',
    eventDisplay: 'block',
    dayCellContent: (info: any) => {
      const dateStr = info.date.toISOString().split('T')[0];
      const dayLogs = timeLogs.filter(log => log.date.startsWith(dateStr));
      const totalHours = dayLogs.reduce((sum, log) => sum + log.hours, 0);
      
      return {
        html: `
          <div class="fc-daygrid-day-number">
            ${info.dayNumberText}
            ${totalHours > 0 ? `<div class="fc-day-hours">${totalHours}h</div>` : ''}
          </div>
        `
      };
    },
    eventDidMount: (info: any) => {
      // Add tooltip with more details
      info.el.setAttribute('title', 
        `${info.event.extendedProps.hours}h - ${info.event.extendedProps.description || 'No description'}`
      );
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Calendar View</h3>
      <div className="calendar-container">
        <FullCalendar
          ref={calendarRef}
          {...calendarOptions}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
          <span>8+ hours (Full day)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
          <span>6-7 hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
          <span>4-5 hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
          <span>&lt;4 hours</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
