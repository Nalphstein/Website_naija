// Fixed tournamentService.ts with better error handling and data validation

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
  // Double elimination bracket properties
  bracketType?: 'single-elimination' | 'double-elimination';
  upperBracket?: any[];
  lowerBracket?: any[];
  finals?: any;
  metadata?: {
    totalTeams: number;
    upperBracketTeams: number;
    lowerBracketTeams: number;
    qualified: Team[];
  };
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
  try {
    console.log(`[tournamentService] Getting tournament: ${id}`);
    const docRef = doc(db, 'tournaments', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`[tournamentService] Tournament not found: ${id}`);
      return null;
    }
    
    const data = docSnap.data();
    const tournament = {
      id: docSnap.id,
      ...data
    } as TournamentType;
    
    console.log(`[tournamentService] Successfully retrieved tournament:`, tournament);
    return tournament;
  } catch (error) {
    console.error(`[tournamentService] Error getting tournament ${id}:`, error);
    throw error;
  }
}

// Get current active tournament
export async function getCurrentTournament(): Promise<TournamentType | null> {
  const currentId = getCurrentTournamentId();
  if (!currentId) return null;
  
  return getTournament(currentId);
}

// Helper function to detect and log undefined values in tournament data
function detectUndefinedValues(obj: any, path: string = ''): string[] {
  const undefinedPaths: string[] = [];
  
  if (obj === undefined) {
    undefinedPaths.push(path || 'root');
    return undefinedPaths;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return undefinedPaths;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = path ? `${path}[${index}]` : `[${index}]`;
      undefinedPaths.push(...detectUndefinedValues(item, itemPath));
    });
  } else {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key;
      if (value === undefined) {
        undefinedPaths.push(newPath);
      } else {
        undefinedPaths.push(...detectUndefinedValues(value, newPath));
      }
    });
  }
  
  return undefinedPaths;
}

// Validate tournament data before Firebase operations
function validateTournamentData(data: any, operationName: string): boolean {
  console.log(`[tournamentService] Validating data for ${operationName}`);
  
  // Check for undefined values
  const undefinedPaths = detectUndefinedValues(data);
  
  if (undefinedPaths.length > 0) {
    console.error(`[tournamentService] ❌ UNDEFINED VALUES DETECTED in ${operationName}:`);
    undefinedPaths.forEach(path => {
      console.error(`  - undefined at: ${path}`);
    });
    return false;
  }
  
  console.log(`[tournamentService] ✅ Data validation passed for ${operationName}`);
  return true;
}

// Helper function to recursively clean tournament data for Firestore
function cleanTournamentData(updates: Partial<Omit<TournamentType, 'id' | 'createdAt'>>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(updates)) {
    // Skip undefined values
    if (value === undefined) {
      console.log(`[tournamentService] Skipping undefined value for key: ${key}`);
      continue;
    }
    
    // Handle null values explicitly
    if (value === null) {
      cleaned[key] = null;
      continue;
    }
    
    // Handle arrays - recursively clean them
    if (Array.isArray(value)) {
      try {
        const cleanedArray = cleanArrayRecursively(value);
        cleaned[key] = cleanedArray;
      } catch (error) {
        console.error(`[tournamentService] Cannot serialize array for key ${key}:`, error);
        // Skip this field or provide a default
        continue;
      }
    } else if (typeof value === 'object') {
      try {
        const cleanedObject = cleanObjectRecursively(value);
        cleaned[key] = cleanedObject;
      } catch (error) {
        console.error(`[tournamentService] Cannot serialize object for key ${key}:`, error);
        continue;
      }
    } else {
      // Primitive values (string, number, boolean)
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

// Helper function to recursively clean objects, removing undefined values
function cleanObjectRecursively(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return cleanArrayRecursively(obj);
  }
  
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      // Skip undefined values entirely
      continue;
    } else if (value === null) {
      cleaned[key] = null;
    } else if (Array.isArray(value)) {
      cleaned[key] = cleanArrayRecursively(value);
    } else if (typeof value === 'object') {
      cleaned[key] = cleanObjectRecursively(value);
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

// Helper function to recursively clean arrays, removing undefined values
function cleanArrayRecursively(arr: any[]): any[] {
  return arr
    .filter(item => item !== undefined) // Remove undefined items
    .map(item => {
      if (item === null) {
        return null;
      } else if (Array.isArray(item)) {
        return cleanArrayRecursively(item);
      } else if (typeof item === 'object') {
        return cleanObjectRecursively(item);
      } else {
        return item;
      }
    });
}

// Update tournament with better error handling - FIXED to use setDoc
export async function updateTournament(id: string, updates: Partial<Omit<TournamentType, 'id' | 'createdAt'>>): Promise<void> {
  try {
    console.log(`[tournamentService] Updating tournament ${id} with:`, updates);
    
    // Validate tournament ID
    if (!id || typeof id !== 'string') {
      throw new Error(`Invalid tournament ID: ${id}`);
    }
    
    // Validate input data for undefined values before cleaning
    if (!validateTournamentData(updates, `updateTournament(${id})`)) {
      console.warn(`[tournamentService] Data contains undefined values, attempting to clean...`);
    }
    
    // Clean the updates data
    const cleanedUpdates = cleanTournamentData(updates);
    console.log(`[tournamentService] Cleaned updates:`, cleanedUpdates);
    
    // If no valid updates remain, don't make the call
    if (Object.keys(cleanedUpdates).length === 0) {
      console.log(`[tournamentService] No valid updates to apply for tournament ${id}`);
      return;
    }
    
    // Add timestamp for the update
    const finalUpdates = {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    };
    
    console.log(`[tournamentService] Final updates to apply:`, finalUpdates);
    
    // Final validation before Firebase call
    if (!validateTournamentData(finalUpdates, `final updateTournament(${id})`)) {
      throw new Error('Data still contains undefined values after cleaning');
    }
    
    const docRef = doc(db, 'tournaments', id);
    
    // Use setDoc with merge: true instead of updateDoc to handle cases where document may not exist
    await setDoc(docRef, finalUpdates, { merge: true });
    
    console.log(`[tournamentService] Successfully updated tournament ${id}`);
    
    // Verify the update
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
      console.log(`[tournamentService] ✅ Verified: Tournament ${id} exists after update`);
    } else {
      console.warn(`[tournamentService] ⚠️ Warning: Tournament ${id} document not found after update`);
    }
    
  } catch (error) {
    console.error(`[tournamentService] Error updating tournament ${id}:`, error);
    console.error(`[tournamentService] Updates that failed:`, updates);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`[tournamentService] Error name: ${error.name}`);
      console.error(`[tournamentService] Error message: ${error.message}`);
      console.error(`[tournamentService] Error stack: ${error.stack}`);
    }
    
    throw error;
  }
}

