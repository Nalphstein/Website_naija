"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Calendar, Users } from "lucide-react";
import { Team } from "../../../services/teamservice";
import { updateTeam, getAllTeams } from '../../../services/teamservice';
import { saveFixtureScore, getFixtureScores } from '../../../services/fixtureService';
import WeekNavigation from "./WeekNavigation";
import FixtureList from "./FixtureList";
import WeekStatistics from "./WeekStatistics";
import TournamentOverview from "./TournamentOverview";
import PlayoffBracket from "./PlayoffBracket";

interface Fixture {
  round: number;
  match: number;
  home: Team;
  away: Team;
  week: number;
}

interface BracketPageProps {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  tournament: any;
  setTournament: (t: any) => void;
  generateBracket: () => void;
  setCurrentPage: (page: string) => void;
}

function generateWeeklyDoubleRoundRobinFixtures(teams: Team[]): Fixture[] {
  const n = teams.length;
  if (n < 2) return [];
  
  const fixtures: Fixture[] = [];
  const teamList = [...teams];
  
  // Add bye team if odd number of teams
  if (n % 2 !== 0) {
    teamList.push({ 
      id: 'bye', 
      name: 'BYE', 
      logo: null, 
      players: [], 
      wins: 0, 
      losses: 0, 
      points: 0 
    });
  }
  
  const numTeams = teamList.length;
  const rounds = numTeams - 1; // Each team plays every other team once per round
  const matchesPerRound = numTeams / 2;
  
  // Generate first round robin (teams face each other once)
  for (let round = 0; round < rounds; round++) {
    const week = round + 1;
    
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = match;
      const awayIdx = numTeams - 1 - match;
      const home = teamList[homeIdx];
      const away = teamList[awayIdx];
      
      if (home.id !== 'bye' && away.id !== 'bye' && home.id !== away.id) {
        fixtures.push({ 
          round: round + 1, 
          match: match + 1, 
          home, 
          away, 
          week 
        });
      }
    }
    
    // Rotate teams (except the first)
    teamList.splice(1, 0, teamList.pop()!);
  }
  
  // Reset team positions for second round robin
  const resetTeamList = [...teams];
  if (n % 2 !== 0) {
    resetTeamList.push({ 
      id: 'bye', 
      name: 'BYE', 
      logo: null, 
      players: [], 
      wins: 0, 
      losses: 0, 
      points: 0 
    });
  }
  
  // Generate second round robin (teams face each other again, with reversed home/away)
  for (let round = 0; round < rounds; round++) {
    const week = rounds + round + 1; // Start after first round robin
    
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = match;
      const awayIdx = numTeams - 1 - match;
      const home = resetTeamList[awayIdx]; // Reversed from first round robin
      const away = resetTeamList[homeIdx]; // Reversed from first round robin
      
      if (home.id !== 'bye' && away.id !== 'bye' && home.id !== away.id) {
        fixtures.push({ 
          round: rounds + round + 1, 
          match: match + 1, 
          home, 
          away, 
          week 
        });
      }
    }
    
    // Rotate teams (except the first)
    resetTeamList.splice(1, 0, resetTeamList.pop()!);
  }
  
  return fixtures;
}

