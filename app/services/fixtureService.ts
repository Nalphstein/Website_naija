import { db } from '../../lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  onSnapshot,
  writeBatch,
  getDoc,
} from 'firebase/firestore';

export type FixtureScore = {
  tournamentId: string;
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
};

const fixturesCollection = collection(db, 'fixtures');

export async function saveFixtureScore({ tournamentId, fixtureKey, homeScore, awayScore }: FixtureScore): Promise<void> {
  // Use tournamentId + fixtureKey as the doc id for idempotency
  const docId = `${tournamentId}_${fixtureKey}`;
  const fixtureRef = doc(fixturesCollection, docId);
  await setDoc(fixtureRef, {
    tournamentId,
    fixtureKey,
    homeScore,
    awayScore,
    completed: true, // Explicitly mark as completed
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// Enhanced function to get fixture scores with better error handling and logging
export async function getFixtureScores(tournamentId: string): Promise<Record<string, { homeScore: number; awayScore: number; completed?: boolean }>> {
  console.log(`[fixtureService] Loading fixture scores for tournament: ${tournamentId}`);
  
  try {
    const q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
    const querySnapshot = await getDocs(q);
    const result: Record<string, { homeScore: number; awayScore: number; completed?: boolean }> = {};
    
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      result[data.fixtureKey] = {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        completed: data.completed || true, // Default to true for backward compatibility
      };
    });
    
    console.log(`[fixtureService] Loaded ${Object.keys(result).length} fixture scores:`, result);
    return result;
  } catch (error) {
    console.error(`[fixtureService] Error loading fixture scores for tournament ${tournamentId}:`, error);
    throw error;
  }
}

// Get a specific fixture score - useful for debugging
export async function getSpecificFixtureScore(tournamentId: string, fixtureKey: string): Promise<{ homeScore: number; awayScore: number; completed?: boolean } | null> {
  const docId = `${tournamentId}_${fixtureKey}`;
  const fixtureRef = doc(fixturesCollection, docId);
  
  try {
    const docSnap = await getDoc(fixtureRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        completed: data.completed || true,
      };
    }
    return null;
  } catch (error) {
    console.error(`[fixtureService] Error loading specific fixture score ${fixtureKey}:`, error);
    return null;
  }
}

// Batch save multiple scores for better performance
export async function saveMultipleFixtureScores(tournamentId: string, scores: Array<{
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
}>) {
  const batch = writeBatch(db);
  
  scores.forEach(({ fixtureKey, homeScore, awayScore }) => {
    const docId = `${tournamentId}_${fixtureKey}`;
    const docRef = doc(fixturesCollection, docId);
    batch.set(docRef, {
      tournamentId,
      fixtureKey,
      homeScore,
      awayScore,
      completed: true,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  
  await batch.commit();
}

// Real-time score updates subscription
export function subscribeToFixtureScores(tournamentId: string, callback: (scores: Record<string, { homeScore: number; awayScore: number; completed?: boolean }>) => void) {
  const q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
  
  return onSnapshot(q, (snapshot) => {
    const scores: Record<string, { homeScore: number; awayScore: number; completed?: boolean }> = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      scores[data.fixtureKey] = {
        homeScore: data.homeScore,
        awayScore: data.awayScore,
        completed: data.completed || true,
      };
    });
    console.log(`[fixtureService] Real-time update - ${Object.keys(scores).length} scores received:`, scores);
    callback(scores);
  }, (error) => {
    console.error(`[fixtureService] Error in real-time subscription for tournament ${tournamentId}:`, error);
  });
}

// Clear all fixture scores for a tournament (useful for resetting)
export async function clearTournamentFixtureScores(tournamentId: string): Promise<void> {
  const q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`[fixtureService] Cleared all fixture scores for tournament: ${tournamentId}`);
}

// Get tournament fixture statistics
export async function getTournamentFixtureStats(tournamentId: string): Promise<{
  totalSaved: number;
  totalGoals: number;
  lastUpdated: string | null;
}> {
  const q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
  const querySnapshot = await getDocs(q);
  
  let totalSaved = 0;
  let totalGoals = 0;
  let lastUpdated: string | null = null;
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalSaved++;
    totalGoals += (data.homeScore || 0) + (data.awayScore || 0);
    
    if (!lastUpdated || (data.updatedAt && data.updatedAt > lastUpdated)) {
      lastUpdated = data.updatedAt;
    }
  });
  
  return {
    totalSaved,
    totalGoals,
    lastUpdated,
  };
}