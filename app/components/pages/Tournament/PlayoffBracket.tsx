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
  setPlayoffSize: (size: number) => void;
  // New handlers for double elimination
  handleDoubleEliminationScoreChange?: (matchId: string, side: 'score1' | 'score2', value: number) => void;
  handleDoubleEliminationSaveScore?: (matchId: string) => void;
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
  fixtures,
  setPlayoffSize,
  handleDoubleEliminationScoreChange,
  handleDoubleEliminationSaveScore
}) => {
  
  // Function to render a match card with enhanced status display
  const renderMatchCard = (match: any, roundName: string, bracketType: string) => {
    const isCompleted = match.status === 'completed';
    const isBye = match.team2 === null && match.team1 !== null;
    const isWaiting = match.team1 === null || match.team2 === null;
    
    const borderColor = bracketType === 'upper' ? 'border-blue-500' : 
                       bracketType === 'lower' ? 'border-red-500' : 'border-yellow-500';
    const bgGradient = bracketType === 'upper' ? 'from-blue-900/20 to-blue-800/20' : 
                      bracketType === 'lower' ? 'from-red-900/20 to-red-800/20' : 
                      'from-yellow-900/20 to-yellow-800/20';
    
    return (
      <div key={match.id} className={`bg-gray-800 bg-gradient-to-br ${bgGradient} rounded-lg p-4 border-2 ${borderColor} transition-all hover:shadow-lg`}>
        {/* Match Header */}
        <div className="text-center mb-3">
          <div className={`font-semibold text-sm ${
            bracketType === 'upper' ? 'text-blue-400' : 
            bracketType === 'lower' ? 'text-red-400' : 'text-yellow-400'
          }`}>
            {roundName}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {bracketType === 'upper' ? '🔼 UPPER BRACKET' : 
             bracketType === 'lower' ? '🔻 LOWER BRACKET' : '👑 FINALS'}
          </div>
          {match.waitingForUpperRound && (
            <div className="text-xs text-orange-400 mt-1">
              ⏳ Waiting for Upper Round {match.waitingForUpperRound}
            </div>
          )}
        </div>
        
        {/* Special handling for bye matches */}
        {isBye ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
              {match.team1?.logo ? (
                <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
              ) : (
                <div className="text-lg">🏆</div>
              )}
            </div>
            <div className="text-white font-medium text-sm">{match.team1?.name}</div>
            <div className="text-green-400 text-xs mt-2 font-semibold">
              ✓ BYE - Advances Automatically
            </div>
          </div>
        ) : (
          <>
            {/* Teams Display */}
            <div className="flex items-center justify-between mb-4">
              {/* Team 1 */}
              <div className="flex flex-col items-center space-y-2 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  match.team1 ? 'bg-gray-700' : 'bg-gray-600 border-2 border-dashed border-gray-500'
                }`}>
                  {match.team1?.logo ? (
                    <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
                  ) : match.team1 ? (
                    <div className="text-lg">🏆</div>
                  ) : (
                    <div className="text-gray-500 text-xs">TBD</div>
                  )}
                </div>
                <span className={`font-medium text-xs text-center ${
                  match.team1 ? 'text-white' : 'text-gray-500'
                }`}>
                  {match.team1?.name || "TBD"}
                </span>
                {isCompleted && match.winner?.id === match.team1?.id && (
                  <div className="text-green-400 text-xs font-bold">✓ WINNER</div>
                )}
              </div>
              
              {/* VS and Score */}
              <div className="flex flex-col items-center space-y-2 px-3">
                <span className="text-gray-400 text-xs">VS</span>
                {isCompleted ? (
                  <div className="text-lg font-bold text-white">
                    {match.score1} - {match.score2}
                  </div>
                ) : match.team1 && match.team2 ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min="0"
                      className="w-10 h-6 bg-gray-700 text-white text-center rounded text-xs"
                      value={match.score1 ?? ''}
                      onChange={e => handleDoubleEliminationScoreChange?.(match.id, 'score1', Number(e.target.value))}
                      placeholder="0"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input
                      type="number"
                      min="0"
                      className="w-10 h-6 bg-gray-700 text-white text-center rounded text-xs"
                      value={match.score2 ?? ''}
                      onChange={e => handleDoubleEliminationScoreChange?.(match.id, 'score2', Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400 text-xs">
                    {isWaiting ? '⏳ Waiting...' : 'Ready'}
                  </div>
                )}
              </div>
              
              {/* Team 2 */}
              <div className="flex flex-col items-center space-y-2 flex-1">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  match.team2 ? 'bg-gray-700' : 'bg-gray-600 border-2 border-dashed border-gray-500'
                }`}>
                  {match.team2?.logo ? (
                    <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 object-contain" />
                  ) : match.team2 ? (
                    <div className="text-lg">🏆</div>
                  ) : (
                    <div className="text-gray-500 text-xs">TBD</div>
                  )}
                </div>
                <span className={`font-medium text-xs text-center ${
                  match.team2 ? 'text-white' : 'text-gray-500'
                }`}>
                  {match.team2?.name || "TBD"}
                </span>
                {isCompleted && match.winner?.id === match.team2?.id && (
                  <div className="text-green-400 text-xs font-bold">✓ WINNER</div>
                )}
              </div>
            </div>
            
            {/* Save Button or Status Display */}
            {!isCompleted && match.team1 && match.team2 ? (
              <div className="text-center">
                <button
                  onClick={() => handleDoubleEliminationSaveScore?.(match.id)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded text-xs font-semibold transition-colors"
                  disabled={match.score1 === undefined || match.score2 === undefined || match.score1 === match.score2}
                >
                  Save Match
                </button>
                {match.score1 === match.score2 && match.score1 !== undefined && (
                  <div className="text-yellow-400 text-xs mt-1">
                    Ties not allowed
                  </div>
                )}
              </div>
            ) : isCompleted && match.winner ? (
              <div className="text-center">
                <div className="text-green-400 font-semibold text-xs mb-1">
                  ✓ Match Completed
                </div>
                <div className="text-yellow-400 font-bold text-xs">
                  Winner: {match.winner.name}
                </div>
                {bracketType === 'upper' && match.loser && (
                  <div className="text-red-400 text-xs mt-1">
                    {match.loser.name} → Lower Bracket
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 text-xs">
                {isWaiting ? 'Waiting for previous matches...' : 'Ready to play'}
              </div>
            )}
          </>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-4">🏆 Double Elimination Playoff Bracket</h3>
      
      {/* Playoff Configuration */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="playoff-size" className="text-gray-300 font-medium">Teams in Playoffs:</label>
            <select
              id="playoff-size"
              className="bg-gray-700 text-white px-3 py-2 rounded-lg"
              value={playoffSize}
              onChange={e => setPlayoffSize(Number(e.target.value))}
            >
              {Array.from({ length: teams.length - 1 }, (_, i) => i + 2).map(num => (
                <option key={num} value={num}>{num} teams</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={handleGeneratePlayoffBracket}
            className="bg-green-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-green-500 transition-colors"
            disabled={teams.length < 2}
          >
            Generate Bracket
          </button>
          
          <button
            onClick={handleResetPlayoffBracket}
            className="bg-red-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-red-500 transition-colors"
          >
            Reset Bracket
          </button>
        </div>
        
        {playoffError && <div className="text-red-400 text-sm">{playoffError}</div>}
        
        {/* Tournament Info */}
        {tournament?.metadata && (
          <div className="text-sm text-gray-300 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-900/30 p-3 rounded border border-blue-500">
              <div className="text-blue-400 font-semibold">🔼 Upper Bracket</div>
              <div>Top {tournament.metadata.upperBracketTeams} teams</div>
            </div>
            <div className="bg-red-900/30 p-3 rounded border border-red-500">
              <div className="text-red-400 font-semibold">🔻 Lower Bracket</div>
              <div>{tournament.metadata.lowerBracketTeams} teams start here</div>
            </div>
            <div className="bg-yellow-900/30 p-3 rounded border border-yellow-500">
              <div className="text-yellow-400 font-semibold">👑 Finals</div>
              <div>Double elimination format</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Double Elimination Bracket Display */}
      {tournament?.bracketType === 'double-elimination' ? (
        <div className="space-y-8">
          {/* Upper Bracket */}
          {tournament.upperBracket && (
            <div className="bg-blue-900/10 p-6 rounded-lg border border-blue-500">
              <h4 className="text-xl font-bold text-blue-400 mb-4 flex items-center">
                🔼 Upper Bracket
                <span className="text-sm text-gray-400 ml-2">(Losers go to Lower Bracket)</span>
              </h4>
              <div className="space-y-6">
                {tournament.upperBracket.map((round: any, roundIdx: number) => (
                  <div key={`upper-${roundIdx}`}>
                    <h5 className="text-lg font-semibold text-blue-300 mb-3">{round.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.matches.map((match: any) => renderMatchCard(match, round.name, 'upper'))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Lower Bracket */}
          {tournament.lowerBracket && (
            <div className="bg-red-900/10 p-6 rounded-lg border border-red-500">
              <h4 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                🔻 Lower Bracket
                <span className="text-sm text-gray-400 ml-2">(Elimination bracket)</span>
              </h4>
              <div className="space-y-6">
                {tournament.lowerBracket.map((round: any, roundIdx: number) => (
                  <div key={`lower-${roundIdx}`}>
                    <h5 className="text-lg font-semibold text-red-300 mb-3">{round.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {round.matches.map((match: any) => renderMatchCard(match, round.name, 'lower'))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Finals */}
          {tournament.finals && (
            <div className="bg-yellow-900/10 p-6 rounded-lg border border-yellow-500">
              <h4 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                👑 Grand Finals
                <span className="text-sm text-gray-400 ml-2">(Winner takes all)</span>
              </h4>
              <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
                {tournament.finals.matches.map((match: any) => renderMatchCard(match, tournament.finals.name, 'finals'))}
              </div>
            </div>
          )}
        </div>
      ) : tournament && tournament.rounds && tournament.rounds.length > 0 ? (
        // Fallback to old single-elimination display
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
                  return renderMatchCard({
                    ...match,
                    id: `old-${roundIdx}-${matchIdx}`,
                    onScoreChange: (id: string, side: string, value: number) => 
                      handlePlayoffScoreChange(roundIdx, matchIdx, side, value),
                    onSaveScore: (id: string) => handlePlayoffSaveScore(roundIdx, matchIdx)
                  }, `ROUND ${roundIdx + 1}`, 'upper');
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400 mb-4">No playoff bracket generated yet.</div>
          <div className="text-sm text-gray-500">
            Select the number of teams and click "Generate Bracket" to create a double elimination tournament.
          </div>
        </div>
      )}
      
      {/* Statistics at the bottom */}
      {tournament && (
        <div className="mt-8">
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
        </div>
      )}
    </div>
  );
};

export default PlayoffBracket;