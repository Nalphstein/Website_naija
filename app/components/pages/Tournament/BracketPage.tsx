"use client";
import React, { useState } from "react";
import { Trophy } from "lucide-react";
import { Team } from "../../../services/teamservice";

interface Fixture {
  round: number;
  match: number;
  home: Team;
  away: Team;
}

import { updateTeam, getAllTeams } from '../../../services/teamservice';
import { saveFixtureScore, getFixtureScores } from '../../../services/fixtureService';

interface BracketPageProps {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  tournament: any;
  setTournament: (t: any) => void;
  generateBracket: () => void;
  setCurrentPage: (page: string) => void;
}

function generateDoubleRoundRobinFixtures(teams: Team[]): Fixture[] {
  // Berger tables algorithm
  const n = teams.length;
  if (n < 2) return [];
  const rounds = (n % 2 === 0 ? n - 1 : n);
  const fixtures: Fixture[] = [];
  const teamList = [...teams];
  if (n % 2 !== 0) teamList.push({ id: 'bye', name: 'BYE', logo: null, players: [], wins: 0, losses: 0, points: 0 });
  const numTeams = teamList.length;
  for (let round = 0; round < rounds * 2; round++) {
    for (let match = 0; match < numTeams / 2; match++) {
      const homeIdx = (round % 2 === 0) ? match : numTeams - 1 - match;
      const awayIdx = numTeams - 1 - match;
      const home = teamList[homeIdx];
      const away = teamList[awayIdx];
      if (
        home.id !== 'bye' &&
        away.id !== 'bye' &&
        home.id !== away.id // prevent team vs itself
      ) {
        if (round < rounds) {
          fixtures.push({ round: round + 1, match: match + 1, home, away });
        } else {
          fixtures.push({ round: round + 1, match: match + 1, home: away, away: home });
        }
      }
    }
    // rotate teams (except the first)
    teamList.splice(1, 0, teamList.pop()!);
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
  
  const fixtures: Fixture[] = generateDoubleRoundRobinFixtures(teams);
  const [fixtureScores, setFixtureScores] = useState<{ [key: string]: { homeScore: number; awayScore: number } }>({});

  // Load fixture scores from Firestore on mount
  React.useEffect(() => {
    const loadScores = async (): Promise<void> => {
      if (!tournament?.id) {
        setScoresLoaded(true);
        return;
      }
      
      try {
        const scores = await getFixtureScores(tournament.id);
        console.log("Loaded scores from Firebase:", scores);
        setFixtureScores(scores);
      } catch (error) {
        console.error("Error loading fixture scores:", error);
        // Optionally show error to user
      } finally {
        setScoresLoaded(true);
      }
    };
    
    loadScores();
  }, [tournament?.id]);
  
  // Show loading state while scores are being fetched
  if (!scoresLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading fixture scores...</div>
      </div>
    );
  }

  function handleScoreChange(fixtureKey: string, side: 'home' | 'away', value: number) {
    setFixtureScores(prev => ({
      ...prev,
      [fixtureKey]: {
        homeScore: side === 'home' ? value : prev[fixtureKey]?.homeScore ?? 0,
        awayScore: side === 'away' ? value : prev[fixtureKey]?.awayScore ?? 0,
      },
    }));
  }

  async function handleSaveScore(fixtureKey: string): Promise<void> {
    if (isSaving) return; // Prevent multiple saves
    
    const fixture = fixtures.find(fx => getFixtureKey(fx) === fixtureKey);
    if (!fixture) return;
    
    const { home, away } = fixture;
    const score = fixtureScores[fixtureKey];
    if (score === undefined) return;
    
    // Validate scores
    if (score.homeScore === undefined || score.awayScore === undefined) {
      alert('Please enter both scores');
      return;
    }
    
    // Copy teams
    const updatedTeams = teams.map(team => ({ ...team }));
    const homeTeam = updatedTeams.find(t => t.id === home.id);
    const awayTeam = updatedTeams.find(t => t.id === away.id);
    if (!homeTeam || !awayTeam) return;
    
    // Update team stats based on match result
    if (score.homeScore > score.awayScore) {
      homeTeam.wins += 1;
      homeTeam.points += 3;
      awayTeam.losses += 1;
    } else if (score.awayScore > score.homeScore) {
      awayTeam.wins += 1;
      awayTeam.points += 3;
      homeTeam.losses += 1;
    } else {
      // Draw
      homeTeam.points += 1;
      awayTeam.points += 1;
    }
    
    // Persist to Firebase
    setIsSaving(true);
    try {
      console.log("Updating teams:", {
        homeId: homeTeam.id,
        homeTeam,
        awayId: awayTeam.id,
        awayTeam
      });
      
      // Save the fixture score to Firestore
      if (tournament?.id) {
        await saveFixtureScore({
          tournamentId: tournament.id,
          fixtureKey,
          homeScore: score.homeScore,
          awayScore: score.awayScore,
        });
      }
      
      // Update both teams in parallel
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
      
      // Refetch teams to ensure UI is in sync
      const fetchedTeams = await getAllTeams();
      setTeams(fetchedTeams);
      
      // Update local state
      setFixtureScores(prev => ({
        ...prev,
        [fixtureKey]: {
          homeScore: score.homeScore,
          awayScore: score.awayScore,
        },
      }));
      
      // Show success feedback
      // You could replace this with a toast notification
      console.log('Score saved successfully');
      
    } catch (error) {
      console.error("Error saving score:", error);
      alert('Failed to save score. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function getFixtureKey(fx: Fixture) {
    return `${fx.round}-${fx.match}-${fx.home.id}-${fx.away.id}`;
  }

  function getScore(fixtureKey: string): { homeScore: number | ''; awayScore: number | '' } {
    const score = fixtureScores[fixtureKey];
    if (!score) return { homeScore: '', awayScore: '' };
    return {
      homeScore: score.homeScore ?? '',
      awayScore: score.awayScore ?? ''
    };
  }

  function handleScoreInputBlur(fixtureKey: string) {
    // Could trigger save to backend here
  }

  // --- PLAYOFF BRACKET LOGIC ---
  function handlePlayoffScoreChange(roundIdx: number, matchIdx: number, side: 'score1' | 'score2', value: number) {
    setTournament((prev: any) => {
      if (!prev) return prev;
      const rounds = prev.rounds.map((r: any[]) => r.map((m: any) => ({ ...m })));
      const match = rounds[roundIdx][matchIdx];
      // Prevent editing if match is completed
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
        // If tie, do not advance (could add tie-breaker logic)
        if (winner) {
          match.status = 'completed';
          match.winner = winner;
        }
      }
      // If all matches in this round are completed and not last round, generate next round
      const currentRound = rounds[roundIdx];
      const allDone = currentRound.every((m: any) => m.status === 'completed');
      const isLastRound = rounds.length - 1 === roundIdx;
      if (allDone && isLastRound && currentRound.length > 1) {
        // Generate next round
        const winners = currentRound.map((m: any) => m.winner);
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
      return { ...prev, rounds };
    });
  }
  function handleGeneratePlayoffBracket() {
    if (playoffSize < 2 || playoffSize > teams.length) {
      setPlayoffError('Invalid number of playoff teams');
      return;
    }
    setPlayoffError(null);
    // Sort teams by points descending
    const sorted = [...teams].sort((a, b) => b.points - a.points);
    const qualified = sorted.slice(0, playoffSize);
    // Seed: 1 vs N, 2 vs N-1, etc.
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Tournament Bracket</h2>
          <div className="flex space-x-2 mt-2">
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'fixtures' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white'}`}
              onClick={() => setTab('fixtures')}
            >
              Regular Season Fixtures
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${tab === 'playoffs' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white'}`}
              onClick={() => setTab('playoffs')}
            >
              Playoffs
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
      <div>
        {tab === 'fixtures' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Regular Season Fixtures</h3>
            {fixtures.length === 0 ? (
              <div className="text-gray-400">Not enough teams to generate fixtures.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Round</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Match</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Home</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Away</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Home Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Away Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Save</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {fixtures.map((fx, i) => {
                      const fixtureKey = getFixtureKey(fx);
                      const score = getScore(fixtureKey);
                      return (
                        <tr key={i}>
                          <td className="px-6 py-4">{fx.round}</td>
                          <td className="px-6 py-4">{fx.match}</td>
                          <td className="px-6 py-4 text-white font-semibold">{fx.home.name}</td>
                          <td className="px-6 py-4 text-white font-semibold">{fx.away.name}</td>
                          <td className="px-2 py-4">
                            <input
                              type="number"
                              min={0}
                              className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
                              value={score.homeScore !== undefined ? score.homeScore : ''}
                              onChange={e => handleScoreChange(fixtureKey, 'home', Number(e.target.value))}
                              onBlur={() => handleScoreInputBlur(fixtureKey)}
                              aria-label={`Home score for ${fx.home.name} vs ${fx.away.name}`}
                              title={`Home score for ${fx.home.name} vs ${fx.away.name}`}
                              placeholder="Home"
                            />
                          </td>
                          <td className="px-2 py-4">
                            <input
                              type="number"
                              min={0}
                              className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
                              value={score.awayScore !== undefined ? score.awayScore : ''}
                              onChange={e => handleScoreChange(fixtureKey, 'away', Number(e.target.value))}
                              onBlur={() => handleScoreInputBlur(fixtureKey)}
                              aria-label={`Away score for ${fx.home.name} vs ${fx.away.name}`}
                              title={`Away score for ${fx.home.name} vs ${fx.away.name}`}
                              placeholder="Away"
                            />
                          </td>
                          <td className="px-2 py-4">
                            <button
                              className={`px-3 py-1 rounded transition-colors ${
                                isSaving 
                                  ? 'bg-gray-500 cursor-not-allowed' 
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white`}
                              onClick={() => handleSaveScore(fixtureKey)}
                              disabled={isSaving}
                            >
                              {isSaving ? 'Saving...' : 'Save'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {tab === 'playoffs' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">Playoff Bracket (Knockout Format)</h3>
            <div className="flex items-center space-x-4 mb-4">
              <label htmlFor="playoff-size" className="text-gray-300 font-medium">Number of playoff teams:</label>
              <select
                id="playoff-size"
                className="bg-gray-700 text-white px-3 py-2 rounded-lg"
                value={playoffSize}
                onChange={e => setPlayoffSize(Number(e.target.value))}
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
                    <h4 className="text-lg font-bold text-green-400 mb-2">Round {roundIdx + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {round.map((match: any, matchIdx: number) => {
                        const matchKey = `${roundIdx}-${matchIdx}`;
                        return (
                          <div key={matchIdx} className="bg-gray-700 rounded-lg p-4 flex flex-col items-center">
                            <div className="flex justify-between w-full mb-2">
                              <span className="text-white font-semibold">{match.team1?.name || "TBD"}</span>
                              <span className="text-gray-400">vs</span>
                              <span className="text-white font-semibold">{match.team2?.name || "TBD"}</span>
                            </div>
                            {match.team1 && match.team2 && (
                              <div className="flex items-center space-x-2 mt-2">
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
                                  value={match.score1 ?? ''}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    handlePlayoffScoreChange(roundIdx, matchIdx, 'score1', val);
                                  }}
                                  aria-label={`Score for ${match.team1?.name || 'TBD'}`}
                                  title={`Score for ${match.team1?.name || 'TBD'}`}
                                  placeholder="Score"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                  type="number"
                                  min={0}
                                  className="w-16 bg-gray-800 text-white rounded px-2 py-1 text-center"
                                  value={match.score2 ?? ''}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    handlePlayoffScoreChange(roundIdx, matchIdx, 'score2', val);
                                  }}
                                  aria-label={`Score for ${match.team2?.name || 'TBD'}`}
                                  title={`Score for ${match.team2?.name || 'TBD'}`}
                                  placeholder="Score"
                                />
                                <button
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                                  onClick={() => handlePlayoffSaveScore(roundIdx, matchIdx)}
                                  disabled={match.score1 === undefined || match.score2 === undefined || match.status === 'completed'}
                                >
                                  Save
                                </button>
                              </div>
                            )}
                            {match.status === 'completed' && match.winner && (
                              <div className="mt-2 text-green-400 font-bold">Winner: {match.winner.name}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Show champion if last round has only one match and completed */}
                {tournament.rounds.length > 0 && tournament.rounds[tournament.rounds.length - 1].length === 1 && tournament.rounds[tournament.rounds.length - 1][0].status === 'completed' && (
                  <div className="mt-8 text-center">
                    <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-3xl text-yellow-400 font-bold">Champion: {tournament.rounds[tournament.rounds.length - 1][0].winner.name}</h3>
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
        )}
      </div>
    </div>
  );
};

export default BracketPage;


