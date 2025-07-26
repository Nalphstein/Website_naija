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
    updatedAt: new Date().toISOString(),
  });
}

// Add to your fixtureService.ts
export async function saveMultipleFixtureScores(tournamentId: string, scores: Array<{
  fixtureKey: string;
  homeScore: number;
  awayScore: number;
}>) {
  // Batch save multiple scores for better performance
  const batch = writeBatch(db);
  
  scores.forEach(({ fixtureKey, homeScore, awayScore }) => {
    const docRef = doc(db, 'tournaments', tournamentId, 'fixtures', fixtureKey);
    batch.set(docRef, { homeScore, awayScore, savedAt: new Date() });
  });
  
  await batch.commit();
}

// Add real-time score updates
export function subscribeToFixtureScores(tournamentId: string, callback: (scores: any) => void) {
  const scoresRef = collection(db, 'tournaments', tournamentId, 'fixtures');
  return onSnapshot(scoresRef, (snapshot) => {
    const scores = {};
    snapshot.forEach(doc => {
      scores[doc.id] = doc.data();
    });
    callback(scores);
  });
}

export async function getFixtureScores(tournamentId: string): Promise<Record<string, { homeScore: number; awayScore: number }>> {
  const q = query(fixturesCollection, where('tournamentId', '==', tournamentId));
  const querySnapshot = await getDocs(q);
  const result: Record<string, { homeScore: number; awayScore: number }> = {};
  querySnapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
    const data = docSnap.data();
    result[data.fixtureKey] = {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
    };
  });
  return result;
}
