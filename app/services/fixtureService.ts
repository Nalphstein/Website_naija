// Updated fixtureService.ts - Tournament Independent Approach

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
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
  tournamentId?: string; // Optional - for filtering/organization only
};

const fixturesCollection = collection(db, 'fixtures');

// Save fixture using only the fixture key as document ID
export async function saveFixtureScore({ fixtureKey, homeScore, awayScore, tournamentId }: FixtureScore): Promise<void> {
  console.log(`[fixtureService] Saving fixture with key as ID: ${fixtureKey}`, {
    fixtureKey,
    homeScore,
    awayScore,
    tournamentId: tournamentId || 'not-provided'
  });
  
  // Validate fixture key
  if (!fixtureKey || fixtureKey.includes('undefined') || fixtureKey.includes('null')) {
    console.error(`[fixtureService] Invalid fixture key: ${fixtureKey}`);
    throw new Error(`Invalid fixture key: ${fixtureKey}`);
  }
  
  try {
    // Use fixtureKey directly as document ID
    const fixtureRef = doc(fixturesCollection, fixtureKey);
    
    const fixtureData = {
      fixtureKey,
      homeScore,
      awayScore,
      completed: true,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Only include tournamentId if provided (for backwards compatibility)
      ...(tournamentId && { tournamentId })
    };
    
    console.log(`[fixtureService] Saving fixture data:`, fixtureData);
    await setDoc(fixtureRef, fixtureData);
    
    // Verify save
    const savedDoc = await getDoc(fixtureRef);
    if (savedDoc.exists()) {
      console.log(`[fixtureService] ✅ Successfully saved fixture: ${fixtureKey}`);
    } else {
      throw new Error(`Failed to verify saved fixture: ${fixtureKey}`);
    }
  } catch (error) {
    console.error(`[fixtureService] ❌ Error saving fixture:`, error);
    throw error;
  }
}

// Get all fixture scores (no tournament dependency)
export async function getFixtureScores(tournamentId?: string): Promise<Record<string, { homeScore: number; awayScore: number; completed?: boolean }>> {
  console.log(`[fixtureService] Loading fixture scores${tournamentId ? ` for tournament: ${tournamentId}` : ' (all fixtures)'}`);
  
  try {
    let q;
    if (tournamentId) {
      // Filter by tournament if provided
      q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
    } else {
      // Get all fixtures
      q = query(fixturesCollection);
    }
    
    const querySnapshot = await getDocs(q);
    const result: Record<string, { homeScore: number; awayScore: number; completed?: boolean }> = {};
    
    querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
      const data = docSnap.data();
      const fixtureKey = data.fixtureKey;
      
      // Skip invalid fixture keys
      if (!fixtureKey || typeof fixtureKey !== 'string') {
        console.warn(`[fixtureService] Skipping invalid fixture key:`, data);
        return;
      }
      
      result[fixtureKey] = {
        homeScore: data.homeScore || 0,
        awayScore: data.awayScore || 0,
        completed: data.completed !== false, // Default to true
      };
    });
    
    console.log(`[fixtureService] ✅ Loaded ${Object.keys(result).length} fixture scores`);
    return result;
  } catch (error) {
    console.error(`[fixtureService] ❌ Error loading fixture scores:`, error);
    throw error;
  }
}

// Get a specific fixture by its key
export async function getSpecificFixtureScore(fixtureKey: string): Promise<{ homeScore: number; awayScore: number; completed?: boolean } | null> {
  try {
    const fixtureRef = doc(fixturesCollection, fixtureKey);
    const docSnap = await getDoc(fixtureRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        homeScore: data.homeScore || 0,
        awayScore: data.awayScore || 0,
        completed: data.completed !== false,
      };
    }
    return null;
  } catch (error) {
    console.error(`[fixtureService] Error loading fixture ${fixtureKey}:`, error);
    return null;
  }
}

// Batch save multiple fixtures
export async function saveMultipleFixtureScores(fixtures: Array<{
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
  tournamentId?: string;
}>) {
  const batch = writeBatch(db);
  
  fixtures.forEach(({ fixtureKey, homeScore, awayScore, tournamentId }) => {
    const docRef = doc(fixturesCollection, fixtureKey);
    const fixtureData = {
      fixtureKey,
      homeScore,
      awayScore,
      completed: true,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(tournamentId && { tournamentId })
    };
    batch.set(docRef, fixtureData);
  });
  
  await batch.commit();
  console.log(`[fixtureService] ✅ Batch saved ${fixtures.length} fixtures`);
}

// Get all fixtures (for debugging)
export async function getAllFixtures(): Promise<any[]> {
  try {
    const querySnapshot = await getDocs(fixturesCollection);
    const fixtures: any[] = [];
    
    querySnapshot.forEach((doc) => {
      fixtures.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[fixtureService] Found ${fixtures.length} total fixtures`);
    return fixtures;
  } catch (error) {
    console.error(`[fixtureService] Error getting all fixtures:`, error);
    return [];
  }
}

// Clear fixtures by pattern (useful for cleanup)
export async function clearFixturesByPattern(pattern: string): Promise<void> {
  try {
    const allFixtures = await getAllFixtures();
    const toDelete = allFixtures.filter(f => f.fixtureKey?.includes(pattern));
    
    if (toDelete.length > 0) {
      const batch = writeBatch(db);
      toDelete.forEach(fixture => {
        const docRef = doc(fixturesCollection, fixture.id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      console.log(`[fixtureService] ✅ Deleted ${toDelete.length} fixtures matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[fixtureService] Error clearing fixtures:`, error);
    throw error;
  }
}

// Real-time subscription to all fixtures
export function subscribeToAllFixtures(callback: (scores: Record<string, { homeScore: number; awayScore: number; completed?: boolean }>) => void) {
  return onSnapshot(fixturesCollection, (snapshot) => {
    const scores: Record<string, { homeScore: number; awayScore: number; completed?: boolean }> = {};
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.fixtureKey) {
        scores[data.fixtureKey] = {
          homeScore: data.homeScore || 0,
          awayScore: data.awayScore || 0,
          completed: data.completed !== false,
        };
      }
    });
    callback(scores);
  }, (error) => {
    console.error(`[fixtureService] Real-time subscription error:`, error);
  });
}