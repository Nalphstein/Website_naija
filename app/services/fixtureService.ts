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
