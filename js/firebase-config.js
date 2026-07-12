const firebaseConfig = {
  apiKey: "AIzaSyA5sLgo0jEnoDpNrsKSnkLTqm20k_vMC-w",
  authDomain: "utl-studentbus-gps-e1684.firebaseapp.com",
  projectId: "utl-studentbus-gps-e1684",
  storageBucket: "utl-studentbus-gps-e1684.firebasestorage.app",
  messagingSenderId: "940636407888",
  appId: "1:940636407888:web:63ee7d574477776d61e955"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore();
