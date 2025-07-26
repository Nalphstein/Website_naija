import React from "react";

interface WeekNavigationProps {
  totalWeeks: number;
  availableWeeks: number[];
  currentWeek: number;
  setCurrentWeek: (week: number) => void;
  isWeekCompleted: (week: number) => boolean;
}

const WeekNavigation: React.FC<WeekNavigationProps> = ({
  totalWeeks,
  availableWeeks,
  currentWeek,
  setCurrentWeek,
  isWeekCompleted,
}) => (
  <div className="mb-6">
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => {
        const isAvailable = availableWeeks.includes(week);
        const completed = isWeekCompleted(week);
        return (
          <button
            key={week}
            onClick={() => isAvailable && setCurrentWeek(week)}
            disabled={!isAvailable}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
              currentWeek === week && isAvailable
                ? "bg-green-400 text-black"
                : isAvailable
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            WEEK {week}
            {completed && <span className="ml-1">✓</span>}
          </button>
        );
      })}
    </div>
  </div>
);

export default WeekNavigation;