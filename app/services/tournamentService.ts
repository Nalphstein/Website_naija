import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { Team } from './teamservice';

const TOURNAMENT_STORAGE_KEY = 'current_tournament_id';

export interface Match {
  id: string;
  team1: Team | null;
  team2: Team | null;
  winner: Team | null;
  score1: number;
  score2: number;
  status: 'pending' | 'completed';
  roundName?: string;
}

export interface TournamentType {
  id: string;
  name: string;
  teams: Team[];
  rounds: Match[][];
  status: 'active' | 'completed';
  currentWeek: number;
  createdAt: any;
  updatedAt?: any;
}

// Get current tournament ID from localStorage
export function getCurrentTournamentId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOURNAMENT_STORAGE_KEY);
}

// Set current tournament ID in localStorage
export function setCurrentTournamentId(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOURNAMENT_STORAGE_KEY, tournamentId);
}

// Clear current tournament ID
export function clearCurrentTournament(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOURNAMENT_STORAGE_KEY);
}

// Create a new tournament
export async function createTournament(name: string, teams: Team[]): Promise<TournamentType> {
  const tournamentData = {
    name,
    teams,
    rounds: [],
    status: 'active' as const,
    currentWeek: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = doc(collection(db, 'tournaments'));
  await setDoc(docRef, tournamentData);
  
  const newTournament = {
    id: docRef.id,
    ...tournamentData
  };
  
  setCurrentTournamentId(docRef.id);
  return newTournament;
}

// Get tournament by ID
export async function getTournament(id: string): Promise<TournamentType | null> {
  const docRef = doc(db, 'tournaments', id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as TournamentType;
}

// Get current active tournament
export async function getCurrentTournament(): Promise<TournamentType | null> {
  const currentId = getCurrentTournamentId();
  if (!currentId) return null;
  
  return getTournament(currentId);
}

// Update tournament
export async function updateTournament(id: string, updates: Partial<Omit<TournamentType, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'tournaments', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

// Get all tournaments (for admin view)
export async function getAllTournaments(): Promise<TournamentType[]> {
  const q = query(collection(db, 'tournaments'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }) as TournamentType);
}

// Complete a tournament
export async function completeTournament(id: string): Promise<void> {
  await updateTournament(id, { status: 'completed' });
  clearCurrentTournament();
}
