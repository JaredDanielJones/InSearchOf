import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBM8_VrXlsDPl7krx0Hqqm4EpkzQrCuIxY",
  authDomain: "insearchof-bd345.firebaseapp.com",
  projectId: "insearchof-bd345",
  storageBucket: "insearchof-bd345.firebasestorage.app",
  messagingSenderId: "1098245341103",
  appId: "1:1098245341103:web:099d081269d695baf4795a",
  measurementId: "G-Y9KV224PL9",
};

// Prevent re-initialization in Next.js hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);
