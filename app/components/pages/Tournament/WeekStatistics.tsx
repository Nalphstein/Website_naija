import React from "react";

interface WeekStatisticsProps {
  currentWeek: number;
  currentWeekFixtures: any[];
  fixtureScores: { [key: string]: { homeScore: number; awayScore: number; completed?: boolean } };
  getFixtureKey: (fx: any) => string;
  isWeekCompleted: (week: number) => boolean;
  totalWeeks: number;
}

const WeekStatistics: React.FC<WeekStatisticsProps> = ({
  currentWeek,
  currentWeekFixtures,
  fixtureScores,
  getFixtureKey,
  isWeekCompleted,
  totalWeeks
}) => {
  const completedCount = currentWeekFixtures.filter(f => fixtureScores[getFixtureKey(f)]?.completed).length;
  const remainingCount = currentWeekFixtures.filter(f => !fixtureScores[getFixtureKey(f)]?.completed).length;
  const totalGoals = currentWeekFixtures.reduce((total, f) => {
    const score = fixtureScores[getFixtureKey(f)];
    return total + (score?.completed ? (score.homeScore + score.awayScore) : 0);
  }, 0);
  const percentComplete = currentWeekFixtures.length > 0 ? Math.round((completedCount / currentWeekFixtures.length) * 100) : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-3">Week {currentWeek} Statistics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-400">{completedCount}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-yellow-400">{remainingCount}</div>
          <div className="text-sm text-gray-400">Remaining</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-400">{totalGoals}</div>
          <div className="text-sm text-gray-400">Total Goals</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-400">{percentComplete}%</div>
          <div className="text-sm text-gray-400">Complete</div>
        </div>
      </div>
      <div className="text-center mt-4 text-gray-400">
        Week {currentWeek} Progress: {completedCount} / {currentWeekFixtures.length} matches completed
        {isWeekCompleted(currentWeek) && currentWeek < totalWeeks && (
          <div className="mt-2 text-green-400 font-semibold">
            Week {currentWeek} completed! Week {currentWeek + 1} is now available.
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekStatistics;