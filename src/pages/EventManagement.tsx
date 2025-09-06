import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { getAllEvents, EventData } from '../services/EventService.ts'; // Adjust path as needed

interface Department {
  id: string;
  name: string;
  color: string;
}

// Department configuration
const DEPARTMENTS: Department[] = [
  { id: 'doctor', name: 'Doctor', color: '#3b82f6' },
  { id: 'frontdesk', name: 'Front Desk', color: '#10b981' },
  { id: 'patient', name: 'Patients', color: '#f59e0b' },
  { id: 'pharmacy', name: 'Pharmacy', color: '#ef4444' },
];

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllEvents();

      if (response.success) {
        setEvents(response.data);
      } else {
        setError('Failed to fetch events');
      }
    } catch (err) {
      setError('Error fetching events: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events by department
  const filteredEvents = useMemo(() => {
    if (departmentFilter === 'all') return events;
    return events.filter(event => event.department === departmentFilter);
  }, [events, departmentFilter]);

  // Get department info
  const getDepartment = useCallback((departmentId: string) => {
    return DEPARTMENTS.find(dept => dept.id === departmentId) || DEPARTMENTS[0];
  }, []);

  // Handle event click (view event only)
  const handleEventClick = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setViewModalOpen(true);
    }
  }, [events]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Get current month events count
  const getCurrentMonthEventsCount = useCallback(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getFullYear() + '-' + String(currentDate.getMonth() + 1).padStart(2, '0');
    return events.filter(event => event.date.startsWith(currentMonth)).length;
  }, [events]);

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
                onClick={fetchEvents}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen px-4 py-8 from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Event Management Calendar
            </h1>
            <p className="text-gray-600">
              View and manage department events efficiently
            </p>
          </div>

          {/* Statistics */}
          <div className="mb-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Events</h3>
              <p className="text-3xl font-bold text-blue-600">{events.length}</p>
            </div>
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Departments</h3>
              <p className="text-3xl font-bold text-green-600">
                {new Set(events.map(e => e.department)).size}
              </p>
            </div>
            <div className="bg-white border rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">This Month</h3>
              <p className="text-3xl font-bold text-purple-600">
                {getCurrentMonthEventsCount()}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Department Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                  ))}
                </select>
              </div>

              {/* Refresh Button */}
              <button
                  onClick={fetchEvents}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Departments:</span>
                {DEPARTMENTS.map(dept => (
                    <div key={dept.id} className="flex items-center gap-1">
                      <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dept.color }}
                      />
                      <span className="text-xs text-gray-600">{dept.name}</span>
                    </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6">
              <SimpleCalendar
                  events={filteredEvents}
                  onEventClick={handleEventClick}
                  getDepartment={getDepartment}
              />
            </div>
          </div>
        </div>

        {/* View Event Modal */}
        {viewModalOpen && selectedEvent && (
            <Modal
                title="Event Details"
                onClose={() => setViewModalOpen(false)}
            >
              <EventDetails
                  event={selectedEvent}
                  department={getDepartment(selectedEvent.department)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={() => setViewModalOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </Modal>
        )}
      </div>
  );
};

// Simple Calendar Component
const SimpleCalendar: React.FC<{
  events: EventData[];
  onEventClick: (eventId: string) => void;
  getDepartment: (id: string) => Department;
}> = ({ events, onEventClick, getDepartment }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const [viewMonth, setViewMonth] = useState(currentMonth);
  const [viewYear, setViewYear] = useState(currentYear);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear(viewYear - 1);
      } else {
        setViewMonth(viewMonth - 1);
      }
    } else {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear(viewYear + 1);
      } else {
        setViewMonth(viewMonth + 1);
      }
    }
  };

  return (
      <div className="calendar">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-md hover:bg-gray-100"
          >
            ←
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {monthNames[viewMonth]} {viewYear}
          </h2>
          <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-md hover:bg-gray-100"
          >
            →
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600">
                {day}
              </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-24"></div>;
            }

            const dayEvents = getEventsForDate(day);
            const isToday = day === today.getDate() &&
                viewMonth === today.getMonth() &&
                viewYear === today.getFullYear();

            return (
                <div
                    key={day}
                    className={`h-24 border border-gray-200 p-1 ${
                        isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {day}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map(event => {
                      const dept = getDepartment(event.department);
                      return (
                          <div
                              key={event.id}
                              className="text-xs p-1 rounded truncate cursor-pointer hover:opacity-80"
                              style={{
                                backgroundColor: dept.color + '20',
                                borderLeft: `3px solid ${dept.color}`
                              }}
                              onClick={() => onEventClick(event.id)}
                          >
                            {event.title}
                          </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 2} more
                        </div>
                    )}
                  </div>
                </div>
            );
          })}
        </div>
      </div>
  );
};

// Modal Component
const Modal: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => {
  return (
      <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
              <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            {children}
          </div>
        </div>
      </div>
  );
};

// Event Details Component
const EventDetails: React.FC<{
  event: EventData;
  department: Department;
}> = ({ event, department }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Status: <span className={`px-2 py-1 rounded-full text-xs ${
              event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {event.status}
          </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Date</label>
            <p className="text-gray-800">{formatDate(event.date)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Time</label>
            <p className="text-gray-800">{event.startTime} - {event.endTime}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">Department</label>
          <div className="flex items-center gap-2">
            <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: department.color }}
            />
            <p className="text-gray-800">{department.name}</p>
          </div>
        </div>

        {event.location && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Location</label>
              <p className="text-gray-800">{event.location}</p>
            </div>
        )}

        {event.organizer && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Organizer</label>
              <p className="text-gray-800">{event.organizer}</p>
            </div>
        )}

        {event.eventType && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Event Type</label>
              <p className="text-gray-800">{event.eventType}</p>
            </div>
        )}

        {event.priority && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Priority</label>
              <p className={`text-gray-800 ${
                  event.priority === 'high' ? 'text-red-600' :
                      event.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {event.priority}
              </p>
            </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-600">Description</label>
          <p className="text-gray-800">{event.description || 'No description provided'}</p>
        </div>

        {event.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Notes</label>
              <p className="text-gray-800">{event.notes}</p>
            </div>
        )}

        {event.isRecurring && event.recurringPattern && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Recurring Pattern</label>
              <p className="text-gray-800">
                {event.recurringPattern.frequency} every {event.recurringPattern.interval}
                {event.recurringPattern.interval === 1 ? '' : 's'}
              </p>
            </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-600">Attendees</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {event.attendees.map((attendee, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                {attendee}
              </span>
                ))}
              </div>
            </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <label className="block font-medium">Created by</label>
              <p>{event.createdBy.name}</p>
            </div>
            <div>
              <label className="block font-medium">Created at</label>
              <p>{formatDate(event.createdAt)}</p>
            </div>
          </div>
        </div>
      </div>
  );
};

export default EventManagement;
