import React from 'react';
import { BalanceChangeEvent } from '../services/tauriService';

interface ActivityHeatmapProps {
  events: BalanceChangeEvent[];
}

interface WeekData {
  days: DayData[];
}

interface DayData {
  date: Date;
  sats: number;
  level: number; // 0-4 for color intensity
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ events }) => {
  // Get the range of years from events
  const getYearsFromEvents = (): number[] => {
    if (events.length === 0) return [new Date().getFullYear()];
    
    const years = new Set<number>();
    events.forEach(event => {
      const year = new Date(event.timestamp).getFullYear();
      years.add(year);
    });
    
    // Add current year if not present
    years.add(new Date().getFullYear());
    
    return Array.from(years).sort((a, b) => b - a); // Most recent first
  };

  // Calculate sats acquired per day
  const calculateDailySats = (year: number): Map<string, number> => {
    const dailySats = new Map<string, number>();
    
    events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      if (eventDate.getFullYear() === year && event.event_type === 'Buy') {
        // Use local date instead of UTC
        const localYear = eventDate.getFullYear();
        const localMonth = eventDate.getMonth();
        const localDay = eventDate.getDate();
        const localDate = new Date(localYear, localMonth, localDay);
        const dateKey = localDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentSats = dailySats.get(dateKey) || 0;
        dailySats.set(dateKey, currentSats + event.amount_sats);
      }
    });
    
    return dailySats;
  };

  // Get color intensity level based on sats amount
  const getIntensityLevel = (sats: number, maxSats: number): number => {
    if (sats === 0) return 0;
    if (maxSats === 0) return 1;
    
    const ratio = sats / maxSats;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  // Generate weeks for a year
  const generateYearData = (year: number): WeekData[] => {
    const dailySats = calculateDailySats(year);
    const maxSats = Math.max(...Array.from(dailySats.values()), 1);
    
    const weeks: WeekData[] = [];
    const startDate = new Date(year, 0, 1); // January 1st in local time
    
    // Find the first Sunday of the year (or the Sunday before if Jan 1 is not Sunday)
    const firstSunday = new Date(startDate);
    const dayOfWeek = startDate.getDay();
    if (dayOfWeek !== 0) {
      firstSunday.setDate(startDate.getDate() - dayOfWeek);
    }
    
    // Generate 52 weeks
    for (let week = 0; week < 52; week++) {
      const weekData: WeekData = { days: [] };
      
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(firstSunday);
        currentDate.setDate(firstSunday.getDate() + (week * 7) + day);
        
        // Use local date for comparison
        const localYear = currentDate.getFullYear();
        const localMonth = currentDate.getMonth();
        const localDay = currentDate.getDate();
        const localDate = new Date(localYear, localMonth, localDay);
        const dateKey = localDate.toISOString().split('T')[0];
        const sats = dailySats.get(dateKey) || 0;
        const level = getIntensityLevel(sats, maxSats);
        
        weekData.days.push({
          date: currentDate,
          sats,
          level
        });
      }
      
      weeks.push(weekData);
    }
    
    return weeks;
  };

  // Get CSS class for intensity level
  const getIntensityClass = (level: number): string => {
    switch (level) {
      case 0: return 'bg-[rgba(247,243,227,0.1)]'; // No activity
      case 1: return 'bg-[rgba(247,147,26,0.3)]'; // Low
      case 2: return 'bg-[rgba(247,147,26,0.5)]'; // Medium-low
      case 3: return 'bg-[rgba(247,147,26,0.7)]'; // Medium-high
      case 4: return 'bg-[rgba(247,147,26,0.9)]'; // High
      default: return 'bg-[rgba(247,243,227,0.1)]';
    }
  };

  // Format date for tooltip
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const years = getYearsFromEvents();

  return (
    <div className="p-4 space-y-6">
      {years.map((year, yearIndex) => {
        const yearData = generateYearData(year);
        
        return (
          <div key={year} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[#F7F3E3]">{year}</h4>
              
              {/* Show legend only for the first (most recent) year */}
              {yearIndex === 0 && (
                <div className="flex items-center gap-2 text-xs text-[rgba(247,243,227,0.5)]">
                  <span>Less</span>
                  <div className="flex">
                    {[0, 1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        className={`w-3 h-3 border border-[rgba(247,243,227,0.2)] ${getIntensityClass(level)}`}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              )}
            </div>
            
            {/* Month labels */}
            <div className="flex text-xs text-[rgba(247,243,227,0.5)] mb-2 relative h-4">
              <div className="w-8 mr-2"></div> {/* Offset for day labels */}
              <div className="flex-1 relative">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                  <div 
                    key={month} 
                    className="absolute text-center transform -translate-x-1/2" 
                    style={{ left: `${(index + 0.5) * (100/12)}%` }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col text-xs text-[rgba(247,243,227,0.5)] mr-2 w-8">
                <div className="h-3 flex items-center justify-end"></div>
                <div className="h-3 flex items-center justify-end">Mon</div>
                <div className="h-3 flex items-center justify-end"></div>
                <div className="h-3 flex items-center justify-end">Wed</div>
                <div className="h-3 flex items-center justify-end"></div>
                <div className="h-3 flex items-center justify-end">Fri</div>
                <div className="h-3 flex items-center justify-end"></div>
              </div>
              
              {/* Heatmap grid */}
              <div className="flex-1 flex">
                {yearData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col flex-1">
                    {week.days.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`h-3 border border-[rgba(247,243,227,0.2)] ${getIntensityClass(day.level)} cursor-pointer hover:border-[rgba(247,243,227,0.4)] transition-colors`}
                        title={`${formatDate(day.date)}: ${day.sats.toLocaleString()} sats`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityHeatmap;
