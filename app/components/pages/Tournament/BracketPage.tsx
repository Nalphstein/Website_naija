"use client";
import React, { useState, useEffect } from "react";
import { Trophy, Calendar, Users } from "lucide-react";
import { Team } from "../../../services/teamservice";
import { updateTeam, getAllTeams } from '../../../services/teamservice';
import { getFixtureScores, saveFixtureScore } from '../../../services/fixtureService';
// REMOVE localStorage imports - we'll use only Firebase
import { getTournament, updateTournament } from '../../../services/tournamentService';
import WeekNavigation from "./WeekNavigation";
import FixtureList from "./FixtureList";
import WeekStatistics from "./WeekStatistics";
import TournamentOverview from "./TournamentOverview";

import PlayoffBracket from "./PlayoffBracket";

import { toast } from 'react-toastify';

// Firebase imports
import { db } from '../../../../lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

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
  // Initialize fixtureScores with empty objects for each fixture
  const [fixtureScores, setFixtureScores] = useState<{ [key: string]: { homeScore: number; awayScore: number; completed?: boolean } }>(() => {
    // Create an initial state with empty scores for all fixtures
    const initialScores: { [key: string]: { homeScore: number; awayScore: number; completed?: boolean } } = {};
    fixtures.forEach(fixture => {
      const key = `${fixture.round}-${fixture.match}-${fixture.home.id}-${fixture.away.id}`;
      initialScores[key] = { homeScore: 0, awayScore: 0, completed: false };
    });
    return initialScores;
  });
  
  const totalWeeks = fixtures.length > 0 ? Math.max(...fixtures.map(f => f.week)) : 1;

  // MODIFIED: Load tournament data and fixture scores from Firebase only
  // Function to check for duplicate team IDs in fixtures
  const checkForDuplicateTeamIds = () => {
    const teamIds = teams.map(team => team.id);
    const duplicateIds = teamIds.filter((id, index) => teamIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      console.error('[DEBUG] DUPLICATE TEAM IDs DETECTED:', duplicateIds);
      toast.error('Duplicate team IDs detected. This may cause issues with saving scores.');
      return true;
    }
    
    console.log('[DEBUG] No duplicate team IDs found. All team IDs:', teamIds);
    return false;
  };
  
 // Enhanced useEffect to load both regular and playoff tournament data
 useEffect(() => { 
   const loadTournamentData = async (): Promise<void> => { 
     console.log('[BracketPage] Loading tournament data...'); 
     
     try { 
       toast.info('Loading tournament data...', { autoClose: 2000 }); 
       
       // Check for duplicate team IDs 
       checkForDuplicateTeamIds(); 
       
       // PRIORITY 1: Check for playoff tournament first
       let tournamentData = null;
       let tournamentSource = 'none';
       
       try {
         const playoffTournament = await getTournament('playoffs');
         if (playoffTournament) {
           console.log('[BracketPage] ✅ Found playoff tournament in Firebase:', playoffTournament);
           tournamentData = playoffTournament;
           tournamentSource = 'playoffs';
           
           // Set the tournament immediately to restore playoff bracket
           setTournament(playoffTournament);
           toast.success('Playoff bracket loaded from Firebase!', { autoClose: 3000 });
         }
       } catch (playoffError) {
         console.log('[BracketPage] No playoff tournament found:', playoffError);
       }
       
       // PRIORITY 2: If no playoff tournament, try regular tournament
       if (!tournamentData && tournament?.id) { 
         try { 
           tournamentData = await getTournament(tournament.id); 
           console.log('[BracketPage] Loaded regular tournament from Firebase:', tournamentData);
           tournamentSource = 'regular';
         } catch (tournamentError) { 
           console.warn('[BracketPage] Could not load regular tournament:', tournamentError); 
         } 
       }
       
       console.log(`[BracketPage] Tournament source: ${tournamentSource}`);
       
       // Load fixture scores - NO tournament dependency 
       console.log('[BracketPage] Loading fixture scores (tournament-independent)...'); 
       const scores = await getFixtureScores(); // No tournament ID required! 
       console.log('[BracketPage] Loaded scores from Firebase:', scores);
        
       // Mark loaded scores as completed 
       const scoresWithCompletion = Object.keys(scores).reduce((acc, key) => { 
         acc[key] = { 
           ...scores[key], 
           completed: true 
         }; 
         return acc; 
       }, {} as typeof fixtureScores); 
       
       setFixtureScores(scoresWithCompletion); 
       console.log("[BracketPage] Fixture scores loaded:", scoresWithCompletion); 
       
       // Calculate current week from completed matches 
       let weekToSet = 1; 
       if (tournamentData?.currentWeek) { 
         weekToSet = tournamentData.currentWeek; 
       } else { 
         // Calculate from completed matches 
         if (Object.keys(scoresWithCompletion).length > 0) { 
           for (let week = 1; week <= totalWeeks; week++) { 
             const weekFixtures = fixtures.filter(f => f.week === week); 
             const weekCompleted = weekFixtures.every(fixture => 
               scoresWithCompletion[getFixtureKey(fixture)]?.completed 
             ); 
             
             if (!weekCompleted) { 
               weekToSet = week; 
               break; 
             } else if (week < totalWeeks) { 
               weekToSet = week + 1; 
             } 
           } 
         } 
       } 
       
       setCurrentWeek(weekToSet); 
       
       toast.success('Tournament data loaded successfully!', { autoClose: 3000 });
        
      } catch (error) {
        console.error("Error loading tournament data:", error);
        toast.error("Failed to load tournament data. Please refresh the page.", { 
          autoClose: 5000,
          position: "top-center"
        });
      } finally {
        setScoresLoaded(true);
      }
    };
    
    loadTournamentData();
  }, [fixtures.length, totalWeeks]); // Removed tournament?.id dependency
  
  // Additional useEffect to check for playoff tournament when switching to playoffs tab
  useEffect(() => {
    const loadPlayoffTournamentIfNeeded = async () => {
      // Only run when switching to playoffs tab and no tournament is loaded
      if (tab === 'playoffs' && !tournament) {
        console.log('[BracketPage] Switching to playoffs tab - checking for saved playoff tournament...');
        
        try {
          const playoffTournament = await getTournament('playoffs');
          if (playoffTournament) {
            console.log('[BracketPage] ✅ Found saved playoff tournament:', playoffTournament);
            setTournament(playoffTournament);
            toast.success('Playoff bracket restored from Firebase!', { autoClose: 3000 });
          } else {
            console.log('[BracketPage] No saved playoff tournament found');
          }
        } catch (error) {
          console.log('[BracketPage] Error checking for playoff tournament:', error);
        }
      }
    };
    
    loadPlayoffTournamentIfNeeded();
  }, [tab, tournament]); // Run when tab changes or tournament state changes
  
  // Show loading state while data is being fetched
  if (!scoresLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading tournament data...</div>
      </div>
    );
  }
  
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
    const key = `${fx.round}-${fx.match}-${fx.home.id}-${fx.away.id}`;
 
    return key;
  }

  function handleScoreChange(fixtureKey: string, side: 'home' | 'away', value: number) {
   
    
    // Find the fixture this key belongs to for debugging
    const fixture = fixtures.find(fx => getFixtureKey(fx) === fixtureKey);
    console.log(`[DEBUG] Fixture for key ${fixtureKey}:`, fixture);
    
    setFixtureScores(prev => {
      // Debug the previous state
      console.log(`[DEBUG] Previous fixtureScores state for this key:`, prev[fixtureKey]);
      
      // Ensure we have a default object if prev[fixtureKey] is undefined
      const currentScores = prev[fixtureKey] || { homeScore: 0, awayScore: 0, completed: false };
      
      const updated = {
        ...prev,
        [fixtureKey]: {
          homeScore: side === 'home' ? value : currentScores.homeScore,
          awayScore: side === 'away' ? value : currentScores.awayScore,
          completed: false,
        },
      };
      
      console.log(`[DEBUG] Updated score for fixture ${fixtureKey}:`, updated[fixtureKey]);
      console.log("[BracketPage] Fixture scores after change:", updated);
      return updated;
    });
  }

