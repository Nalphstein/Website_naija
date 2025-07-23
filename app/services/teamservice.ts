import { db, storage } from '../../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type Team = {
  id: string;
  name: string;
  logo: string | null;
  players: string[];
  wins: number;
  losses: number;
  points: number;
  createdAt?: any;
  updatedAt?: any;
};

const teamsCollection = collection(db, 'teams');

function docToTeam(docSnap: QueryDocumentSnapshot<DocumentData>): Team {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    logo: data.logo ?? null,
    players: data.players ?? [],
    wins: data.wins ?? 0,
    losses: data.losses ?? 0,
    points: data.points ?? 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createTeam(teamData: Omit<Team, 'id'>): Promise<string> {
  const docRef = await addDoc(teamsCollection, {
    ...teamData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getAllTeams(): Promise<Team[]> {
  const q = query(teamsCollection, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToTeam);
}

export async function updateTeam(teamId: string, teamData: Partial<Team>): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, {
    ...teamData,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTeam(teamId: string): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await deleteDoc(teamRef);
}

export async function uploadTeamLogo(file: File, teamName: string): Promise<string> {
  const timestamp = Date.now();
  const storageRef = ref(storage, `team-logos/${teamName}-${timestamp}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}