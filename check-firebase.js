// check-firebase.js - Test Firebase connectivity and Firestore operations
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

// Firebase configuration from firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyAD-zFuwNGPXDVaGExT3QBRfwrBcoJcvio",
  authDomain: "website-naija.firebaseapp.com",
  projectId: "website-naija",
  storageBucket: "website-naija.appspot.com",
  messagingSenderId: "1094108785942",
  appId: "1:1094108785942:web:b457d089faf3d5a4867437",
  measurementId: "G-EQ77XG70SV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  console.log('Starting Firebase connection test...');
  
  try {
    // Check the root fixtures collection
    const fixturesCollection = collection(db, 'fixtures');
    console.log('Checking root fixtures collection...');
    
    // Try to get documents from the fixtures collection
    const fixturesSnapshot = await getDocs(fixturesCollection);
    console.log(`Found ${fixturesSnapshot.size} documents in root fixtures collection`);
    
    // Log a sample document if available
    if (fixturesSnapshot.size > 0) {
      const sampleDoc = fixturesSnapshot.docs[0].data();
      console.log('Sample fixture document:', sampleDoc);
    }
    
    // Try to add a test document to the fixtures collection
    const testFixtureData = {
      fixtureKey: 'test-fixture-key-' + Date.now(),
      homeScore: 1,
      awayScore: 0,
      completed: true,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Attempting to add test document to fixtures collection:', testFixtureData);
    const docRef = await addDoc(fixturesCollection, testFixtureData);
    console.log('Successfully added test document with ID:', docRef.id);
    
    // Verify the document was added by querying for it
    const testQuery = query(fixturesCollection, where('fixtureKey', '==', testFixtureData.fixtureKey));
    const testQuerySnapshot = await getDocs(testQuery);
    console.log(`Found ${testQuerySnapshot.size} documents matching the test fixture key`);
    
    if (testQuerySnapshot.size > 0) {
      console.log('Test document was successfully added and retrieved');
    } else {
      console.error('Test document was not found after adding');
    }
    
  } catch (error) {
    console.error('Error during Firebase test:', error);
  }
}

// Run the test
checkCollections();