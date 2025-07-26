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


// Add to your teamservice.ts
export interface TeamStats extends Team {
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  draws: number;
  matchesPlayed: number;
  winPercentage: number;
}

export async function updateTeamWithDetailedStats(teamId: string, matchResult: {
  goalsFor: number;
  goalsAgainst: number;
  result: 'win' | 'loss' | 'draw';
}) {
  // Enhanced team statistics tracking
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

// Add this import at the top with your other imports
// Remove the Node.js Cloudinary import
// import { v2 as cloudinary } from 'cloudinary';

// Remove the Cloudinary configuration
// cloudinary.config({ 
//   cloud_name: 'dn46afxdu', 
//   api_key: '267741911779395', 
//   api_secret: '51AaWceuSw0_U7GjJ5BoACoHG5E' 
// });

// Replace your uploadTeamLogo function with this client-side version
export const uploadTeamLogo = async (file: File, safeTeamName: string): Promise<string> => {
  try {
    const timestamp = new Date().getTime();
    
    // Sanitize team name for use in storage path
    const sanitizedTeamName = safeTeamName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'team';
    
    // Create a safe filename
    const fileExtension = file.name.split('.').pop() || '';
    const safeFileName = `${sanitizedTeamName}-${timestamp}.${fileExtension}`.toLowerCase();
    
    console.log('Uploading file with details:', {
      originalName: file.name,
      safeFileName,
      fileType: file.type,
      fileSize: file.size,
      teamName: safeTeamName
    });
    
    // Create form data for direct upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'team_logo_upload');
    formData.append('public_id', `${sanitizedTeamName}-${timestamp}`);
    formData.append('folder', 'team-logos');
    
    // Upload directly to Cloudinary using fetch
    console.log('Uploading to Cloudinary...');
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('Upload successful, getting download URL...', data);
    
    return data.secure_url;
  } catch (error) {
    console.error("Error in uploadTeamLogo:", error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    throw new Error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}