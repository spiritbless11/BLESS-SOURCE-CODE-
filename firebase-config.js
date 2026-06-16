/**
 * BLESS SOURCE PLATFORM — Firebase Configuration & Adapter
 * 
 * Remplissez les clés de configuration ci-dessous avec vos identifiants Firebase.
 * Si les clés contiennent des valeurs génériques ("VOTRE_..."), le système passera
 * automatiquement en mode simulation (LocalStorage) pour que l'application reste fonctionnelle.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDClf8oG0sQraZuBym5IC2tvZyWHUnBCU0",
  authDomain: "uk-contact-collector-d1d5a.firebaseapp.com",
  projectId: "https://uk-contact-collector-d1d5a-default-rtdb.firebaseio.com",
  storageBucket: "VOTRuk-contact-collector-d1d5a.firebasestorage.app",
  messagingSenderId: "1069663576024",
  appId: "V1:1069663576024:web:a18e5516b5d899998edcad"
};

// Variable globale pour déterminer si Firebase est actif
let firebaseActive = false;

// Initialiser Firebase si la configuration est valide
try {
  const isPlaceholder = Object.values(FIREBASE_CONFIG).some(val => 
    val === "" || val.startsWith("VOTRE_") || val.includes("YOUR_")
  );

  if (!isPlaceholder && typeof firebase !== 'undefined') {
    firebase.initializeApp(FIREBASE_CONFIG);
    firebaseActive = true;
    console.log("🔥 Firebase initialisé avec succès !");
  } else {
    console.log("ℹ️ Firebase non configuré ou clés invalides. Passage en mode simulation (LocalStorage).");
  }
} catch (error) {
  console.error("⚠️ Erreur lors de l'initialisation de Firebase :", error);
}

// Classe d'accès aux données unifiée (Firebase ou LocalStorage)
class DatabaseAdapter {
  constructor() {
    this.isFirebase = firebaseActive;
  }

  // Connexion de l'utilisateur
  async signIn(email, password) {
    if (this.isFirebase) {
      try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Récupérer le rôle depuis Firestore
        let role = 'user';
        try {
          const doc = await firebase.firestore().collection('users').doc(user.uid).get();
          if (doc.exists) {
            role = doc.data().role || 'user';
          }
        } catch (e) {
          console.warn("Impossible de lire le rôle depuis Firestore, utilisation du rôle par défaut.", e);
        }

        // Cas spécial pour l'Admin Suprême sur Firebase
        if (email.toLowerCase() === 'blessinglusakumunu1@gmail.com') {
          role = 'admin-supreme';
          // Mettre à jour dans Firestore pour s'assurer que c'est persistant
          await firebase.firestore().collection('users').doc(user.uid).set({
            email: email,
            role: 'admin-supreme',
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }

        return { success: true, email: user.email, role: role, uid: user.uid };
      } catch (error) {
        throw new Error(this.getReadableAuthError(error.code));
      }
    } else {
      // Mode simulation LocalStorage
      const users = JSON.parse(localStorage.getItem('bl-users') || '[]');
      
      // Compte Admin Suprême codé en dur dans le simulateur
      if (email.toLowerCase() === 'blessinglusakumunu1@gmail.com') {
        if (password === 'spiritdelice1') {
          return { success: true, email: email, role: 'admin-supreme', uid: 'admin-supreme-uid' };
        } else {
          throw new Error("Mot de passe administrateur incorrect.");
        }
      }

      // Recherche de l'utilisateur
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!foundUser) {
        throw new Error("Aucun compte trouvé avec cet email.");
      }
      if (foundUser.password !== password) {
        throw new Error("Mot de passe incorrect.");
      }

      return { success: true, email: foundUser.email, role: foundUser.role || 'user', uid: foundUser.uid };
    }
  }

  // Inscription de l'utilisateur
  async signUp(email, password) {
    if (this.isFirebase) {
      try {
        // Validation basique
        if (email.toLowerCase() === 'blessinglusakumunu1@gmail.com') {
          throw new Error("Ce compte administrateur est réservé. Veuillez vous connecter directement.");
        }

        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const role = 'user'; // Rôle standard par défaut

        // Enregistrer le profil dans Firestore
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: email.toLowerCase(),
          role: role,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, email: user.email, role: role, uid: user.uid };
      } catch (error) {
        throw new Error(this.getReadableAuthError(error.code));
      }
    } else {
      // Mode simulation LocalStorage
      const users = JSON.parse(localStorage.getItem('bl-users') || '[]');
      
      if (email.toLowerCase() === 'blessinglusakumunu1@gmail.com') {
        throw new Error("Ce compte administrateur est réservé. Veuillez vous connecter directement.");
      }

      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        throw new Error("Cet email est déjà utilisé par un autre compte.");
      }

      const newUser = {
        uid: 'user-' + Date.now(),
        email: email,
        password: password,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('bl-users', JSON.stringify(users));

      return { success: true, email: newUser.email, role: newUser.role, uid: newUser.uid };
    }
  }

  // Traduction des erreurs Firebase en français compréhensible
  getReadableAuthError(code) {
    switch (code) {
      case 'auth/invalid-email':
        return "L'adresse email n'est pas valide.";
      case 'auth/user-disabled':
        return "Ce compte utilisateur a été désactivé.";
      case 'auth/user-not-found':
        return "Aucun compte correspondant à cette adresse email.";
      case 'auth/wrong-password':
        return "Le mot de passe saisi est incorrect.";
      case 'auth/email-already-in-use':
        return "Cette adresse email est déjà associée à un autre compte.";
      case 'auth/operation-not-allowed':
        return "L'inscription par email/mot de passe n'est pas activée dans Firebase.";
      case 'auth/weak-password':
        return "Le mot de passe doit contenir au moins 6 caractères.";
      default:
        return "Une erreur d'authentification est survenue. Veuillez réessayer.";
    }
  }
}

// Exposer globalement l'adaptateur
window.dbAdapter = new DatabaseAdapter();
