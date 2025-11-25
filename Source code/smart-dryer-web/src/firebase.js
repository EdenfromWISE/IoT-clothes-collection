// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHrYwsddF1Lo_52iU6rDfwajyjWVLdvl8",
  authDomain: "iot-ptit-123.firebaseapp.com",
  projectId: "iot-ptit-123",
  storageBucket: "iot-ptit-123.firebasestorage.app",
  messagingSenderId: "1050695757422",
  appId: "1:1050695757422:web:b89c7e07cd0f57c116407f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export các dịch vụ bạn cần sử dụng trong ứng dụng
export const auth = getAuth(app);
export const db = getFirestore(app);
