import React from "react";
import WeekStatistics from "./WeekStatistics";
import TournamentOverview from "./TournamentOverview";
import { Trophy } from "lucide-react";

interface PlayoffBracketProps {
  tournament: any;
  playoffSize: number;
  teams: any[];
  playoffError: string;
  handleGeneratePlayoffBracket: () => void;
  handleResetPlayoffBracket: () => void;
  getPlayoffMatchKey: (roundIdx: number, matchIdx: number) => string;
  handlePlayoffScoreChange: (roundIdx: number, matchIdx: number, side: string, value: number) => void;
  handlePlayoffSaveScore: (roundIdx: number, matchIdx: number) => void;
  currentWeek: number;
  currentWeekFixtures: any[];
  fixtureScores: any;
  getFixtureKey: (fx: any) => string;
  isWeekCompleted: (week: number) => boolean;
  totalWeeks: number;
  availableWeeks: number[];
  fixtures: any[];
}

const PlayoffBracket: React.FC<PlayoffBracketProps> = ({
  tournament,
  playoffSize,
  teams,
  playoffError,
  handleGeneratePlayoffBracket,
  handleResetPlayoffBracket,
  getPlayoffMatchKey,
  handlePlayoffScoreChange,
  handlePlayoffSaveScore,
  currentWeek,
  currentWeekFixtures,
  fixtureScores,
  getFixtureKey,
  isWeekCompleted,
  totalWeeks,
  availableWeeks,
  fixtures
}) => (
  <div>
    <h3 className="text-2xl font-bold text-white mb-4">Playoff Bracket (Knockout Format)</h3>
    <div className="flex items-center space-x-4 mb-4">
      <label htmlFor="playoff-size" className="text-gray-300 font-medium">Number of playoff teams:</label>
      <select
        id="playoff-size"
        className="bg-gray-700 text-white px-3 py-2 rounded-lg"
        value={playoffSize}
        onChange={e => handleGeneratePlayoffBracket(Number(e.target.value))}
      >
        {Array.from({ length: teams.length - 1 }, (_, i) => i + 2).map(num => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>
      <button
        onClick={handleGeneratePlayoffBracket}
        className="bg-green-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition-colors"
        disabled={teams.length < 2}
      >
        Generate Playoff Bracket
      </button>
      <button
        onClick={handleResetPlayoffBracket}
        className="bg-red-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition-colors"
      >
        Reset Playoff Bracket
      </button>
    </div>
    {playoffError && <div className="text-red-400 mb-2">{playoffError}</div>}
    {tournament && tournament.rounds && tournament.rounds.length > 0 ? (
      <div className="space-y-8">
        {tournament.rounds.map((round: any[], roundIdx: number) => (
          <div key={roundIdx}>
            <h4 className="text-lg font-bold text-green-400 mb-4">
              {roundIdx === tournament.rounds.length - 1 && round.length === 1 
                ? 'FINAL' 
                : roundIdx === tournament.rounds.length - 2 && round.length === 2
                ? 'SEMI-FINAL'
                : `ROUND ${roundIdx + 1}`}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {round.map((match: any, matchIdx: number) => {
                const isCompleted = match.status === 'completed';
                return (
                  <div key={matchIdx} className="bg-gray-800 rounded-lg p-6 border border-purple-500">
                    {/* Match Header */}
                    <div className="text-center mb-4">
                      <div className="text-green-400 font-semibold text-sm">
                        {roundIdx === tournament.rounds.length - 1 && round.length === 1 
                          ? 'FINAL MATCH' 
                          : roundIdx === tournament.rounds.length - 2 && round.length === 2
                          ? `SEMI-FINAL ${matchIdx + 1}`
                          : `ROUND ${roundIdx + 1} • MATCH ${matchIdx + 1}`}
                      </div>
                    </div>
                    {/* Teams Display */}
                    <div className="flex items-center justify-between mb-6">
                      {/* Team 1 */}
                      <div className="flex flex-col items-center space-y-2 flex-1">
                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                          {match.team1?.logo ? (
                            <img src={match.team1.logo} alt={match.team1.name} className="w-12 h-12 object-contain" />
                          ) : (
                            <div className="text-2xl">🏆</div>
                          )}
                        </div>
                        <span className="text-white font-semibold text-sm text-center">
                          {match.team1?.name || "TBD"}
                        </span>
                      </div>
                      {/* VS and Score */}
                      <div className="flex flex-col items-center space-y-2 px-4">
                        <span className="text-gray-400 text-sm">VS</span>
                        {isCompleted ? (
                          <div className="text-2xl font-bold text-white">
                            {match.score1} - {match.score2}
                          </div>
                        ) : match.team1 && match.team2 ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min="0"
                              className="w-12 h-8 bg-gray-700 text-white text-center rounded"
                              value={match.score1 ?? ''}
                              onChange={e => handlePlayoffScoreChange(roundIdx, matchIdx, 'score1', Number(e.target.value))}
                              placeholder="0"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="0"
                              className="w-12 h-8 bg-gray-700 text-white text-center rounded"
                              value={match.score2 ?? ''}
                              onChange={e => handlePlayoffScoreChange(roundIdx, matchIdx, 'score2', Number(e.target.value))}
                              placeholder="0"
                            />
                          </div>
                        ) : (
                          <div className="text-gray-400 text-sm">Waiting for teams...</div>
                        )}
                      </div>
                      {/* Team 2 */}
                      <div className="flex flex-col items-center space-y-2 flex-1">
                        <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                          {match.team2?.logo ? (
                            <img src={match.team2.logo} alt={match.team2.name} className="w-12 h-12 object-contain" />
                          ) : (
                            <div className="text-2xl">🏆</div>
                          )}
                        </div>
                        <span className="text-white font-semibold text-sm text-center">
                          {match.team2?.name || "TBD"}
                        </span>
                      </div>
                    </div>
                    {/* Save Button or Winner Display */}
                    {!isCompleted && match.team1 && match.team2 ? (
                      <div className="text-center">
                        <button
                          onClick={() => handlePlayoffSaveScore(roundIdx, matchIdx)}
                          className="bg-green-500 hover:bg-green-600 text-black px-6 py-2 rounded-lg font-semibold transition-colors"
                          disabled={match.score1 === undefined || match.score2 === undefined || match.score1 === match.score2}
                        >
                          Save Match
                        </button>
                        {match.score1 === match.score2 && match.score1 !== undefined && (
                          <div className="text-yellow-400 text-sm mt-2">
                            Ties not allowed in knockout format
                          </div>
                        )}
                      </div>
                    ) : isCompleted && match.winner ? (
                      <div className="text-center">
                        <div className="text-green-400 font-semibold mb-2">
                          ✓ Match Completed
                        </div>
                        <div className="text-yellow-400 font-bold">
                          Winner: {match.winner.name}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        Waiting for previous round to complete...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <WeekStatistics
          currentWeek={currentWeek}
          currentWeekFixtures={currentWeekFixtures}
          fixtureScores={fixtureScores}
          getFixtureKey={getFixtureKey}
          isWeekCompleted={isWeekCompleted}
          totalWeeks={totalWeeks}
        />
        <TournamentOverview
          availableWeeks={availableWeeks}
          totalWeeks={totalWeeks}
          fixtures={fixtures}
          fixtureScores={fixtureScores}
          getFixtureKey={getFixtureKey}
          teams={teams}
        />
        {/* Championship Display */}
        {tournament.rounds.length > 0 && 
         tournament.rounds[tournament.rounds.length - 1]?.length === 1 && 
         tournament.rounds[tournament.rounds.length - 1][0]?.status === 'completed' && (
          <div className="mt-12 text-center bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg p-8">
            <Trophy className="w-20 h-20 text-black mx-auto mb-4" />
            <h3 className="text-4xl text-black font-bold mb-2">🏆 CHAMPION 🏆</h3>
            <h4 className="text-2xl text-black font-semibold">
              {tournament.rounds[tournament.rounds.length - 1][0].winner.name}
            </h4>
            <div className="text-black font-medium mt-2">
              Final Score: {tournament.rounds[tournament.rounds.length - 1][0].score1} - {tournament.rounds[tournament.rounds.length - 1][0].score2}
            </div>
          </div>
        )}
        {/* Playoff Statistics */}
        {tournament.rounds.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mt-8">
            <h4 className="text-lg font-semibold text-white mb-3">Playoff Statistics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {tournament.rounds.reduce((total: number, round: any[]) => 
                    total + round.filter((m: any) => m.status === 'completed').length, 0
                  )}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">
                  {tournament.rounds.reduce((total: number, round: any[]) => 
                    total + round.filter((m: any) => m.status !== 'completed' && m.team1 && m.team2).length, 0
                  )}
                </div>
                <div className="text-sm text-gray-400">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {tournament.rounds.reduce((total: number, round: any[]) => 
                    total + round.reduce((roundTotal: number, match: any) => 
                      roundTotal + (match.status === 'completed' ? (match.score1 + match.score2) : 0), 0
                    ), 0
                  )}
                </div>
                <div className="text-sm text-gray-400">Total Goals</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {tournament.rounds.length}
                </div>
                <div className="text-sm text-gray-400">Rounds</div>
              </div>
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl text-gray-400 mb-2">No playoff bracket generated yet</h3>
        <p className="text-gray-500">Pick number of teams and generate a bracket</p>
      </div>
    )}
  </div>
);

export default PlayoffBracket;