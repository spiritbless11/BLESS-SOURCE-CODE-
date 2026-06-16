/**
 * BLESS SOURCE PLATFORM — Firebase Configuration & Adapter
 * 
 * Remplissez les clés de configuration ci-dessous avec vos identifiants Firebase.
 * Si les clés contiennent des valeurs génériques ("VOTRE_..."), le système passera
 * automatiquement en mode simulation (LocalStorage) pour que l'application reste fonctionnelle.
 */

const FIREBASE_CONFIG = {
   apiKey: "AIzaSyAIHrvCbTOhkDaM5xFb6y6KHduKMAoZ6ug",
  authDomain: "bless-code-source.firebaseapp.com",
  projectId: "bless-code-source",
  storageBucket: "bless-code-source.firebasestorage.app",
  messagingSenderId: "159511906846",
  appId: "1:159511906846:web:0bfebab0872755fc957c0f"
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
        let userCredential;
        try {
          userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        } catch (signInError) {
          // Auto-création résiliente de l'Admin Suprême s'il n'existe pas encore dans Firebase Auth
          const isAdminEmail = email.toLowerCase() === 'blessinglusakumunu1@gmail.com';
          const isUserNotFound = signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential';
          
          if (isAdminEmail && isUserNotFound) {
            console.log("🔥 Compte Admin Suprême non trouvé ou non configuré. Tentative de création automatique...");
            try {
              // On tente de créer le compte avec les identifiants fournis (généralement blessinglusakumunu1@gmail.com / spiritdelice1)
              userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
              console.log("🔥 Compte Admin Suprême créé et configuré automatiquement avec succès !");
            } catch (signUpError) {
              // Si le compte existe déjà (par exemple s'il a échoué à cause d'un mauvais mot de passe en mode protection énumération)
              if (signUpError.code === 'auth/email-already-in-use') {
                throw signInError; // Lancer l'erreur de connexion d'origine (mot de passe incorrect)
              }
              console.error("Échec de l'auto-création de l'admin suprême :", signUpError);
              throw signUpError;
            }
          } else {
            throw signInError;
          }
        }
        
        const user = userCredential.user;
        
        // Récupérer le rôle depuis Firestore (résistant aux pannes/règles de sécurité)
        let role = 'user';
        try {
          const doc = await firebase.firestore().collection('users').doc(user.uid).get();
          if (doc.exists) {
            role = doc.data().role || 'user';
          }
        } catch (e) {
          console.warn("⚠️ Impossible de lire le rôle depuis Firestore, utilisation du rôle par défaut.", e);
        }

        // Cas spécial pour l'Admin Suprême sur Firebase
        if (email.toLowerCase() === 'blessinglusakumunu1@gmail.com') {
          role = 'admin-supreme';
          // Mettre à jour dans Firestore pour s'assurer que c'est persistant (résistant aux pannes/règles)
          try {
            await firebase.firestore().collection('users').doc(user.uid).set({
              email: email.toLowerCase(),
              role: 'admin-supreme',
              lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          } catch (firestoreError) {
            console.warn("⚠️ Impossible de persister le rôle admin-supreme dans Firestore (règles de sécurité ou base non configurée) :", firestoreError);
          }
        }

        return { success: true, email: user.email, role: role, uid: user.uid };
      } catch (error) {
        throw new Error(this.getReadableAuthError(error));
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

        // Enregistrer le profil dans Firestore (résistant aux pannes/règles de sécurité)
        try {
          await firebase.firestore().collection('users').doc(user.uid).set({
            email: email.toLowerCase(),
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        } catch (firestoreError) {
          console.warn("⚠️ Compte créé avec succès, mais impossible de créer le document de profil dans Firestore (règles ou base non configurée) :", firestoreError);
        }

        return { success: true, email: user.email, role: role, uid: user.uid };
      } catch (error) {
        throw new Error(this.getReadableAuthError(error));
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

  // Traduction des erreurs Firebase en français compréhensible avec diagnostic détaillé
  getReadableAuthError(error) {
    console.error("🔥 Détail de l'erreur d'authentification :", error);
    if (!error) return "Une erreur d'authentification inconnue est survenue.";
    
    const code = error.code;
    const message = error.message;

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
        return "L'authentification par email/mot de passe n'est pas activée dans votre console Firebase.";
      case 'auth/weak-password':
        return "Le mot de passe doit contenir au moins 6 caractères.";
      case 'auth/invalid-api-key':
        return "La clé API Firebase fournie est invalide. Veuillez vérifier votre configuration.";
      case 'auth/network-request-failed':
        return "Connexion réseau impossible. Vérifiez votre connexion internet ou si l'accès à Firebase est bloqué.";
      case 'auth/invalid-credential':
        return "Identifiants incorrects ou compte non trouvé.";
      default:
        // Si c'est un message d'erreur d'origine Firestore ou autre (comme un problème de domaine non autorisé ou de permissions)
        if (message) {
          // Nettoyer un peu les préfixes Firebase complexes pour l'utilisateur final
          return message.replace("Firebase: ", "");
        }
        return "Une erreur d'authentification est survenue. Veuillez réessayer.";
    }
  }
}

// Exposer globalement l'adaptateur
window.dbAdapter = new DatabaseAdapter();