// Get all tournaments (for admin view)
export async function getAllTournaments(): Promise<TournamentType[]> {
  try {
    const q = query(collection(db, 'tournaments'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as TournamentType);
  } catch (error) {
    console.error('[tournamentService] Error getting all tournaments:', error);
    throw error;
  }
}

// Complete a tournament
export async function completeTournament(id: string): Promise<void> {
  await updateTournament(id, { status: 'completed' });
  clearCurrentTournament();
}

// Specialized function for saving playoff tournaments with enhanced bracket data
export async function savePlayoffTournament(playoffData: any): Promise<void> {
  try {
    console.log(`[tournamentService] Saving playoff tournament with bracket data`);
    console.log(`[tournamentService] Raw playoff data:`, playoffData);
    
    // Clean and validate playoff tournament data with recursive undefined removal
    const rawCleanPlayoffData = {
      id: playoffData.id || 'playoffs',
      teams: playoffData.teams || [],
      bracketType: playoffData.bracketType || 'double-elimination',
      upperBracket: playoffData.upperBracket || [],
      lowerBracket: playoffData.lowerBracket || [],
      finals: playoffData.finals || {},
      metadata: playoffData.metadata || {},
      status: playoffData.status || 'active',
      createdAt: playoffData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log(`[tournamentService] Pre-cleaning data:`, rawCleanPlayoffData);
    
    // Apply deep cleaning to remove any undefined values recursively
    const cleanPlayoffData = cleanObjectRecursively(rawCleanPlayoffData);
    
    console.log(`[tournamentService] Post-cleaning data:`, cleanPlayoffData);
    
    // Validate cleaned data for undefined values
    if (!validateTournamentData(cleanPlayoffData, 'savePlayoffTournament')) {
      throw new Error('Playoff data still contains undefined values after cleaning');
    }
    
    // Additional validation: ensure all bracket data is serializable
    try {
      const testSerialization = JSON.stringify(cleanPlayoffData);
      console.log(`[tournamentService] ✅ Data serialization test passed (${testSerialization.length} chars)`);
    } catch (error) {
      console.error(`[tournamentService] ❌ Playoff data is not serializable after cleaning:`, error);
      throw new Error('Playoff tournament data contains non-serializable content after cleaning');
    }
    
    // Check for any remaining undefined values
    const undefinedCheck = JSON.stringify(cleanPlayoffData, (key, value) => {
      if (value === undefined) {
        console.error(`[tournamentService] ❌ FOUND UNDEFINED VALUE at key: ${key}`);
        throw new Error(`Undefined value found at key: ${key}`);
      }
      return value;
    });
    
    console.log(`[tournamentService] ✅ No undefined values found in cleaned data`);
    
    const docRef = doc(db, 'tournaments', 'playoffs');
    
    // Use setDoc with merge: true to ensure document creation/update
    await setDoc(docRef, cleanPlayoffData, { merge: true });
    
    console.log(`[tournamentService] ✅ Successfully saved playoff tournament`);
    
    // Verify the save
    const savedDoc = await getDoc(docRef);
    if (savedDoc.exists()) {
      console.log(`[tournamentService] ✅ Verified: Playoff tournament exists in database`);
      const data = savedDoc.data();
      console.log(`[tournamentService] Saved playoff structure:`, {
        hasUpperBracket: !!data.upperBracket,
        hasLowerBracket: !!data.lowerBracket,
        hasFinals: !!data.finals,
        bracketType: data.bracketType,
        teamsCount: data.teams?.length || 0
      });
    } else {
      throw new Error('Playoff tournament was not saved properly');
    }
    
  } catch (error) {
    console.error(`[tournamentService] ❌ Error saving playoff tournament:`, error);
    if (error instanceof Error) {
      console.error(`[tournamentService] Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

// Test function to debug tournament updates
export async function testTournamentUpdate(id: string): Promise<void> {
  try {
    console.log(`[tournamentService] Testing tournament update for: ${id}`);
    
    // Test with minimal data first
    await updateTournament(id, {
      currentWeek: 1
    });
    
    console.log(`[tournamentService] Test update successful`);
  } catch (error) {
    console.error(`[tournamentService] Test update failed:`, error);
    throw error;
  }
}