const BracketPage: React.FC<BracketPageProps> = ({ 
  teams, 
  setTeams, 
  tournament, 
  setTournament, 
  generateBracket, 
  setCurrentPage 
}) => {
  const [tab, setTab] = useState<'fixtures' | 'playoffs'>('fixtures');
  const [playoffSize, setPlayoffSize] = useState<number>(Math.min(teams.length, 8));
  const [playoffError, setPlayoffError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scoresLoaded, setScoresLoaded] = useState<boolean>(false);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  
  const fixtures: Fixture[] = generateWeeklyDoubleRoundRobinFixtures(teams);
  const [fixtureScores, setFixtureScores] = useState<{ [key: string]: { homeScore: number; awayScore: number; completed?: boolean } }>({});

  // Load fixture scores from Firestore on mount with real-time updates
  useEffect(() => {
    const loadScores = async (): Promise<void> => {
      if (!tournament?.id) {
        setScoresLoaded(true);
        return;
      }
      
      try {
        const scores = await getFixtureScores(tournament.id);
        console.log("Loaded scores from Firebase:", scores);
        
        // Mark loaded scores as completed and determine current week
        const scoresWithCompletion = Object.keys(scores).reduce((acc, key) => {
          acc[key] = {
            ...scores[key],
            completed: true // Existing scores are considered completed
          };
          return acc;
        }, {} as typeof fixtureScores);
        
        setFixtureScores(scoresWithCompletion);
        
        // Auto-advance to the appropriate week based on completed matches
        const completedFixtureKeys = Object.keys(scoresWithCompletion);
        if (completedFixtureKeys.length > 0) {
          // Find the latest week with incomplete matches, or advance to next week
          for (let week = 1; week <= totalWeeks; week++) {
            const weekFixtures = fixtures.filter(f => f.week === week);
            const weekCompleted = weekFixtures.every(fixture => 
              scoresWithCompletion[getFixtureKey(fixture)]?.completed
            );
            
            if (!weekCompleted) {
              setCurrentWeek(week);
              break;
            } else if (week === totalWeeks) {
              // All weeks completed, stay on last week
              setCurrentWeek(week);
            } else if (week < totalWeeks) {
              // This week is completed, check if next week should be available
              setCurrentWeek(week + 1);
            }
          }
        }
        
      } catch (error) {
        console.error("Error loading fixture scores:", error);
        // Show user-friendly error
        alert("Failed to load tournament data. Please refresh the page.");
      } finally {
        setScoresLoaded(true);
      }
    };
    
    loadScores();
  }, [tournament?.id, fixtures.length]);
  
  // Show loading state while scores are being fetched
  if (!scoresLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading fixture scores...</div>
      </div>
    );
  }

  // Get total weeks from fixtures
  const totalWeeks = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.week)) : 1;
  
  // Get fixtures for current week
  const currentWeekFixtures = fixtures.filter(f => f.week === currentWeek);
  
  // Check if a week is completed
  const isWeekCompleted = (week: number) => {
    const weekFixtures = fixtures.filter(f => f.week === week);
    return weekFixtures.length > 0 && weekFixtures.every(fixture => {
      const key = getFixtureKey(fixture);
      return fixtureScores[key]?.completed || false;
    });
  };

  // Get available weeks (current and completed weeks)
  const getAvailableWeeks = () => {
    const weeks = [];
    for (let i = 1; i <= totalWeeks; i++) {
      if (i === 1 || isWeekCompleted(i - 1)) {
        weeks.push(i);
      } else {
        break;
      }
    }
    return weeks;
  };

  function getFixtureKey(fx: Fixture) {
    return `${fx.round}-${fx.match}-${fx.home.id}-${fx.away.id}`;
  }

  function handleScoreChange(fixtureKey: string, side: 'home' | 'away', value: number) {
    setFixtureScores(prev => ({
      ...prev,
      [fixtureKey]: {
        homeScore: side === 'home' ? value : prev[fixtureKey]?.homeScore ?? 0,
        awayScore: side === 'away' ? value : prev[fixtureKey]?.awayScore ?? 0,
        completed: false,
      },
    }));
  }

  // Enhanced save with optimistic updates and error recovery
  async function handleSaveScore(fixtureKey: string): Promise<void> {
    if (isSaving) return;
    
    const fixture = fixtures.find(fx => getFixtureKey(fx) === fixtureKey);
    if (!fixture) return;
    
    const { home, away } = fixture;
    const score = fixtureScores[fixtureKey];
    if (score === undefined) return;
    
    if (score.homeScore === undefined || score.awayScore === undefined) {
      alert('Please enter both scores');
      return;
    }

    // Validate scores are non-negative
    if (score.homeScore < 0 || score.awayScore < 0) {
      alert('Scores cannot be negative');
      return;
    }
    
    // Store original state for rollback
    const originalTeams = teams.map(team => ({ ...team }));
    const originalFixtureScores = { ...fixtureScores };
    
    // Optimistic update - show completed state immediately
    setFixtureScores(prev => ({
      ...prev,
      [fixtureKey]: {
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        completed: true,
      },
    }));
    
    // Calculate team updates
    const updatedTeams = teams.map(team => ({ ...team }));
    const homeTeam = updatedTeams.find(t => t.id === home.id);
    const awayTeam = updatedTeams.find(t => t.id === away.id);
    if (!homeTeam || !awayTeam) return;
    
    // Store original team stats for potential rollback
    const originalHomeStats = { wins: homeTeam.wins, losses: homeTeam.losses, points: homeTeam.points };
    const originalAwayStats = { wins: awayTeam.wins, losses: awayTeam.losses, points: awayTeam.points };
    
    if (score.homeScore > score.awayScore) {
      homeTeam.wins += 1;
      homeTeam.points += 3;
      awayTeam.losses += 1;
    } else if (score.awayScore > score.homeScore) {
      awayTeam.wins += 1;
      awayTeam.points += 3;
      homeTeam.losses += 1;
    } else {
      homeTeam.points += 1;
      awayTeam.points += 1;
    }
    
    setIsSaving(true);
    try {
      // Save to Firebase with retries
      const maxRetries = 3;
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          // Save fixture score
          if (tournament?.id) {
            await saveFixtureScore({
              tournamentId: tournament.id,
              fixtureKey,
              homeScore: score.homeScore,
              awayScore: score.awayScore,
            });
          }
          
          // Update teams in parallel
          await Promise.all([
            updateTeam(homeTeam.id, {
              wins: homeTeam.wins,
              losses: homeTeam.losses,
              points: homeTeam.points,
            }),
            updateTeam(awayTeam.id, {
              wins: awayTeam.wins,
              losses: awayTeam.losses,
              points: awayTeam.points,
            }),
          ]);
          
          // Refresh teams from Firebase to ensure consistency
          const fetchedTeams = await getAllTeams();
          setTeams(fetchedTeams);
          
          console.log('Score saved successfully');
          
          // Show success feedback (you can replace with toast)
          const weekCompleted = isWeekCompleted(fixture.week);
          if (weekCompleted && fixture.week < totalWeeks) {
            // Week completed notification
            setTimeout(() => {
              alert(`Week ${fixture.week} completed! Week ${fixture.week + 1} is now available.`);
            }, 500);
          }
          
          break; // Success, exit retry loop
          
        } catch (retryError) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw retryError; // Re-throw after max retries
          }
          console.warn(`Save attempt ${retryCount} failed, retrying...`, retryError);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      }
      
    } catch (error) {
      console.error("Error saving score:", error);
      
      // Rollback optimistic updates on failure
      setTeams(originalTeams);
      setFixtureScores(originalFixtureScores);
      
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save score: ${errorMessage}. Please check your connection and try again.`);
      
    } finally {
      setIsSaving(false);
    }
  }

  function getScore(fixtureKey: string): { homeScore: number | ''; awayScore: number | '' } {
    const score = fixtureScores[fixtureKey];
    if (!score) return { homeScore: '', awayScore: '' };
    return {
      homeScore: score.homeScore ?? '',
      awayScore: score.awayScore ?? ''
    };
  }

  // Playoff functions with enhanced UI
  function getPlayoffMatchKey(roundIdx: number, matchIdx: number) {
    return `playoff-${roundIdx}-${matchIdx}`;
  }

  function handlePlayoffScoreChange(roundIdx: number, matchIdx: number, side: 'score1' | 'score2', value: number) {
    setTournament((prev: any) => {
      if (!prev) return prev;
      const rounds = prev.rounds.map((r: any[]) => r.map((m: any) => ({ ...m })));
      const match = rounds[roundIdx][matchIdx];
      if (match.status === 'completed') return prev;
      rounds[roundIdx][matchIdx][side] = value;
      return { ...prev, rounds };
    });
  }

  function handlePlayoffSaveScore(roundIdx: number, matchIdx: number) {
    setTournament((prev: any) => {
      if (!prev) return prev;
      const rounds = prev.rounds.map((r: any[]) => r.map((m: any) => ({ ...m })));
      const match = rounds[roundIdx][matchIdx];
      
      if (typeof match.score1 === 'number' && typeof match.score2 === 'number' && match.status !== 'completed') {
        let winner = null;
        if (match.score1 > match.score2) winner = match.team1;
        else if (match.score2 > match.score1) winner = match.team2;
        
        if (winner) {
          match.status = 'completed';
          match.winner = winner;
        }
      }
      
      const currentRound = rounds[roundIdx];
      const allDone = currentRound.every((m: any) => m.status === 'completed');
      const isLastRound = rounds.length - 1 === roundIdx;
      
      if (allDone && !isLastRound) {
        // Generate next round if current round is complete and it's not the final
        const winners = currentRound.map((m: any) => m.winner);
        if (winners.length > 1) {
          const nextRound: any[] = [];
          for (let i = 0; i < winners.length / 2; i++) {
            nextRound.push({
              team1: winners[i * 2],
              team2: winners[i * 2 + 1],
              status: 'pending',
              winner: null,
              score1: 0,
              score2: 0,
            });
          }
          rounds.push(nextRound);
        }
      }
      
      return { ...prev, rounds };
    });
  }

  function handleGeneratePlayoffBracket() {
    if (playoffSize < 2 || playoffSize > teams.length) {
      setPlayoffError('Invalid number of playoff teams');
      return;
    }
    setPlayoffError(null);
    const sorted = [...teams].sort((a, b) => b.points - a.points);
    const qualified = sorted.slice(0, playoffSize);
    const matches = [];
    for (let i = 0; i < playoffSize / 2; i++) {
      matches.push({
        team1: qualified[i],
        team2: qualified[playoffSize - 1 - i],
        status: 'pending',
        winner: null,
        score1: 0,
        score2: 0,
      });
    }
    setTournament({
      id: 'playoffs',
      teams: qualified,
      rounds: [matches],
      status: 'active',
      createdAt: new Date().toISOString(),
    });
  }

  function handleResetPlayoffBracket() {
    setTournament(null);
  }

  const availableWeeks = getAvailableWeeks();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">Tournament Bracket</h2>
            <div className="flex space-x-2">
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  tab === 'fixtures' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                onClick={() => setTab('fixtures')}
              >
                <Calendar className="w-5 h-5" />
                <span>Regular Season Fixtures</span>
              </button>
              <button
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  tab === 'playoffs' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                onClick={() => setTab('playoffs')}
              >
                <Trophy className="w-5 h-5" />
                <span>Playoffs</span>
              </button>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('home')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>

        {tab === 'fixtures' && (
          <div>
            {fixtures.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <div className="text-gray-400">Not enough teams to generate fixtures.</div>
              </div>
            ) : (
              <>
                {/* Replace the old week navigation UI with: */}
                <WeekNavigation
                  totalWeeks={totalWeeks}
                  availableWeeks={availableWeeks}
                  currentWeek={currentWeek}
                  setCurrentWeek={setCurrentWeek}
                  isWeekCompleted={isWeekCompleted}
                />
                {/* Current Week Matches */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentWeekFixtures.map((fixture) => {
                    const fixtureKey = getFixtureKey(fixture);
                    const score = getScore(fixtureKey);
                    const isCompleted = fixtureScores[fixtureKey]?.completed || false;

                    return (
                      <div key={fixtureKey} className="bg-gray-800 rounded-lg p-6 border border-purple-500">
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
                                  onChange={(e) => handleScoreChange(fixtureKey, 'home', Number(e.target.value))}
                                  placeholder="0"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-12 h-8 bg-gray-700 text-white text-center rounded"
                                  value={score.awayScore}
                                  onChange={(e) => handleScoreChange(fixtureKey, 'away', Number(e.target.value))}
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
                              onClick={() => handleSaveScore(fixtureKey)}
                              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                                isSaving 
                                  ? 'bg-gray-500 cursor-not-allowed text-white' 
                                  : 'bg-green-500 hover:bg-green-600 text-black'
                              }`}
                              disabled={isSaving || score.homeScore === '' || score.awayScore === ''}
                            >
                              {isSaving ? 'Saving...' : 'Save Match'}
                            </button>
                          </div>
                        )}

                        {isCompleted && (
                          <div className="text-center text-green-400 font-semibold">
                            ✓ Match Completed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enhanced Week Progress with Statistics */}
                <div className="mt-8 space-y-4">
                  <div className="text-center">
                    <div className="text-gray-400">
                      Week {currentWeek} Progress: {currentWeekFixtures.filter(f => fixtureScores[getFixtureKey(f)]?.completed).length} / {currentWeekFixtures.length} matches completed
                    </div>
                    {isWeekCompleted(currentWeek) && currentWeek < totalWeeks && (
                      <div className="mt-2 text-green-400 font-semibold">
                        Week {currentWeek} completed! Week {currentWeek + 1} is now available.
                      </div>
                    )}
                  </div>

                  {/* Current Week Statistics */}
                  {currentWeekFixtures.length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Week {currentWeek} Statistics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-400">
                            {currentWeekFixtures.filter(f => fixtureScores[getFixtureKey(f)]?.completed).length}
                          </div>
                          <div className="text-sm text-gray-400">Completed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-400">
                            {currentWeekFixtures.filter(f => !fixtureScores[getFixtureKey(f)]?.completed).length}
                          </div>
                          <div className="text-sm text-gray-400">Remaining</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-400">
                            {currentWeekFixtures.reduce((total, f) => {
                              const score = fixtureScores[getFixtureKey(f)];
                              return total + (score?.completed ? (score.homeScore + score.awayScore) : 0);
                            }, 0)}
                          </div>
                          <div className="text-sm text-gray-400">Total Goals</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-400">
                            {Math.round((currentWeekFixtures.filter(f => fixtureScores[getFixtureKey(f)]?.completed).length / currentWeekFixtures.length) * 100)}%
                          </div>
                          <div className="text-sm text-gray-400">Complete</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tournament Overview */}
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
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'playoffs' && (
          <PlayoffBracket
            tournament={tournament}
            playoffSize={playoffSize}
            teams={teams}
            playoffError={playoffError}
            handleGeneratePlayoffBracket={handleGeneratePlayoffBracket}
            handleResetPlayoffBracket={handleResetPlayoffBracket}
            getPlayoffMatchKey={getPlayoffMatchKey}
            handlePlayoffScoreChange={handlePlayoffScoreChange}
            handlePlayoffSaveScore={handlePlayoffSaveScore}
            currentWeek={currentWeek}
            currentWeekFixtures={currentWeekFixtures}
            fixtureScores={fixtureScores}
            getFixtureKey={getFixtureKey}
            isWeekCompleted={isWeekCompleted}
            totalWeeks={totalWeeks}
            availableWeeks={availableWeeks}
            fixtures={fixtures}
          />
        )}
      </div>
    </div>
  );
};

export default BracketPage;