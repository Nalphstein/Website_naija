import React from "react";
import { Team } from "../../../services/teamservice";

interface FixtureMatchCardProps {
  fixture: {
    week: number;
    round: number;
    match: number;
    home: Team;
    away: Team;
  };
  fixtureKey: string;
  score: { homeScore: number | ""; awayScore: number | "" };
  isCompleted: boolean;
  isSaving: boolean;
  onScoreChange: (side: "home" | "away", value: number) => void;
  onSave: () => void;
}

const FixtureMatchCard: React.FC<FixtureMatchCardProps> = ({
  fixture,
  fixtureKey,
  score,
  isCompleted,
  isSaving,
  onScoreChange,
  onSave,
}) => (
  <div className="bg-gray-800 rounded-lg p-6 border border-purple-500">
    {/* Match Header */}
    <div className="text-center mb-4">
      <div className="text-green-400 font-semibold text-sm">
        WEEK {fixture.week} • ROUND {fixture.round} • MATCH {fixture.match}
      </div>
    </div>
    {/* Teams Display */}
    <div className="flex items-center justify-between mb-6">
      {/* Home Team */}
      <div className="flex flex-col items-center space-y-2 flex-1">
        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
          {fixture.home.logo ? (
            <img src={fixture.home.logo} alt={fixture.home.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="text-2xl">🏆</div>
          )}
        </div>
        <span className="text-white font-semibold text-sm text-center">
          {fixture.home.name}
        </span>
      </div>
      {/* VS and Score */}
      <div className="flex flex-col items-center space-y-2 px-4">
        <span className="text-gray-400 text-sm">VS</span>
        {isCompleted ? (
          <div className="text-2xl font-bold text-white">
            {score.homeScore} - {score.awayScore}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              className="w-12 h-8 bg-gray-700 text-white text-center rounded"
              value={score.homeScore}
              onChange={e => onScoreChange("home", Number(e.target.value))}
              placeholder="0"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              className="w-12 h-8 bg-gray-700 text-white text-center rounded"
              value={score.awayScore}
              onChange={e => onScoreChange("away", Number(e.target.value))}
              placeholder="0"
            />
          </div>
        )}
      </div>
      {/* Away Team */}
      <div className="flex flex-col items-center space-y-2 flex-1">
        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
          {fixture.away.logo ? (
            <img src={fixture.away.logo} alt={fixture.away.name} className="w-12 h-12 object-contain" />
          ) : (
            <div className="text-2xl">🏆</div>
          )}
        </div>
        <span className="text-white font-semibold text-sm text-center">
          {fixture.away.name}
        </span>
      </div>
    </div>
    {/* Save Button */}
    {!isCompleted && (
      <div className="text-center">
        <button
          onClick={onSave}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            isSaving ? "bg-gray-500 cursor-not-allowed text-white" : "bg-green-500 hover:bg-green-600 text-black"
          }`}
          disabled={isSaving || score.homeScore === "" || score.awayScore === ""}
        >
          {isSaving ? "Saving..." : "Save Match"}
        </button>
      </div>
    )}
    {isCompleted && (
      <div className="text-center">
        <div className="text-green-400 font-semibold mb-1">✓ Match Completed</div>
        {score.homeScore > score.awayScore ? (
          <div className="text-yellow-400 font-bold">{fixture.home.name} Won!</div>
        ) : score.awayScore > score.homeScore ? (
          <div className="text-yellow-400 font-bold">{fixture.away.name} Won!</div>
        ) : (
          <div className="text-blue-400 font-bold">Match Drawn</div>
        )}
      </div>
    )}
  </div>
);

export default FixtureMatchCard;