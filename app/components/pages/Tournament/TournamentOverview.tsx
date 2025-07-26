import React from "react";
import { Team } from "../../../services/teamservice";

interface TournamentOverviewProps {
  availableWeeks: number[];
  totalWeeks: number;
  fixtures: any[];
  fixtureScores: { [key: string]: { homeScore: number; awayScore: number; completed?: boolean } };
  getFixtureKey: (fx: any) => string;
  teams: Team[];
}

const TournamentOverview: React.FC<TournamentOverviewProps> = ({
  availableWeeks,
  totalWeeks,
  fixtures,
  fixtureScores,
  getFixtureKey,
  teams
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h4 className="text-lg font-semibold text-white mb-3">Tournament Overview</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{availableWeeks.length} / {totalWeeks}</div>
          <div className="text-sm text-gray-400">Weeks Unlocked</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {fixtures.filter(f => fixtureScores[getFixtureKey(f)]?.completed).length} / {fixtures.length}
          </div>
          <div className="text-sm text-gray-400">Total Matches</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {teams.length > 0 ? Math.max(...teams.map(t => t.points)) : 0}
          </div>
          <div className="text-sm text-gray-400">Leading Points</div>
        </div>
      </div>
    </div>
  );
};

export default TournamentOverview;