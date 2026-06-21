import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2OcgtjiYJ9BtIu5D137Ed-FRvlsIDo_U",
  authDomain: "questory-ad7e2.firebaseapp.com",
  projectId: "questory-ad7e2",
  storageBucket: "questory-ad7e2.firebasestorage.app",
  messagingSenderId: "772721117851",
  appId: "1:772721117851:web:9e3c3b63950e3adffd143e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };