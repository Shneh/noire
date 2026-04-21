import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyChe4WilfvW30dgC_9PZUj_YR0wafy9Ihk",
  authDomain: "noire-18153.firebaseapp.com",
  projectId: "noire-18153",
  storageBucket: "noire-18153.firebasestorage.app",
  messagingSenderId: "33936831086",
  appId: "1:33936831086:web:3c22f0ecd6dd9d8138ac7f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, "admin@noire.com", "shneh@1234");
    await setDoc(doc(db, "users", userCred.user.uid), {
      name: "Master Admin",
      email: "admin@noire.com",
      role: "admin"
    });
    console.log("Admin successfully explicitly created!");
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
       console.log("Admin already exists!");
       process.exit(0);
    }
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
