import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBI55vGsSXvARv-Y4nKhaxgB8-8nQrU2r8",
  authDomain: "gen-lang-client-0446040294.firebaseapp.com",
  projectId: "gen-lang-client-0446040294",
  storageBucket: "gen-lang-client-0446040294.firebasestorage.app",
  messagingSenderId: "1067224146338",
  appId: "1:1067224146338:web:8a5bf85ca1adb83a3b92fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-mohamedalsayedab-e3c83435-3653-4f4b-adae-98b60f23984f");

const NEW_IMAGE = "https://j.top4top.io/p_3834lfb1o1.png";

async function updateHabisImage() {
  console.log("Fetching books...");
  const booksCol = collection(db, "books");
  const snapshot = await getDocs(booksCol);
  console.log(`Found ${snapshot.size} books in DB.`);

  let found = false;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    console.log(`- ${data.title} | image: ${data.image?.substring(0, 50)}...`);
    if (data.title === "حبيس الزمن") {
      found = true;
      console.log(`\nFound 'حبيس الزمن' (ID: ${docSnap.id}). Updating image...`);
      await updateDoc(doc(db, "books", docSnap.id), {
        image: NEW_IMAGE
      });
      console.log(`Image updated to: ${NEW_IMAGE}`);
    }
  }

  if (!found) {
    console.log("'حبيس الزمن' NOT found in DB!");
  }
}

updateHabisImage().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
