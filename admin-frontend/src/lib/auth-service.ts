import { AuthUser } from '@/types/auth';
import {
    signOut as firebaseSignOut,
    User as FirebaseUser,
    getIdToken,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { api } from './api';
import { firebaseAuth } from './firebase';
import { Log } from './log';


export interface SignInCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access_token: string;
    user: AuthUser;
    is_new_user: boolean;
    message: string;
}


// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');


interface AuthStorageData {
    isAuthenticated: boolean;
    token: string | null;
    user: AuthUser | null;
}

export class AuthService {
    private static instance: AuthService;
    private static currentFirebaseUser: FirebaseUser | null = null;

    private constructor() { }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    /**
     * Initialize Firebase auth state listener
     */
    static initializeAuthListener(): () => void {
        return onAuthStateChanged(firebaseAuth, (user) => {
            this.currentFirebaseUser = user;
        });
    }

    /**
     * Sign in with email and password using Firebase
     */
    static async signInWithEmailPassword(credentials: {
        email: string;
        password: string;
    }): Promise<AuthResponse> {
        try {
            const userCredential = await signInWithEmailAndPassword(firebaseAuth, credentials.email, credentials.password);
            const firebaseUser = userCredential.user;
            const firebaseToken = await getIdToken(firebaseUser);
            return await this.authenticateWithBackend(firebaseToken);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sign in with Google using Firebase
     */
    static async signInWithGoogle(): Promise<AuthResponse> {
        try {
            const result = await signInWithPopup(firebaseAuth, googleProvider);
            const firebaseUser = result.user;

            // Get Firebase ID token
            const firebaseToken = await getIdToken(firebaseUser);

            // Authenticate with backend using Firebase UID
            return await this.authenticateWithBackend(firebaseToken);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Authenticate with the Django backend using Firebase token and UID
     */
    static async authenticateWithBackend(firebaseToken: string): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/auth/', {
                firebase_token: firebaseToken,
            });

            // Store token and user data
            this.saveAuthStorageData({
                isAuthenticated: true,
                token: response.access_token,
                user: response.user
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Sign out from Firebase and clear local storage
     */
    static async signOut(): Promise<void> {
        try {
            await firebaseSignOut(firebaseAuth);
            this.clearAuthStorageData();
            this.currentFirebaseUser = null;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current Firebase user
     */
    static getCurrentFirebaseUser(): FirebaseUser | null {
        return this.currentFirebaseUser || firebaseAuth.currentUser;
    }

    /**
     * Refresh Firebase token and re-authenticate with backend
     */
    static async refreshToken(): Promise<string | null> {
        try {
            const currentUser = this.getCurrentFirebaseUser();
            if (!currentUser) {
                return null;
            }

            // Force refresh Firebase token
            const firebaseToken = await getIdToken(currentUser, true);

            // Re-authenticate with backend
            const response = await this.authenticateWithBackend(firebaseToken);

            return response.access_token;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get current authentication state
     */
    static getAuthStorageData(): { isAuthenticated: boolean; token: string | null; user: any | null } {
        let data = localStorage.getItem('auth_data');
        let response: AuthStorageData = {
            user: null,
            token: null,
            isAuthenticated: false,
        }

        try {
            if (data) {
                const parsedData = JSON.parse(data);
                response.isAuthenticated = parsedData.isAuthenticated || false;
                response.token = parsedData.token || null;
                response.user = parsedData.user || null;
            }
        } catch (error) {
            Log.error('Failed to parse auth data from localStorage:', error);
        }

        return response
    }

    /**
     * Store authentication data in localStorage
     */
    private static saveAuthStorageData(data: AuthStorageData): void {
        try {
            localStorage.setItem('auth_data', JSON.stringify(data));
        } catch (error) {
            Log.error('Failed to store auth data in localStorage:', error);
        }
    }

    public static clearAuthStorageData(): void {
        try {
            localStorage.removeItem('auth_data');
        } catch (error) {
            Log.error('Failed to clear auth data from localStorage:', error);
        }
    }
}