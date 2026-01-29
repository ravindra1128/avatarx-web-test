import React, { useMemo, useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarPicker = ({ selectedDay, onChange, showCalendar, onToggleCalendar }) => {
  const [internalShowCalendar, setInternalShowCalendar] = useState(false);
  const calendarRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Use external showCalendar if provided, otherwise use internal state
  const isCalendarVisible = showCalendar !== undefined ? showCalendar : internalShowCalendar;
  const toggleCalendar = onToggleCalendar || (() => {
    // When opening calendar, ensure it shows the month containing the selected date
    if (!internalShowCalendar && selectedDay) {
      setCalendarCursor(moment(selectedDay).startOf('month'));
    }
    setInternalShowCalendar(!internalShowCalendar);
  });
  const [calendarCursor, setCalendarCursor] = useState(() => {
    // Initialize calendar cursor to the month containing the selected date, or current month
    return selectedDay ? moment(selectedDay).startOf('month') : moment().startOf('month');
  });
  const [weekCursor, setWeekCursor] = useState(() => {
    if (selectedDay?.clone) {
      return selectedDay.clone().startOf('week');
    } else if (selectedDay) {
      return moment(selectedDay).startOf('week');
    } else {
      return moment().startOf('week');
    }
  });
  const today = useMemo(() => moment().startOf('day'), []);
  const weekStart = useMemo(() => {
    if (weekCursor) {
      return weekCursor.clone();
    } else if (selectedDay?.clone) {
      return selectedDay.clone().startOf('week');
    } else if (selectedDay) {
      return moment(selectedDay).startOf('week');
    } else {
      return moment().startOf('week');
    }
  }, [weekCursor, selectedDay]);
  
  const isTodaySelected = useMemo(() => {
    if (!selectedDay) return false;
    const selectedMoment = selectedDay?.clone ? selectedDay.clone() : moment(selectedDay);
    return selectedMoment.isSame(today, 'day');
  }, [selectedDay, today]);
  const isCurrentWeek = useMemo(() => weekStart.isSame(today.clone().startOf('week'), 'day'), [weekStart, today]);

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target) && isCalendarVisible) {
        // Check if the click is on the calendar button (which should toggle, not close)
        const calendarButton = event.target.closest('[data-calendar-button]');
        if (!calendarButton) {
          toggleCalendar();
        }
      }
    };

    if (isCalendarVisible) {
      // Use a small delay to prevent immediate closing when button is clicked
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarVisible, toggleCalendar]);

  // Auto-scroll to selected week when component mounts or selectedDay changes
  useEffect(() => {
    if (selectedDay && scrollContainerRef.current) {
      // Instant positioning without animation
      scrollToWeek(selectedDay);
    }
  }, [selectedDay]);

  // Update calendar cursor when selected date changes
  useEffect(() => {
    if (selectedDay) {
      setCalendarCursor(moment(selectedDay).startOf('month'));
    }
  }, [selectedDay]);

  // Function to scroll to the week containing the selected date
  const scrollToWeek = (selectedDate) => {
    if (!scrollContainerRef.current || typeof window === 'undefined') return;
    
    const selectedWeekStart = selectedDate.clone().startOf('week');
    const todayWeekStart = today.clone().startOf('week');
    const weeksDiff = todayWeekStart.diff(selectedWeekStart, 'weeks');
    
    // Calculate which week index this is (0-11)
    const weekIndex = Math.max(0, Math.min(11, 11 - weeksDiff));
    
    // Get the actual width of each week container
    const weekContainers = scrollContainerRef.current.querySelectorAll('[data-week-container]');
    if (weekContainers.length > weekIndex) {
      const targetWeek = weekContainers[weekIndex];
      const scrollPosition = targetWeek.offsetLeft;
      
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'auto' // Changed from 'smooth' to 'auto' for instant positioning
      });
    } else {
      // Fallback to calculated position
      const containerWidth = scrollContainerRef.current.clientWidth || window.innerWidth;
      const scrollPosition = weekIndex * containerWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'auto' // Changed from 'smooth' to 'auto' for instant positioning
      });
    }
  };

  const handleSelect = (day) => {
    const picked = day.clone ? day.clone() : moment(day);
    // Prevent future selection
    if (picked.isAfter(today, 'day')) return;
    if (typeof onChange === 'function') {
      onChange(picked);
    }
    // Keep the week view anchored to the picked day
    setWeekCursor(picked.clone().startOf('week'));
    
    // Scroll to the selected week instantly without delay
    scrollToWeek(picked);
    
    if (isCalendarVisible) toggleCalendar();
  };

  return (
    <div ref={calendarRef} className="relative">
      {/* Calendar overlay positioned at the top */}
      {isCalendarVisible && (
        <div className="absolute top-0 left-0 right-0 z-50 mb-4 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <button
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100"
              onClick={() => setCalendarCursor(calendarCursor.clone().subtract(1, 'month'))}
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-base font-semibold">
              {calendarCursor.format('MMMM YYYY')}
            </div>
            <button
              className={`w-9 h-9 rounded-full flex items-center justify-center ${calendarCursor.isSameOrAfter(today.clone().startOf('month'), 'month') ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              onClick={() => {
                if (calendarCursor.isSameOrAfter(today.clone().startOf('month'), 'month')) return;
                setCalendarCursor(calendarCursor.clone().add(1, 'month'));
              }}
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 p-3 text-center">
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d) => (
              <div key={d} className="text-xs text-gray-500 font-medium">
                {d}
              </div>
            ))}
            {(() => {
              const start = calendarCursor.clone().startOf('month');
              const end = calendarCursor.clone().endOf('month');
              const days = [];
              const leading = start.day();
              for (let i = 0; i < leading; i++) days.push(null);
              for (let d = 1; d <= end.date(); d++) days.push(calendarCursor.clone().date(d));
              const trailing = (7 - (days.length % 7)) % 7;
              for (let i = 0; i < trailing; i++) days.push(null);
              return days.map((day, idx) => {
                if (!day) return <div key={idx} className="h-10" />;
                const isToday = day.isSame(moment(), 'day');
                const isSelected = selectedDay && day.isSame(selectedDay, 'day');
                const isFuture = day.isAfter(today, 'day');
                return (
                  <button
                    key={idx}
                    onClick={() => !isFuture && handleSelect(day.clone())}
                    disabled={isFuture}
                    className={`h-10 w-10 mx-auto flex items-center justify-center rounded-full text-base transition-colors ${
                      isSelected ? 'bg-black text-white' : isToday ? 'border border-black text-black' : 'text-gray-900 hover:bg-gray-100'
                    } ${isFuture ? 'opacity-80 cursor-not-allowed hover:bg-transparent text-gray-600' : ''}`}
                    title={day.format('ddd, MMM D, YYYY')}
                  >
                    {day.date()}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Weekday strip (Sun–Sat) with mobile-style scrolling */}
      <div className="mb-4 relative">
        {/* Commented out week navigation for now */}
        {/* <div className="flex items-center justify-between px-1 mb-3 gap-2">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
            onClick={() => setWeekCursor(weekStart.clone().subtract(7, 'days'))}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-900 font-semibold text-sm shadow-inner">
            <span>{weekStart.format('MMM D')}</span>
            <span className="opacity-60">–</span>
            <span>{weekStart.clone().add(6, 'days').format('MMM D')}</span>
          </div>
          <button
            className={`w-9 h-9 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-sm ${weekStart.isSameOrAfter(today.clone().startOf('week'), 'day') ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            onClick={() => {
              if (weekStart.isSameOrAfter(today.clone().startOf('week'), 'day')) return;
              setWeekCursor(weekStart.clone().add(7, 'days'));
            }}
            aria-label="Next week"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div> */}
        {/* Horizontal scrolling weeks container with snap scrolling */}
        <div className="relative">
          <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex pb-2" style={{ minWidth: 'max-content' }}>
              {/* Generate weeks for scrolling - show 12 weeks back from current week */}
              {Array.from({ length: 12 }).map((_, weekIdx) => {
                const weekStart = today.clone().startOf('week').subtract((11 - weekIdx) * 7, 'days');
                return (
                  <div key={weekIdx} className="flex-shrink-0 snap-start px-4" style={{ width: '100vw', minWidth: '320px' }} data-week-container>
                    {/* Week days grid */}
                    <div className="flex justify-between gap-2">
                      {Array.from({ length: 7 }).map((_, dayIdx) => {
                        const day = weekStart.clone().add(dayIdx, 'days');
                        const isActive = selectedDay && day.isSame(selectedDay, 'day');
                        const isToday = day.isSame(moment(), 'day');
                        const isFuture = day.isAfter(today, 'day');
                        return (
                          <button
                            key={dayIdx}
                            onClick={() => !isFuture && handleSelect(day)}
                            disabled={isFuture}
                            className={`flex flex-col items-center justify-center py-2 px-1 flex-1 ${isFuture ? 'opacity-80 cursor-not-allowed' : ''}`}
                            title={day.format('ddd, MMM D')}
                          >
                            <span className={`text-sm font-semibold ${isActive || isToday ? 'text-black' : isFuture ? 'text-gray-600' : 'text-gray-400'}`}>
                              {isToday ? 'Today' : day.format('ddd')}
                            </span>
                            {isActive ? (
                              <span
                                className={`mt-1.5 inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-semibold bg-black text-white`}
                              >
                                {day.format('D')}
                              </span>
                            ) : (
                              <span
                                className={`mt-1.5 inline-flex items-center justify-center w-10 h-10 rounded-full text-base font-semibold ${
                                  isFuture ? 'text-gray-600' : 'text-black'
                                }`}
                              >
                                {day.format('D')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Today button - floating style like before */}
          {selectedDay && !selectedDay.isSame(today, 'day') && (
            <button
              onClick={() => handleSelect(today)}
              className="absolute bottom-0 right-0 translate-y-4 px-3.5 py-1 rounded-l-full rounded-r-none bg-black text-white text-sm font-semibold shadow-md hover:brightness-110"
              aria-label="Jump to today"
            >
              Today
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default CalendarPicker;

