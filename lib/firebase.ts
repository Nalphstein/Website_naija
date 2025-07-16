// firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAD-zFuwNGPXDVaGExT3QBRfwrBcoJcvio",
    authDomain: "website-naija.firebaseapp.com",
    projectId: "website-naija",
    storageBucket: "website-naija.firebasestorage.app",
    messagingSenderId: "1094108785942",
    appId: "1:1094108785942:web:b457d089faf3d5a4867437",
    measurementId: "G-EQ77XG70SV"
  };

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
// export const db = getFirestore(app);