// FIXED: Enhanced save with proper Firebase updates 
 // 2. Update your handleSaveScore function 
 async function handleSaveScore(fixtureKey: string): Promise<void> { 
   if (isSaving) return; 
   
   console.log('[DEBUG] handleSaveScore called with fixtureKey:', fixtureKey); 
   
   const fixture = fixtures.find(fx => getFixtureKey(fx) === fixtureKey); 
   if (!fixture) { 
     console.log('[DEBUG] Fixture not found for key:', fixtureKey); 
     return; 
   } 
   
   const { home, away } = fixture; 
   const score = fixtureScores[fixtureKey]; 
   if (score === undefined) { 
     console.log('[DEBUG] No score found for fixture key:', fixtureKey); 
     return; 
   } 
   
   if (score.homeScore === undefined || score.awayScore === undefined) { 
     toast.error('Please enter both scores before saving', { autoClose: 3000 }); 
     return; 
   } 
 
   if (score.homeScore < 0 || score.awayScore < 0) { 
     toast.error('Scores cannot be negative', { autoClose: 3000 }); 
     return; 
   } 
   
   // Store original state for rollback 
   const originalTeams = teams.map(team => ({ ...team })); 
   const originalFixtureScores = { ...fixtureScores }; 
   
   const savingToastId = toast.loading('Saving match result...', { 
     position: "top-center" 
   }); 
   
   // Optimistic update 
   setFixtureScores(prev => ({ 
     ...prev, 
     [fixtureKey]: { 
       homeScore: score.homeScore, 
       awayScore: score.awayScore, 
       completed: true, 
     }, 
   })); 
   
   // Update team stats 
   const updatedTeams = teams.map(team => ({ ...team })); 
   const homeTeam = updatedTeams.find(t => t.id === home.id); 
   const awayTeam = updatedTeams.find(t => t.id === away.id); 
   
   if (!homeTeam || !awayTeam) { 
     console.log('[DEBUG] Could not find teams'); 
     return; 
   } 
   
   setIsSaving(true); 
   
   try { 
     // Calculate team updates 
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
     
     // Save fixture score - NO tournament ID required! 
     console.log('[DEBUG] Saving fixture score (tournament-independent):', { 
       fixtureKey, 
       homeScore: score.homeScore, 
       awayScore: score.awayScore, 
     }); 
     
     await saveFixtureScore({ 
       fixtureKey, 
       homeScore: score.homeScore, 
       awayScore: score.awayScore, 
       tournamentId: tournament?.id // Optional - for organization only 
     }); 
     
     console.log('[DEBUG] Fixture score saved successfully'); 
     
     // Update teams in Firebase 
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
     
     // Check if week is completed after this match 
     const weekFixtures = fixtures.filter(f => f.week === fixture.week); 
     const completedMatches = weekFixtures.filter(f => { 
       const key = getFixtureKey(f); 
       return key === fixtureKey || fixtureScores[key]?.completed; 
     }); 
     
     const weekCompleted = completedMatches.length === weekFixtures.length; 
     console.log('[DEBUG] Week completion check:', { 
       weekFixtures: weekFixtures.length, 
       completedMatches: completedMatches.length, 
       weekCompleted 
     }); 
     
     let newCurrentWeek = currentWeek; 
     
     if (weekCompleted && fixture.week < totalWeeks) { 
       newCurrentWeek = fixture.week + 1; 
       console.log('[DEBUG] Advancing to next week:', newCurrentWeek); 
       setCurrentWeek(newCurrentWeek); 
     } 
     
     // Update tournament data in Firebase with current week (if tournament exists) 
     if (tournament?.id) {
       const updatedTournament = { 
         ...tournament, 
         currentWeek: newCurrentWeek, 
         lastUpdated: new Date().toISOString() 
       }; 
       
       console.log('[DEBUG] Updating tournament data:', updatedTournament); 
       setTournament(updatedTournament); 
       await updateTournament(tournament.id, updatedTournament); 
     } else {
       console.log('[DEBUG] No tournament to update, continuing with local state only');
     }
     
     // Refresh teams from Firebase to ensure consistency 
     console.log('[DEBUG] Refreshing teams from Firebase'); 
     const fetchedTeams = await getAllTeams(); 
     setTeams(fetchedTeams); 
     
     // Update the loading toast to success 
     toast.update(savingToastId, { 
       render: `Match saved! ${home.name} ${score.homeScore} - ${score.awayScore} ${away.name}`, 
       type: "success", 
       isLoading: false, 
       autoClose: 3000, 
     }); 
     
   } catch (error) { 
     console.error("[DEBUG] Error saving to Firebase:", error); 
     
     // Rollback optimistic updates on failure 
     console.log('[DEBUG] Rolling back to original state'); 
     setTeams(originalTeams); 
     setFixtureScores(originalFixtureScores); 
     
     // Update the loading toast to error 
     const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'; 
     toast.update(savingToastId, { 
       render: `Failed to save: ${errorMessage}. Please try again.`, 
       type: "error", 
       isLoading: false, 
       autoClose: 5000, 
     }); 
     
   } finally { 
     console.log('[DEBUG] Save process finished, setting isSaving to false'); 
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

  // MODIFIED: Save playoff results to Firebase
  function handlePlayoffSaveScore(roundIdx: number, matchIdx: number) {
    setTournament((prev: any) => {
      if (!prev) return prev;
      const rounds = prev.rounds.map((r: any[]) => r.map((m: any) => ({ ...m })));
      const match = rounds[roundIdx][matchIdx];
      
      if (typeof match.score1 === 'number' && typeof match.score2 === 'number' && match.status !== 'completed') {
        let winner = null;
        if (match.score1 > match.score2) {
          winner = match.team1;
          toast.success(`${match.team1?.name} advances to the next round!`, { autoClose: 4000 });
        } else if (match.score2 > match.score1) {
          winner = match.team2;
          toast.success(`${match.team2?.name} advances to the next round!`, { autoClose: 4000 });
        }
        
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
          
          // Show round completion notification
          setTimeout(() => {
            toast.info(`Round ${roundIdx + 1} completed! Next round is ready.`, {
              autoClose: 4000,
              position: "top-center"
            });
          }, 500);
        }
      } else if (allDone && isLastRound) {
        // Tournament completed
        const champion = currentRound[0]?.winner;
        if (champion) {
          setTimeout(() => {
            toast.success(`🏆 Tournament Champion: ${champion.name}! 🏆`, {
              autoClose: 6000,
              position: "top-center",
            });
          }, 1000);
        }
      }
      
      const updatedTournament = { ...prev, rounds };
      
      // Save updated tournament to Firebase
      if (prev.id) {
        updateTournament(prev.id, updatedTournament).catch(error => {
          console.error('Error saving playoff tournament to Firebase:', error);
          toast.error('Failed to save playoff results. Please try again.', { autoClose: 3000 });
        });
      }
      
      return updatedTournament;
    });
  }

  // Enhanced Double Elimination Bracket Generator with proper team progression
  function generateDoubleEliminationBracket(teams: Team[], playoffSize: number) {
    console.log(`[Playoff] Generating double elimination bracket for ${playoffSize} teams`);
    
    // Sort teams by standings (points, then wins, then goal difference)
    const sorted = [...teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return (b.wins - b.losses) - (a.wins - a.losses); // Goal difference simulation
    });
    
    const qualified = sorted.slice(0, playoffSize);
    console.log('[Playoff] Qualified teams:', qualified.map(t => `${t.name} (${t.points}pts)`));
    
    // Calculate bracket structure - different logic for different team counts
    let upperBracketTeams, lowerBracketTeams;
    
    if (playoffSize <= 4) {
      // For 4 or fewer teams, all start in upper bracket
      upperBracketTeams = playoffSize;
      lowerBracketTeams = 0;
    } else {
      // For 5+ teams, some start in lower bracket
      upperBracketTeams = Math.min(4, Math.ceil(playoffSize * 0.8)); // Max 4 teams in upper
      lowerBracketTeams = playoffSize - upperBracketTeams;
    }
    
    console.log(`[Playoff] Upper bracket: ${upperBracketTeams} teams, Lower bracket: ${lowerBracketTeams} teams`);
    
    const upperTeams = qualified.slice(0, upperBracketTeams);
    const lowerStartingTeams = qualified.slice(upperBracketTeams);
    
    // Generate upper bracket rounds
    const upperBracket = generateUpperBracketRounds(upperTeams);
    
    // Generate lower bracket with proper progression slots
    const lowerBracket = generateLowerBracketRounds(lowerStartingTeams, upperBracket.length);
    
    // Generate finals structure
    const finals = generateFinalsStructure();
    
    return {
      upperBracket,
      lowerBracket,
      finals,
      metadata: {
        totalTeams: playoffSize,
        upperBracketTeams,
        lowerBracketTeams,
        qualified
      }
    };
  }
  
  function generateUpperBracketRounds(teams: Team[]) {
    const rounds = [];
    let currentTeams = [...teams];
    let roundNumber = 1;
    
    console.log(`[Playoff] Generating upper bracket for ${teams.length} teams`);
    
    // Generate matches until we have a winner
    while (currentTeams.length > 1) {
      const matches = [];
      
      // Determine round name: Always start with Round 1, then Finals
      let roundName;
      if (roundNumber === 1) {
        roundName = 'Upper Round 1';
      } else if (currentTeams.length === 2) {
        roundName = 'Upper Finals';
      } else {
        roundName = `Upper Round ${roundNumber}`;
      }
      
      console.log(`[Playoff] Creating ${roundName} with ${currentTeams.length} teams`);
      
      // Pair teams properly for first round: 1st vs 3rd, 2nd vs 4th
      if (roundNumber === 1 && currentTeams.length === 4) {
        // Special pairing for 4-team upper bracket: 1st vs 3rd, 2nd vs 4th
        console.log(`[Playoff] Applying user seeding: 1st vs 3rd, 2nd vs 4th`);
        console.log(`[Playoff] Teams order: 1st(${currentTeams[0]?.name}), 2nd(${currentTeams[1]?.name}), 3rd(${currentTeams[2]?.name}), 4th(${currentTeams[3]?.name})`);
        
        // Match 1: 1st vs 3rd
        matches.push({
          id: `upper-r${roundNumber}-m1`,
          team1: currentTeams[0], // 1st place
          team2: currentTeams[2], // 3rd place
          status: 'pending',
          winner: null,
          loser: null,
          score1: 0,
          score2: 0,
          roundName,
          bracketType: 'upper',
          dropLoserToLowerRound: roundNumber,
          matchDescription: `${currentTeams[0]?.name} (1st) vs ${currentTeams[2]?.name} (3rd)`
        });
        
        // Match 2: 2nd vs 4th
        matches.push({
          id: `upper-r${roundNumber}-m2`,
          team1: currentTeams[1], // 2nd place
          team2: currentTeams[3], // 4th place
          status: 'pending',
          winner: null,
          loser: null,
          score1: 0,
          score2: 0,
          roundName,
          bracketType: 'upper',
          dropLoserToLowerRound: roundNumber,
          matchDescription: `${currentTeams[1]?.name} (2nd) vs ${currentTeams[3]?.name} (4th)`
        });
        
        console.log(`[Playoff] ✅ Created matches with user seeding:`);
        console.log(`[Playoff] Match 1: ${currentTeams[0]?.name} (1st) vs ${currentTeams[2]?.name} (3rd)`);
        console.log(`[Playoff] Match 2: ${currentTeams[1]?.name} (2nd) vs ${currentTeams[3]?.name} (4th)`);
        
      } else {
        // For other rounds or team counts, use sequential pairing
        for (let i = 0; i < currentTeams.length; i += 2) {
          if (i + 1 < currentTeams.length) {
            matches.push({
              id: `upper-r${roundNumber}-m${Math.floor(i/2) + 1}`,
              team1: currentTeams[i],
              team2: currentTeams[i + 1],
              status: 'pending',
              winner: null,
              loser: null,
              score1: 0,
              score2: 0,
              roundName,
              bracketType: 'upper',
              dropLoserToLowerRound: roundNumber
            });
          }
        }
      }
      
      rounds.push({
        round: roundNumber,
        name: roundName,
        matches,
        bracketType: 'upper'
      });
      
      console.log(`[Playoff] Created ${roundName} with ${matches.length} matches`);
      
      // Prepare for next round (winners advance)
      currentTeams = new Array(Math.ceil(currentTeams.length / 2)).fill(null);
      roundNumber++;
    }
    
    console.log(`[Playoff] Generated ${rounds.length} upper bracket rounds:`, rounds.map(r => ({ round: r.round, name: r.name })));
    return rounds;
  }
  
  function generateLowerBracketRounds(initialTeams: Team[], upperRounds: number) {
    const rounds = [];
    let roundNumber = 1;
    
    console.log(`[Playoff] Generating lower bracket with ${initialTeams.length} initial teams and ${upperRounds} upper rounds`);
    
    // Lower bracket Round 1: Only if we have teams starting in lower bracket
    if (initialTeams.length > 0) {
      const matches = [];
      
      if (initialTeams.length === 1) {
        // Single team (5th place) gets a bye and waits for upper bracket loser
        // NO match created here - they wait in Round 2
        console.log(`[Playoff] ${initialTeams[0].name} (5th place) will wait in Lower Round 2 for upper bracket loser`);
      } else {
        // Multiple teams starting in lower bracket play each other
        for (let i = 0; i < initialTeams.length; i += 2) {
          if (i + 1 < initialTeams.length) {
            matches.push({
              id: `lower-r${roundNumber}-m${Math.floor(i/2) + 1}`,
              team1: initialTeams[i],
              team2: initialTeams[i + 1],
              status: 'pending',
              winner: null,
              loser: null,
              score1: 0,
              score2: 0,
              roundName: 'Lower Round 1',
              bracketType: 'lower'
            });
          }
        }
      }
      
      // Only create Round 1 if there are actual matches
      if (matches.length > 0) {
        rounds.push({
          round: roundNumber,
          name: 'Lower Round 1',
          matches,
          bracketType: 'lower'
        });
        console.log(`[Playoff] Created Lower Round 1 with ${matches.length} matches`);
        roundNumber++;
      }
    }
    
    // Lower bracket Round 2: 5th place team vs higher-ranked upper bracket loser
    const round2Name = `Lower Round ${roundNumber}`;
    const round2Matches = [{
      id: `lower-r${roundNumber}-integration-higher`,
      team1: initialTeams.length === 1 ? initialTeams[0] : null, // 5th place team if exists
      team2: null, // Will be filled by HIGHER-RANKED loser from upper bracket Round 1
      status: 'pending',
      winner: null,
      loser: null,
      score1: 0,
      score2: 0,
      roundName: round2Name,
      bracketType: 'lower',
      waitingForUpperRound: 1,
      waitingForHigherRankedLoser: true, // Flag to indicate this gets the higher-ranked loser
      description: initialTeams.length === 1 ? `${initialTeams[0].name} vs Higher-ranked Upper Bracket loser` : 'Waiting for teams'
    }];
    
    rounds.push({
      round: roundNumber,
      name: round2Name,
      matches: round2Matches,
      bracketType: 'lower',
      waitingForUpperRound: 1
    });
    console.log(`[Playoff] Created ${round2Name} - 5th place vs higher-ranked loser`);
    roundNumber++;
    
    // Lower bracket Round 3: Winner of Round 2 vs lower-ranked upper bracket loser
    const round3Name = `Lower Round ${roundNumber}`;
    const round3Matches = [{
      id: `lower-r${roundNumber}-integration-lower`,
      team1: null, // Will be filled by winner from Lower Round 2
      team2: null, // Will be filled by LOWER-RANKED loser from upper bracket Round 1
      status: 'pending',
      winner: null,
      loser: null,
      score1: 0,
      score2: 0,
      roundName: round3Name,
      bracketType: 'lower',
      waitingForUpperRound: 1,
      waitingForLowerRankedLoser: true, // Flag to indicate this gets the lower-ranked loser
      description: 'Winner of Lower Round 2 vs Lower-ranked Upper Bracket loser'
    }];
    
    rounds.push({
      round: roundNumber,
      name: round3Name,
      matches: round3Matches,
      bracketType: 'lower',
      waitingForUpperRound: 1
    });
    console.log(`[Playoff] Created ${round3Name} - Round 2 winner vs lower-ranked loser`);
    roundNumber++;
    
    // Additional rounds for subsequent upper bracket eliminations
    for (let upperRound = 2; upperRound <= upperRounds; upperRound++) {
      const isLastRound = upperRound === upperRounds;
      const roundName = isLastRound ? 'Lower Finals' : `Lower Round ${roundNumber}`;
      
      const matches = [{
        id: `lower-r${roundNumber}-integration-${upperRound}`,
        team1: null, // Will be filled by winner from previous lower round
        team2: null, // Will be filled by loser from upper bracket
        status: 'pending',
        winner: null,
        loser: null,
        score1: 0,
        score2: 0,
        roundName,
        bracketType: 'lower',
        waitingForUpperRound: upperRound,
        description: `Waiting for Upper Round ${upperRound} loser`
      }];
      
      rounds.push({
        round: roundNumber,
        name: roundName,
        matches,
        bracketType: 'lower',
        waitingForUpperRound: upperRound
      });
      
      console.log(`[Playoff] Created ${roundName} waiting for Upper Round ${upperRound}`);
      roundNumber++;
    }
    
    console.log(`[Playoff] Generated ${rounds.length} lower bracket rounds`);
    return rounds;
  }
  
  function generateFinalsStructure() {
    return {
      round: 1,
      name: 'Grand Finals',
      matches: [{
        id: 'grand-finals-1',
        team1: null, // Winner of upper bracket
        team2: null, // Winner of lower bracket
        status: 'pending',
        winner: null,
        loser: null,
        score1: 0,
        score2: 0,
        roundName: 'Grand Finals',
        bracketType: 'finals',
        // In double elimination, if lower bracket team wins, they play again
        resetBracket: false
      }],
      bracketType: 'finals'
    };
  }

  // Firebase save function for playoff tournaments - ENHANCED VERSION WITH UNDEFINED CLEANING
  async function savePlayoffTournament(tournamentData: any) {
    try {
      console.log('[Playoff] Saving tournament to Firebase:', tournamentData);
      
      // Helper function to recursively clean objects, removing undefined values
      function cleanObjectRecursively(obj: any): any {
        if (obj === null || obj === undefined) {
          return null;
        }
        
        if (typeof obj !== 'object') {
          return obj;
        }
        
        if (Array.isArray(obj)) {
          return obj
            .filter(item => item !== undefined) // Remove undefined items
            .map(item => cleanObjectRecursively(item));
        }
        
        const cleaned: any = {};
        
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined) {
            // Skip undefined values entirely
            console.log(`[Playoff] Skipping undefined value for key: ${key}`);
            continue;
          } else if (value === null) {
            cleaned[key] = null;
          } else {
            cleaned[key] = cleanObjectRecursively(value);
          }
        }
        
        return cleaned;
      }
      
      // Clean the tournament data to ensure it's serializable and has no undefined values
      const rawCleanData = {
        id: tournamentData.id,
        teams: tournamentData.teams,
        bracketType: tournamentData.bracketType,
        upperBracket: tournamentData.upperBracket,
        lowerBracket: tournamentData.lowerBracket,
        finals: tournamentData.finals,
        metadata: tournamentData.metadata,
        status: tournamentData.status,
        createdAt: tournamentData.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      console.log('[Playoff] Pre-cleaning data structure:', {
        upperBracketRounds: rawCleanData.upperBracket?.length,
        lowerBracketRounds: rawCleanData.lowerBracket?.length,
        finalsMatches: rawCleanData.finals?.matches?.length,
        teamsCount: rawCleanData.teams?.length
      });
      
      // Apply deep cleaning to remove any undefined values
      const cleanData = cleanObjectRecursively(rawCleanData);
      
      console.log('[Playoff] Post-cleaning data structure:', {
        upperBracketRounds: cleanData.upperBracket?.length,
        lowerBracketRounds: cleanData.lowerBracket?.length,
        finalsMatches: cleanData.finals?.matches?.length,
        teamsCount: cleanData.teams?.length
      });
      
      // Additional validation: check for any remaining undefined values
      try {
        const testSerialization = JSON.stringify(cleanData, (key, value) => {
          if (value === undefined) {
            console.error(`[Playoff] ❌ FOUND UNDEFINED VALUE at key: ${key}`);
            throw new Error(`Undefined value found at key: ${key}`);
          }
          return value;
        });
        console.log(`[Playoff] ✅ Data serialization test passed (${testSerialization.length} chars)`);
      } catch (error) {
        console.error(`[Playoff] ❌ Serialization failed:`, error);
        throw error;
      }
      
      // Use setDoc with merge: true to create/update the document
      const docRef = doc(db, 'tournaments', 'playoffs');
      await setDoc(docRef, cleanData, { merge: true });
      
      console.log('[Playoff] ✅ Successfully saved playoff tournament to Firebase');
      
      // Verify the save by reading it back
      const savedDoc = await getDoc(docRef);
      if (savedDoc.exists()) {
        console.log('[Playoff] ✅ Verified: Document exists in Firebase');
        const verificationData = savedDoc.data();
        console.log('[Playoff] Verification data structure:', {
          hasUpperBracket: !!verificationData.upperBracket,
          hasLowerBracket: !!verificationData.lowerBracket,
          hasFinals: !!verificationData.finals,
          bracketType: verificationData.bracketType
        });
      } else {
        throw new Error('Document was not saved properly');
      }
      
    } catch (error) {
      console.error('[Playoff] ❌ Error saving playoff tournament:', error);
      if (error instanceof Error) {
        console.error('[Playoff] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  // Enhanced score change handlers for double elimination
  function handleDoubleEliminationScoreChange(matchId: string, side: 'score1' | 'score2', value: number) {
    console.log(`[Playoff] Score change: ${matchId}, ${side} = ${value}`);
    
    setTournament(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      
      // Update in upper bracket
      if (updated.upperBracket) {
        updated.upperBracket = updated.upperBracket.map(round => ({
          ...round,
          matches: round.matches.map(match => 
            match.id === matchId ? { ...match, [side]: value } : match
          )
        }));
      }
      
      // Update in lower bracket
      if (updated.lowerBracket) {
        updated.lowerBracket = updated.lowerBracket.map(round => ({
          ...round,
          matches: round.matches.map(match => 
            match.id === matchId ? { ...match, [side]: value } : match
          )
        }));
      }
      
      // Update in finals
      if (updated.finals?.matches) {
        updated.finals.matches = updated.finals.matches.map(match => 
          match.id === matchId ? { ...match, [side]: value } : match
        );
      }
      
      return updated;
    });
  }
  
  function handleDoubleEliminationSaveScore(matchId: string) {
    console.log(`[Playoff] Saving score for match: ${matchId}`);
    
    setTournament(prev => {
      if (!prev) return prev;
      
      let matchToSave = null;
      let updatedTournament = { ...prev };
      let bracketType = '';
      let roundNumber = 0;
      
      // Find the match in all brackets and determine winner/loser
      const findAndCompleteMatch = (brackets: any[], type: string) => {
        return brackets.map(round => ({
          ...round,
          matches: round.matches.map(match => {
            if (match.id === matchId) {
              bracketType = type;
              roundNumber = round.round;
              
              // Determine winner and loser
              const winner = match.score1 > match.score2 ? match.team1 : match.team2;
              const loser = match.score1 > match.score2 ? match.team2 : match.team1;
              
              console.log(`[Playoff] 🔍 DETERMINING WINNER/LOSER:`);
              console.log(`[Playoff] Match ID: ${match.id}`);
              console.log(`[Playoff] Team1: ${match.team1?.name} (Score: ${match.score1})`);
              console.log(`[Playoff] Team2: ${match.team2?.name} (Score: ${match.score2})`);
              console.log(`[Playoff] Winner determined: ${winner?.name}`);
              console.log(`[Playoff] Loser determined: ${loser?.name}`);
              console.log(`[Playoff] Winner object:`, winner);
              console.log(`[Playoff] Loser object:`, loser);
              
              // Create the completed match with winner/loser - THIS is what we'll use for advancement
              const completedMatch = {
                ...match,
                status: 'completed',
                winner,
                loser
              };
              
              // Save the COMPLETED match for advancement logic
              matchToSave = completedMatch;
              
              return completedMatch;
            }
            return match;
          })
        }));
      };
      
      // Update match in appropriate bracket
      if (updatedTournament.upperBracket) {
        updatedTournament.upperBracket = findAndCompleteMatch(updatedTournament.upperBracket, 'upper');
      }
      
      if (updatedTournament.lowerBracket) {
        updatedTournament.lowerBracket = findAndCompleteMatch(updatedTournament.lowerBracket, 'lower');
      }
      
      if (updatedTournament.finals?.matches) {
        updatedTournament.finals.matches = updatedTournament.finals.matches.map(match => {
          if (match.id === matchId) {
            bracketType = 'finals';
            const winner = match.score1 > match.score2 ? match.team1 : match.team2;
            const loser = match.score1 > match.score2 ? match.team2 : match.team1;
            
            console.log(`[Playoff] 🔍 FINALS WINNER/LOSER:`);
            console.log(`[Playoff] Team1: ${match.team1?.name} (Score: ${match.score1})`);
            console.log(`[Playoff] Team2: ${match.team2?.name} (Score: ${match.score2})`);
            console.log(`[Playoff] Winner: ${winner?.name}`);
            console.log(`[Playoff] Winner object:`, winner);
            
            // Create completed match for finals
            const completedMatch = {
              ...match,
              status: 'completed',
              winner,
              loser
            };
            
            // Save the COMPLETED match
            matchToSave = completedMatch;
            
            return completedMatch;
          }
          return match;
        });
      }
      
      // Now handle automatic team progression
      if (matchToSave && bracketType) {
        console.log(`[Playoff] 🔍 *** MATCH COMPLETION PROCESSING ***`);
        console.log(`[Playoff] Processing match completion in ${bracketType} bracket, round ${roundNumber}`);
        console.log(`[Playoff] matchToSave:`, matchToSave);
        console.log(`[Playoff] Winner: ${matchToSave.winner?.name}, Loser: ${matchToSave.loser?.name}`);
        console.log(`[Playoff] Match status: ${matchToSave.status}`);
        console.log(`[Playoff] Is bye match: ${matchToSave.isByeMatch}`);
        
        // CRITICAL: Skip processing bye matches to prevent undefined advancement issues
        if (matchToSave.status === 'bye-completed' || matchToSave.isByeMatch) {
          console.log(`[Playoff] ⏭️ SKIPPING bye match processing - no advancement needed`);
          console.log(`[Playoff] Bye winner ${matchToSave.winner?.name} will advance when opponent is determined`);
          // Don't process bye matches through normal advancement logic
          // They will be handled when their next opponents are determined
        }
        // Only process REAL match completions (not bye matches)
        else {
          console.log(`[Playoff] Winner object:`, matchToSave.winner);
          console.log(`[Playoff] Loser object:`, matchToSave.loser);
          
          if (bracketType === 'upper') {
            // Winner advances in upper bracket, loser goes to lower bracket
            console.log(`[Playoff] *** UPPER BRACKET MATCH COMPLETED ***`);
            console.log(`[Playoff] Match: ${matchToSave.team1?.name} vs ${matchToSave.team2?.name}`);
            console.log(`[Playoff] Score: ${matchToSave.score1} - ${matchToSave.score2}`);
            console.log(`[Playoff] Winner: ${matchToSave.winner?.name}, Loser: ${matchToSave.loser?.name}`);
            console.log(`[Playoff] Round: ${roundNumber}`);
            console.log(`[Playoff] Tournament before upper advancement:`, {
              upperBracket: updatedTournament.upperBracket?.length,
              lowerBracket: updatedTournament.lowerBracket?.length
            });
            
            // CRITICAL: Apply the returned tournament state
            console.log(`[Playoff] 🔍 Step 1: Advancing winner in upper bracket...`);
            const tournamentAfterWinnerAdvancement = advanceWinnerInUpperBracket(updatedTournament, matchToSave, roundNumber);
            console.log(`[Playoff] 🔍 Step 2: Moving loser to lower bracket...`);
            const tournamentAfterLoserMovement = moveLoserToLowerBracket(tournamentAfterWinnerAdvancement, matchToSave, roundNumber);
            updatedTournament = tournamentAfterLoserMovement;
            
            console.log(`[Playoff] Tournament after upper advancement:`, {
              upperBracket: updatedTournament.upperBracket?.length,
              lowerBracket: updatedTournament.lowerBracket?.length
            });
            
          } else if (bracketType === 'lower') {
            // Winner advances in lower bracket, loser is eliminated
            console.log(`[Playoff] *** LOWER BRACKET MATCH COMPLETED ***`);
            console.log(`[Playoff] Match: ${matchToSave.team1?.name} vs ${matchToSave.team2?.name}`);
            console.log(`[Playoff] Score: ${matchToSave.score1} - ${matchToSave.score2}`);
            console.log(`[Playoff] Winner: ${matchToSave.winner?.name}, Loser: ${matchToSave.loser?.name}`);
            console.log(`[Playoff] Round: ${roundNumber}`);
            
            // CRITICAL: Check if this is Lower Finals specifically
            const currentLowerRound = updatedTournament.lowerBracket?.find(round => round.round === roundNumber);
            const isLowerFinals = currentLowerRound?.name === 'Lower Finals';
            const totalLowerRounds = updatedTournament.lowerBracket?.length || 0;
            const isLastLowerRound = roundNumber === totalLowerRounds;
            
            console.log(`[Playoff] 🔍 LOWER BRACKET ANALYSIS:`);
            console.log(`[Playoff] Current round name: ${currentLowerRound?.name}`);
            console.log(`[Playoff] Is Lower Finals: ${isLowerFinals}`);
            console.log(`[Playoff] Is last lower round: ${isLastLowerRound}`);
            console.log(`[Playoff] Round number: ${roundNumber}, Total rounds: ${totalLowerRounds}`);
            
            // DIRECT LOGIC: If this is Lower Finals, send winner straight to Grand Finals
            if (isLowerFinals || isLastLowerRound) {
              console.log(`[Playoff] 🏆 LOWER FINALS DETECTED - SENDING WINNER DIRECTLY TO GRAND FINALS!`);
              console.log(`[Playoff] Lower Finals champion: ${matchToSave.winner?.name}`);
              
              // Create winner copy for Grand Finals
              const lowerChampion = {
                id: matchToSave.winner.id,
                name: matchToSave.winner.name,
                logo: matchToSave.winner.logo,
                wins: matchToSave.winner.wins,
                losses: matchToSave.winner.losses,
                points: matchToSave.winner.points,
                goalsFor: matchToSave.winner.goalsFor,
                goalsAgainst: matchToSave.winner.goalsAgainst,
                goalDifference: matchToSave.winner.goalDifference
              };
              
              console.log(`[Playoff] 🔍 LOWER CHAMPION COPY:`, lowerChampion);
              
              // Place directly in Grand Finals
              const finals = { ...updatedTournament.finals };
              console.log(`[Playoff] 🔍 CURRENT GRAND FINALS BEFORE LOWER PLACEMENT:`, finals.matches[0]);
              
              // CRITICAL: Lower Champion should go to team2 slot (Upper Champion gets team1)
              if (finals.matches[0].team2 === null) {
                finals.matches[0] = { ...finals.matches[0], team2: lowerChampion };
                console.log(`[Playoff] ✅ PLACED Lower Champion ${lowerChampion.name} as team2 in Grand Finals`);
                console.log(`[Playoff] 🔍 UPDATED GRAND FINALS:`, finals.matches[0]);
              } else {
                console.error(`[Playoff] ❌ ERROR: Grand Finals team2 slot already filled!`);
                console.error(`[Playoff] Current team2:`, finals.matches[0].team2);
                console.error(`[Playoff] Trying to place:`, lowerChampion);
                
                // Check if both slots have the same team (duplication bug)
                if (finals.matches[0].team1?.id === finals.matches[0].team2?.id) {
                  console.error(`[Playoff] ❌ CRITICAL BUG: Same team in both Grand Finals slots!`);
                  console.error(`[Playoff] team1:`, finals.matches[0].team1);
                  console.error(`[Playoff] team2:`, finals.matches[0].team2);
                  
                  // Fix: Clear team2 and place Lower Champion
                  finals.matches[0] = { ...finals.matches[0], team2: lowerChampion };
                  console.log(`[Playoff] 🔧 FIXED: Replaced duplicate team2 with Lower Champion ${lowerChampion.name}`);
                  console.log(`[Playoff] 🔍 CORRECTED GRAND FINALS:`, finals.matches[0]);
                }
              }
              
              // Update tournament with new finals
              updatedTournament = { ...updatedTournament, finals };
              
            } else {
              // Regular lower bracket advancement (not finals)
              console.log(`[Playoff] Tournament before lower advancement:`, {
                lowerBracket: updatedTournament.lowerBracket?.length,
                finals: updatedTournament.finals?.matches?.[0]
              });
              
              // CRITICAL: Apply the returned tournament state
              console.log(`[Playoff] 🔍 Step 1: Advancing winner in lower bracket...`);
              const tournamentAfterAdvancement = advanceWinnerInLowerBracket(updatedTournament, matchToSave, roundNumber);
              updatedTournament = tournamentAfterAdvancement;
              
              console.log(`[Playoff] Tournament after lower advancement:`, {
                lowerBracket: updatedTournament.lowerBracket?.length,
                finals: updatedTournament.finals?.matches?.[0]
              });
            }
            
          } else if (bracketType === 'finals') {
            // Tournament complete or reset bracket
            console.log(`[Playoff] *** FINALS COMPLETED ***`);
            console.log(`[Playoff] Tournament completed! Champion: ${matchToSave.winner?.name}`);
          }
        }
        
        // Additional check: Process any automatic advancements after each match
        const { tournament: processedTournament, hasChanges } = processAutoAdvancements(updatedTournament);
        if (hasChanges) {
          console.log('[Playoff] Processed additional automatic advancements after match completion');
          updatedTournament = processedTournament;
        }
        
        // CRITICAL: Check for completed bye matches that need advancement after opponent placement
        updatedTournament = processCompletedByeAdvancements(updatedTournament);
      }
      
      // Save to Firebase
      if (matchToSave) {
        savePlayoffTournament(updatedTournament).catch(error => {
          console.error('Error saving playoff match:', error);
          toast.error('Failed to save match result. Please try again.', { autoClose: 3000 });
        });
        
        const resultMessage = bracketType === 'finals' 
          ? `🏆 CHAMPION: ${matchToSave.winner?.name}! Final: ${matchToSave.score1}-${matchToSave.score2}`
          : `Match result saved: ${matchToSave.score1} - ${matchToSave.score2}. ${matchToSave.winner?.name} advances!`;
        
        toast.success(resultMessage, { autoClose: 4000 });
      }
      
      return updatedTournament;
    });
  }
  
  // Function to advance winner in upper bracket - ENHANCED WITH DEBUGGING TO PREVENT UNDEFINED TEAMS
  function advanceWinnerInUpperBracket(tournament: any, completedMatch: any, fromRound: number) {
    const nextRound = fromRound + 1;
    let upperBracket = [...tournament.upperBracket];
    
    console.log(`[Playoff] *** UPPER BRACKET ADVANCEMENT ***`);
    console.log(`[Playoff] 🔍 INPUT VALIDATION:`);
    console.log(`[Playoff] completedMatch:`, completedMatch);
    console.log(`[Playoff] completedMatch.winner:`, completedMatch.winner);
    console.log(`[Playoff] completedMatch.winner?.name:`, completedMatch.winner?.name);
    console.log(`[Playoff] fromRound:`, fromRound);
    console.log(`[Playoff] nextRound:`, nextRound);
    
    // CRITICAL: Validate that we have a winner
    if (!completedMatch.winner) {
      console.error(`[Playoff] ❌ CRITICAL ERROR: No winner found in completedMatch!`);
      console.error(`[Playoff] completedMatch:`, completedMatch);
      return tournament; // Return unchanged if no winner
    }
    
    console.log(`[Playoff] Advancing ${completedMatch.winner?.name} from Upper Round ${fromRound} to Round ${nextRound}`);
    console.log(`[Playoff] Current upper bracket structure:`, upperBracket.map(r => ({ 
      round: r.round, 
      name: r.name, 
      matches: r.matches.map(m => ({ 
        id: m.id, 
        team1: m.team1?.name || 'NULL', 
        team2: m.team2?.name || 'NULL',
        status: m.status 
      }))
    })));
    
    // Find next round in upper bracket
    const nextRoundIndex = upperBracket.findIndex(round => round.round === nextRound);
    console.log(`[Playoff] Looking for Upper Round ${nextRound}, found at index: ${nextRoundIndex}`);
    
    if (nextRoundIndex !== -1) {
      // Place winner in next upper bracket match
      const targetRound = { ...upperBracket[nextRoundIndex] };
      let targetMatches = [...targetRound.matches];
      
      console.log(`[Playoff] Target upper round matches before update:`, targetMatches.map(m => ({ 
        id: m.id, 
        team1: m.team1?.name || 'NULL', 
        team2: m.team2?.name || 'NULL' 
      })));
      
      // CRITICAL: Create a deep copy of the winner to prevent reference issues
      const winnerCopy = {
        id: completedMatch.winner.id,
        name: completedMatch.winner.name,
        logo: completedMatch.winner.logo,
        wins: completedMatch.winner.wins,
        losses: completedMatch.winner.losses,
        points: completedMatch.winner.points,
        goalsFor: completedMatch.winner.goalsFor,
        goalsAgainst: completedMatch.winner.goalsAgainst,
        goalDifference: completedMatch.winner.goalDifference
      };
      
      console.log(`[Playoff] 🔍 WINNER COPY CREATED:`, winnerCopy);
      
      // Find the appropriate match slot (based on seeding)
      let placed = false;
      for (let i = 0; i < targetMatches.length; i++) {
        const match = targetMatches[i];
        if (match.team1 === null) {
          // Place winner as team1
          targetMatches[i] = { 
            ...match, 
            team1: winnerCopy
          };
          placed = true;
          console.log(`[Playoff] ✅ PLACED ${winnerCopy.name} as team1 in upper match ${match.id}`);
          console.log(`[Playoff] 🔍 UPDATED MATCH:`, targetMatches[i]);
          break;
        } else if (match.team2 === null) {
          // Place winner as team2
          targetMatches[i] = { 
            ...match, 
            team2: winnerCopy
          };
          placed = true;
          console.log(`[Playoff] ✅ PLACED ${winnerCopy.name} as team2 in upper match ${match.id}`);
          console.log(`[Playoff] 🔍 UPDATED MATCH:`, targetMatches[i]);
          break;
        }
      }
      
      if (!placed) {
        console.error(`[Playoff] ❌ FAILED TO PLACE ${completedMatch.winner?.name} in Upper Round ${nextRound} - no empty slots`);
        return tournament; // Return unchanged if placement fails
      }
      
      upperBracket[nextRoundIndex] = {
        ...targetRound,
        matches: targetMatches
      };
      
      console.log(`[Playoff] ✅ SUCCESSFULLY advanced ${completedMatch.winner?.name} to Upper Round ${nextRound} (${targetRound.name})`);
      console.log(`[Playoff] Updated upper round:`, upperBracket[nextRoundIndex].matches.map(m => ({ 
        id: m.id, 
        team1: m.team1?.name || 'NULL', 
        team2: m.team2?.name || 'NULL' 
      })));
      
      return { ...tournament, upperBracket };
      
    } else {
      // ONLY finals winners should go to grand finals, not round 1 winners
      const currentRoundName = upperBracket.find(r => r.round === fromRound)?.name || `Round ${fromRound}`;
      
      if (currentRoundName === 'Upper Finals') {
        // This is the finals winner - advance to grand finals
        console.log(`[Playoff] Upper Finals winner ${completedMatch.winner?.name} advancing to Grand Finals`);
        
        // CRITICAL: Create a deep copy of the winner to prevent reference issues
        const upperChampion = {
          id: completedMatch.winner.id,
          name: completedMatch.winner.name,
          logo: completedMatch.winner.logo,
          wins: completedMatch.winner.wins,
          losses: completedMatch.winner.losses,
          points: completedMatch.winner.points,
          goalsFor: completedMatch.winner.goalsFor,
          goalsAgainst: completedMatch.winner.goalsAgainst,
          goalDifference: completedMatch.winner.goalDifference
        };
        
        console.log(`[Playoff] 🔍 UPPER CHAMPION COPY:`, upperChampion);
        
        const finals = { ...tournament.finals };
        console.log(`[Playoff] 🔍 CURRENT GRAND FINALS BEFORE UPPER PLACEMENT:`, finals.matches[0]);
        
        // CRITICAL: Always place Upper Champion as team1 (they earned the advantage)
        if (finals.matches[0].team1 === null) {
          finals.matches[0] = { ...finals.matches[0], team1: upperChampion };
          console.log(`[Playoff] ✅ Advanced Upper Champion ${upperChampion.name} to Grand Finals as team1`);
          console.log(`[Playoff] 🔍 UPDATED GRAND FINALS:`, finals.matches[0]);
        } else {
          console.error(`[Playoff] ❌ ERROR: Grand Finals team1 slot already filled!`);
          console.error(`[Playoff] Current team1:`, finals.matches[0].team1);
          console.error(`[Playoff] Trying to place:`, upperChampion);
        }
        
        return { ...tournament, upperBracket, finals };
      } else {
        // This is NOT a finals match - should not go directly to grand finals
        console.error(`[Playoff] ❌ ERROR: ${completedMatch.winner?.name} from ${currentRoundName} should NOT go directly to Grand Finals!`);
        console.error(`[Playoff] Current round: ${currentRoundName}, From round: ${fromRound}`);
        console.error(`[Playoff] Available upper rounds:`, upperBracket.map(r => ({ round: r.round, name: r.name })));
        
        // Return unchanged tournament to prevent incorrect advancement
        return tournament;
      }
    }
  }
  
  // Function to move loser to lower bracket - ENHANCED WITH PROPER RANKING PROGRESSION
  function moveLoserToLowerBracket(tournament: any, completedMatch: any, fromUpperRound: number) {
    const lowerBracket = [...tournament.lowerBracket];
    const qualified = tournament.metadata.qualified;
    
    console.log(`[Playoff] Moving ${completedMatch.loser?.name} from Upper Round ${fromUpperRound} to Lower Bracket`);
    
    // Determine the ranking of the losing team
    const loserRanking = qualified.findIndex(team => team.id === completedMatch.loser?.id) + 1;
    console.log(`[Playoff] ${completedMatch.loser?.name} was ranked #${loserRanking} in regular season`);
    
    if (fromUpperRound === 1) {
      // Upper bracket Round 1 losers need special handling based on ranking
      // RULE: Lower-ranked teams face 5th place first, higher-ranked teams wait
      
      // Find all Upper Round 1 matches that are completed
      const upperRound1 = tournament.upperBracket.find(round => round.round === 1);
      const completedMatches = upperRound1?.matches.filter(m => m.status === 'completed') || [];
      
      console.log(`[Playoff] Found ${completedMatches.length} completed Upper Round 1 matches`);
      console.log(`[Playoff] 🔍 RANKING LOGIC: Lower-ranked teams face 5th place first`);
      
      // Get all losers and their rankings
      const allLosers = completedMatches.map(m => m.loser).filter(Boolean);
      const loserRankings = allLosers.map(loser => ({
        team: loser,
        ranking: qualified.findIndex(team => team.id === loser.id) + 1
      }));
      
      // Sort by ranking (ascending - lower numbers = higher rank)
      loserRankings.sort((a, b) => a.ranking - b.ranking);
      
      console.log(`[Playoff] All losers by ranking:`, loserRankings.map(l => `${l.team.name}(#${l.ranking})`));
      
      // ENHANCED LOGIC: Progressive placement based on elimination order
      if (completedMatches.length === 1) {
        // First loser gets placed based on their ranking
        console.log(`[Playoff] First loser: ${completedMatch.loser?.name} (Rank #${loserRanking})`);
        
        // CRITICAL: Lower-ranked teams (3rd, 4th) face 5th place immediately
        // Higher-ranked teams (1st, 2nd) wait for later rounds
        if (loserRanking >= 3) {
          // 3rd or 4th place loser - faces 5th place in Round 2
          console.log(`[Playoff] 🔄 Lower-ranked team (Rank #${loserRanking}) faces 5th place first`);
          const round2Index = lowerBracket.findIndex(round => 
            round.matches.some(m => m.waitingForHigherRankedLoser || m.team1?.name === qualified[4]?.name)
          );
          
          if (round2Index !== -1) {
            const round2 = { ...lowerBracket[round2Index] };
            const matches = round2.matches.map(match => {
              if (match.team2 === null && (match.waitingForHigherRankedLoser || match.team1?.name === qualified[4]?.name)) {
                console.log(`[Playoff] ✅ Placing ${completedMatch.loser?.name} vs 5th place in Lower Round 2`);
                return { ...match, team2: completedMatch.loser };
              }
              return match;
            });
            lowerBracket[round2Index] = { ...round2, matches };
          }
        } else {
          // 1st or 2nd place loser - waits for Round 3 (faces winner of Round 2)
          console.log(`[Playoff] 🚀 Higher-ranked team (Rank #${loserRanking}) waits for Round 3`);
          // Will be placed when second match completes
        }
        
      } else if (completedMatches.length === 2) {
        // Both matches completed - place remaining losers correctly
        console.log(`[Playoff] Both upper matches completed - finalizing lower bracket placement`);
        
        // CRITICAL: Ensure proper ordering - lowest rank faces 5th first
        const lowestRankedLoser = loserRankings[loserRankings.length - 1]?.team; // Highest ranking number = lowest rank
        const highestRankedLoser = loserRankings[0]?.team; // Lowest ranking number = highest rank
        
        console.log(`[Playoff] Lowest ranked loser: ${lowestRankedLoser?.name} (faces 5th place)`);
        console.log(`[Playoff] Highest ranked loser: ${highestRankedLoser?.name} (waits for Round 3)`);
        
        // Place lowest-ranked loser vs 5th place in Round 2
        const round2Index = lowerBracket.findIndex(round => 
          round.matches.some(m => m.waitingForHigherRankedLoser || m.team1?.name === qualified[4]?.name)
        );
        
        if (round2Index !== -1) {
          const round2 = { ...lowerBracket[round2Index] };
          const matches = round2.matches.map(match => {
            if (match.team2 === null && (match.waitingForHigherRankedLoser || match.team1?.name === qualified[4]?.name)) {
              console.log(`[Playoff] ✅ Placing lowest-ranked loser ${lowestRankedLoser?.name} vs 5th place`);
              return { ...match, team2: lowestRankedLoser };
            }
            return match;
          });
          lowerBracket[round2Index] = { ...round2, matches };
        }
        
        // Place highest-ranked loser in Round 3 (faces winner of Round 2)
        const round3Index = lowerBracket.findIndex(round => 
          round.matches.some(m => m.waitingForLowerRankedLoser)
        );
        
        if (round3Index !== -1) {
          const round3 = { ...lowerBracket[round3Index] };
          const matches = round3.matches.map(match => {
            if (match.waitingForLowerRankedLoser && match.team2 === null) {
              console.log(`[Playoff] ✅ Placing highest-ranked loser ${highestRankedLoser?.name} in Round 3`);
              return { ...match, team2: highestRankedLoser };
            }
            return match;
          });
          lowerBracket[round3Index] = { ...round3, matches };
        }
      }
    } else {
      // For losers from later upper bracket rounds, use the existing logic
      const targetRoundIndex = lowerBracket.findIndex(round => 
        round.waitingForUpperRound === fromUpperRound
      );
      
      if (targetRoundIndex !== -1) {
        const targetRound = { ...lowerBracket[targetRoundIndex] };
        const matches = targetRound.matches.map(match => {
          if (match.team2 === null) {
            console.log(`[Playoff] Placing ${completedMatch.loser?.name} in ${targetRound.name}`);
            return { ...match, team2: completedMatch.loser };
          }
          return match;
        });
        lowerBracket[targetRoundIndex] = { ...targetRound, matches };
      }
    }
    
    return { ...tournament, lowerBracket };
  }
  
  // Function to advance winner in lower bracket - ENHANCED WITH DEBUGGING TO PREVENT UNDEFINED TEAMS
  function advanceWinnerInLowerBracket(tournament: any, completedMatch: any, fromRound: number) {
    const nextRound = fromRound + 1;
    let lowerBracket = [...tournament.lowerBracket];
    
    console.log(`[Playoff] *** LOWER BRACKET ADVANCEMENT ***`);
    console.log(`[Playoff] 🔍 INPUT VALIDATION:`);
    console.log(`[Playoff] completedMatch:`, completedMatch);
    console.log(`[Playoff] completedMatch.winner:`, completedMatch.winner);
    console.log(`[Playoff] completedMatch.winner?.name:`, completedMatch.winner?.name);
    console.log(`[Playoff] fromRound:`, fromRound);
    console.log(`[Playoff] nextRound:`, nextRound);
    
    // CRITICAL: Check if this is the Lower Finals
    const currentRound = lowerBracket.find(round => round.round === fromRound);
    const isLowerFinals = currentRound?.name === 'Lower Finals';
    const totalLowerRounds = lowerBracket.length;
    const isLastLowerRound = fromRound === totalLowerRounds;
    
    console.log(`[Playoff] 🔍 ROUND ANALYSIS:`);
    console.log(`[Playoff] Current round name: ${currentRound?.name}`);
    console.log(`[Playoff] Is Lower Finals: ${isLowerFinals}`);
    console.log(`[Playoff] Is last lower round: ${isLastLowerRound}`);
    console.log(`[Playoff] Total lower rounds: ${totalLowerRounds}`);
    console.log(`[Playoff] All lower rounds:`, lowerBracket.map(r => ({round: r.round, name: r.name})));
    
    // CRITICAL: Validate that we have a winner
    if (!completedMatch.winner) {
      console.error(`[Playoff] ❌ CRITICAL ERROR: No winner found in completedMatch!`);
      console.error(`[Playoff] completedMatch:`, completedMatch);
      return tournament; // Return unchanged if no winner
    }
    
    console.log(`[Playoff] Advancing ${completedMatch.winner?.name} from Lower Round ${fromRound} to Round ${nextRound}`);
    console.log(`[Playoff] Current lower bracket rounds:`, lowerBracket.map(r => ({ round: r.round, name: r.name })));
    
    // ENHANCED: Check for Lower Finals specifically
    if (isLowerFinals || isLastLowerRound) {
      console.log(`[Playoff] 🏆 LOWER FINALS COMPLETED - advancing winner to Grand Finals!`);
      console.log(`[Playoff] Lower Finals winner: ${completedMatch.winner?.name}`);
      
      // CRITICAL: Create a deep copy of the winner for finals
      const winnerCopy = {
        id: completedMatch.winner.id,
        name: completedMatch.winner.name,
        logo: completedMatch.winner.logo,
        wins: completedMatch.winner.wins,
        losses: completedMatch.winner.losses,
        points: completedMatch.winner.points,
        goalsFor: completedMatch.winner.goalsFor,
        goalsAgainst: completedMatch.winner.goalsAgainst,
        goalDifference: completedMatch.winner.goalDifference
      };
      
      console.log(`[Playoff] 🔍 LOWER FINALS WINNER COPY:`, winnerCopy);
      
      const finals = { ...tournament.finals };
      console.log(`[Playoff] 🔍 CURRENT FINALS STRUCTURE:`, finals);
      
      if (finals.matches[0].team1 === null) {
        finals.matches[0] = { ...finals.matches[0], team1: winnerCopy };
        console.log(`[Playoff] ✅ Advanced ${winnerCopy.name} to Grand Finals as team1`);
        console.log(`[Playoff] 🔍 UPDATED FINALS MATCH:`, finals.matches[0]);
      } else if (finals.matches[0].team2 === null) {
        finals.matches[0] = { ...finals.matches[0], team2: winnerCopy };
        console.log(`[Playoff] ✅ Advanced ${winnerCopy.name} to Grand Finals as team2`);
        console.log(`[Playoff] 🔍 UPDATED FINALS MATCH:`, finals.matches[0]);
      } else {
        console.error(`[Playoff] ❌ ERROR: Both Grand Finals slots are already filled!`);
        console.error(`[Playoff] Current finals:`, finals.matches[0]);
      }
      
      return { ...tournament, lowerBracket, finals };
    }
    
    // Find next round in lower bracket
    const nextRoundIndex = lowerBracket.findIndex(round => round.round === nextRound);
    console.log(`[Playoff] Looking for round ${nextRound}, found at index: ${nextRoundIndex}`);
    
    if (nextRoundIndex !== -1) {
      // Place winner in next lower bracket match
      const targetRound = { ...lowerBracket[nextRoundIndex] };
      let targetMatches = [...targetRound.matches];
      
      console.log(`[Playoff] Target round matches before update:`, targetMatches.map(m => ({ 
        id: m.id, 
        team1: m.team1?.name || 'NULL', 
        team2: m.team2?.name || 'NULL',
        status: m.status
      })));
      
      // CRITICAL: Create a deep copy of the winner to prevent reference issues
      const winnerCopy = {
        id: completedMatch.winner.id,
        name: completedMatch.winner.name,
        logo: completedMatch.winner.logo,
        wins: completedMatch.winner.wins,
        losses: completedMatch.winner.losses,
        points: completedMatch.winner.points,
        goalsFor: completedMatch.winner.goalsFor,
        goalsAgainst: completedMatch.winner.goalsAgainst,
        goalDifference: completedMatch.winner.goalDifference
      };
      
      console.log(`[Playoff] 🔍 WINNER COPY CREATED:`, winnerCopy);
      
      // Find first available slot in next round
      let placed = false;
      for (let i = 0; i < targetMatches.length; i++) {
        const match = targetMatches[i];
        if (match.team1 === null) {
          // Place winner as team1
          targetMatches[i] = { 
            ...match, 
            team1: winnerCopy
          };
          placed = true;
          console.log(`[Playoff] ✅ PLACED ${winnerCopy.name} as team1 in match ${match.id}`);
          console.log(`[Playoff] 🔍 UPDATED MATCH:`, targetMatches[i]);
          break;
        } else if (match.team2 === null) {
          // Place winner as team2
          targetMatches[i] = { 
            ...match, 
            team2: winnerCopy
          };
          placed = true;
          console.log(`[Playoff] ✅ PLACED ${winnerCopy.name} as team2 in match ${match.id}`);
          console.log(`[Playoff] 🔍 UPDATED MATCH:`, targetMatches[i]);
          break;
        }
      }
      
      if (!placed) {
        console.error(`[Playoff] ❌ FAILED TO PLACE ${completedMatch.winner?.name} in Lower Round ${nextRound} - no empty slots`);
        return tournament; // Return unchanged if placement fails
      }
      
      // Update the lower bracket with the new match data
      lowerBracket[nextRoundIndex] = {
        ...targetRound,
        matches: targetMatches
      };
      
      console.log(`[Playoff] ✅ SUCCESSFULLY advanced ${completedMatch.winner?.name} to Lower Round ${nextRound}`);
      console.log(`[Playoff] Updated match:`, targetMatches.map(m => ({ 
        id: m.id, 
        team1: m.team1?.name || 'NULL', 
        team2: m.team2?.name || 'NULL'
      })));
      
      // Return updated tournament
      return { ...tournament, lowerBracket };
      
    } else {
      // No next lower bracket round - winner goes to grand finals
      console.log(`[Playoff] 🏆 No Lower Round ${nextRound} found - advancing ${completedMatch.winner?.name} to Grand Finals`);
      
      // CRITICAL: Create a deep copy of the winner for finals
      const winnerCopy = {
        id: completedMatch.winner.id,
        name: completedMatch.winner.name,
        logo: completedMatch.winner.logo,
        wins: completedMatch.winner.wins,
        losses: completedMatch.winner.losses,
        points: completedMatch.winner.points,
        goalsFor: completedMatch.winner.goalsFor,
        goalsAgainst: completedMatch.winner.goalsAgainst,
        goalDifference: completedMatch.winner.goalDifference
      };
      
      console.log(`[Playoff] 🔍 FINALS WINNER COPY:`, winnerCopy);
      
      const finals = { ...tournament.finals };
      console.log(`[Playoff] 🔍 CURRENT FINALS STRUCTURE:`, finals);
      
      if (finals.matches[0].team1 === null) {
        finals.matches[0] = { ...finals.matches[0], team1: winnerCopy };
        console.log(`[Playoff] ✅ Advanced ${winnerCopy.name} to Grand Finals as team1`);
        console.log(`[Playoff] 🔍 FINALS MATCH:`, finals.matches[0]);
      } else if (finals.matches[0].team2 === null) {
        finals.matches[0] = { ...finals.matches[0], team2: winnerCopy };
        console.log(`[Playoff] ✅ Advanced ${winnerCopy.name} to Grand Finals as team2`);
        console.log(`[Playoff] 🔍 FINALS MATCH:`, finals.matches[0]);
      } else {
        console.error(`[Playoff] ❌ ERROR: Both Grand Finals slots are already filled!`);
        console.error(`[Playoff] Current finals:`, finals.matches[0]);
      }
      
      return { ...tournament, lowerBracket, finals };
    }
  }
  
  // Function to process bye matches that are ready for advancement
  function processCompletedByeAdvancements(tournament: any) {
    let updated = { ...tournament };
    let hasAdvancement = false;
    
    console.log('[Playoff] 🔍 Checking for bye matches ready for advancement...');
    
    // Check lower bracket for bye matches with determined opponents
    if (updated.lowerBracket) {
      for (let roundIndex = 0; roundIndex < updated.lowerBracket.length; roundIndex++) {
        const round = updated.lowerBracket[roundIndex];
        
        for (let matchIndex = 0; matchIndex < round.matches.length; matchIndex++) {
          const match = round.matches[matchIndex];
          
          // Check if this is a completed bye match where both teams are now present
          if (match.status === 'bye-completed' && match.isByeMatch && match.team1 && match.team2) {
            console.log(`[Playoff] 🏆 Bye match ${match.id} now has both teams - advancing bye winner`);
            console.log(`[Playoff] Bye winner: ${match.winner?.name}, Opponent: ${match.team2?.name}`);
            
            // The bye winner should advance to next round since they "won" their bye
            const byeWinnerMatch = {
              ...match,
              status: 'completed', // Convert to regular completed match
              // Winner stays the same (the bye winner)
              // Team2 was just placed, so now it's a real match to be played
            };
            
            // Advance the bye winner using normal advancement logic
            console.log(`[Playoff] 🚀 Advancing bye winner ${match.winner?.name} using normal logic`);
            updated = advanceWinnerInLowerBracket(updated, byeWinnerMatch, round.round);
            hasAdvancement = true;
            
            // Mark the original match as needing a reset since both teams should play
            updated.lowerBracket[roundIndex].matches[matchIndex] = {
              ...match,
              status: 'pending', // Reset to pending so teams can actually play
              winner: null, // Clear winner so teams can play properly
              score1: 0,
              score2: 0,
              isByeMatch: false // No longer a bye match
            };
            
            console.log(`[Playoff] 🔄 Reset match ${match.id} to pending for actual gameplay`);
          }
        }
      }
    }
    
    if (hasAdvancement) {
      console.log('[Playoff] ✅ Processed bye advancements successfully');
    } else {
      console.log('[Playoff] 📊 No bye advancements needed');
    }
    
    return updated;
  }
  function processAutoAdvancements(tournament: any) {
    let updated = { ...tournament };
    let hasChanges = false;
    
    console.log('[Playoff] 🔍 Processing automatic advancements...');
    
    // Process lower bracket bye advancements
    if (updated.lowerBracket) {
      updated.lowerBracket = updated.lowerBracket.map((round, roundIndex) => {
        const updatedMatches = round.matches.map(match => {
          
          // CRITICAL: Only auto-complete ACTUAL bye matches (where team2 will NEVER be filled)
          // Don't auto-complete matches where team2 might be filled by upper bracket losers
          if (match.team1 && match.team2 === null && match.status === 'pending') {
            
            // Check if this is a TRUE bye match (not waiting for an opponent)
            const isTrueBye = !match.waitingForHigherRankedLoser && 
                             !match.waitingForLowerRankedLoser && 
                             !round.waitingForUpperRound;
            
            if (isTrueBye) {
              console.log(`[Playoff] ✅ Auto-completing TRUE bye match for ${match.team1.name}`);
              console.log(`[Playoff] Match ID: ${match.id}, Round: ${round.name}`);
              
              // Create a proper completed match with winner
              const completedByeMatch = {
                ...match,
                status: 'bye-completed', // Special status to distinguish from regular completed matches
                winner: {
                  id: match.team1.id,
                  name: match.team1.name,
                  logo: match.team1.logo,
                  wins: match.team1.wins,
                  losses: match.team1.losses,
                  points: match.team1.points,
                  goalsFor: match.team1.goalsFor,
                  goalsAgainst: match.team1.goalsAgainst,
                  goalDifference: match.team1.goalDifference
                },
                score1: 1,
                score2: 0,
                isByeMatch: true // Flag to identify bye matches
              };
              
              hasChanges = true;
              return completedByeMatch;
            } else {
              console.log(`[Playoff] ⏸️ Skipping auto-completion for ${match.team1.name} - waiting for opponent`);
              console.log(`[Playoff] Match ID: ${match.id}, Waiting flags:`, {
                waitingForHigherRankedLoser: match.waitingForHigherRankedLoser,
                waitingForLowerRankedLoser: match.waitingForLowerRankedLoser,
                waitingForUpperRound: round.waitingForUpperRound
              });
            }
          }
          
          // Don't process already completed bye matches to avoid infinite loops
          else if (match.status === 'bye-completed' && match.isByeMatch) {
            console.log(`[Playoff] 📋 Bye match already completed: ${match.winner?.name}`);
            // Don't mark hasChanges for already processed bye matches
          }
          
          return match;
        });
        return { ...round, matches: updatedMatches };
      });
    }
    
    console.log(`[Playoff] 🔍 Auto-advancement processing complete. Changes detected: ${hasChanges}`);
    return { tournament: updated, hasChanges };
  }

  function handleGeneratePlayoffBracket() {
    if (playoffSize < 2 || playoffSize > teams.length) {
      setPlayoffError('Invalid number of playoff teams');
      toast.error(`Playoff size must be between 2 and ${teams.length} teams`, { autoClose: 3000 });
      return;
    }
    
    setPlayoffError(null);
    
    try {
      // Generate double elimination bracket
      const bracketStructure = generateDoubleEliminationBracket(teams, playoffSize);
      
      // Create new tournament structure
      const newPlayoffTournament = {
        id: 'playoffs',
        teams: bracketStructure.metadata.qualified,
        rounds: [], // Will be populated with bracket structure
        bracketType: 'double-elimination',
        upperBracket: bracketStructure.upperBracket,
        lowerBracket: bracketStructure.lowerBracket,
        finals: bracketStructure.finals,
        metadata: bracketStructure.metadata,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      
      // Process any automatic advancements (like bye matches)
      const { tournament: processedTournament, hasChanges } = processAutoAdvancements(newPlayoffTournament);
      if (hasChanges) {
        console.log('[Playoff] Processed automatic advancements after bracket generation');
      }
      
      setTournament(processedTournament);
      
      // Save to Firebase using setDoc
      savePlayoffTournament(processedTournament).catch(error => {
        console.error('Error saving playoff tournament to Firebase:', error);
        toast.error('Failed to save playoff bracket. Please try again.', { autoClose: 3000 });
      });
      
      toast.success(`Double elimination playoff bracket generated with ${playoffSize} teams!`, { autoClose: 3000 });
      
    } catch (error) {
      console.error('Error generating playoff bracket:', error);
      setPlayoffError('Failed to generate playoff bracket');
      toast.error('Failed to generate playoff bracket. Please try again.', { autoClose: 3000 });
    }
  }

  function handleResetPlayoffBracket() {
    setTournament(null);
    
    // Clear playoff tournament from Firebase using deleteDoc
    deleteDoc(doc(db, 'tournaments', 'playoffs')).catch(error => {
      console.error('Error clearing playoff tournament from Firebase:', error);
    });
    
    toast.info('Playoff bracket has been reset', { autoClose: 2000 });
  }

  const availableWeeks = getAvailableWeeks();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
    <div className="flex flex-col mb-8 bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
  <div className="w-full">
    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center md:text-left bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500"></h2>
    
    {/* Flex container for tabs and back button - responsive layout */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
      
      {/* Tab buttons container */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
        <button
          className={`flex items-center justify-center space-x-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto ${
            tab === 'fixtures' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          onClick={() => setTab('fixtures')}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-sm md:text-base">Regular Season</span>
        </button>
        <button
          className={`flex items-center justify-center space-x-2 px-4 md:px-6 py-3 rounded-lg font-semibold transition-colors w-full sm:w-auto ${
            tab === 'playoffs' ? 'bg-green-400 text-black' : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
          onClick={() => setTab('playoffs')}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-sm md:text-base">Playoffs</span>
        </button>
        
        {/* Add Firebase Test Button */}
     
      </div>
      
      {/* Back to Home button */}
      <button
        onClick={() => {
          setCurrentPage('home');
          toast.info('Returning to home page...', { autoClose: 1500 });
        }}
        className="w-full md:w-auto bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base"
      >
        Back to Home
      </button>
      
    </div>
  </div>
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
                       <div className="flex flex-col lg:flex-row items-center justify-between mb-6 p-4">
  {/* Home Team */}
  <div className="flex flex-col items-center space-y-2 w-full lg:w-1/3 mb-4 lg:mb-0">
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
  <div className="flex flex-col items-center space-y-2 px-4 my-4 lg:my-0 w-full lg:w-1/3">
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
  <div className="flex flex-col items-center space-y-2 w-full lg:w-1/3 mt-4 lg:mt-0">
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
            setPlayoffSize={setPlayoffSize}
            handleDoubleEliminationScoreChange={handleDoubleEliminationScoreChange}
            handleDoubleEliminationSaveScore={handleDoubleEliminationSaveScore}
          />
        )}
      </div>
    </div>
  );
};

export default BracketPage;