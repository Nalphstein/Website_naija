// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAD-zFuwNGPXDVaGExT3QBRfwrBcoJcvio",
    authDomain: "website-naija.firebaseapp.com",
    projectId: "website-naija",
    storageBucket: "website-naija.appspot.com",
    messagingSenderId: "1094108785942",
    appId: "1:1094108785942:web:b457d089faf3d5a4867437",
    measurementId: "G-EQ77XG70SV"
  };

const app = initializeApp(firebaseConfig);

// SSR-safe analytics export
export let analytics: ReturnType<typeof getAnalytics> | undefined = undefined;
if (typeof window !== "undefined") {
  analyticsIsSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const db = getFirestore(app);
// export const storage = getStorage(app);

export default app;