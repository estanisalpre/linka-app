import { create } from "zustand";
import { storage } from "../utils/storage";
import { authApi } from "../services/api";
import { initSocket, disconnectSocket } from "../services/socket";
import { NotificationService } from "../services/notifications";

interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  photos: string[];
  birthDate: string;
  gender: string;
  interestedIn: string[];
  interests: string[];
  lookingFor: string[];
  sparks: number;
  location?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  updateUser: (updatedUser: Partial<User>) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    birthDate: string;
    gender: string;
    interestedIn: string[];
    interests?: string[];
    lookingFor?: string[];
    bio?: string;
    photos?: string[];
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(email, password);
      const { user, token } = response.data;

      await storage.setItem("auth_token", token);
      await initSocket();

      // Initialize push notifications
      await NotificationService.initialize();

      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || "Error al iniciar sesión";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      const { user, token } = response.data;

      await storage.setItem("auth_token", token);
      await initSocket();

      // Initialize push notifications
      await NotificationService.initialize();

      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      const message = error.response?.data?.error || "Error al registrarse";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    // Unregister push token
    await NotificationService.unregisterToken();
    NotificationService.cleanup();

    await storage.deleteItem("auth_token");
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const token = await storage.getItem("auth_token");

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authApi.getMe();
      await initSocket();

      // Initialize push notifications
      await NotificationService.initialize();

      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await storage.deleteItem("auth_token");
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  updateUser: (updatedUser: Partial<User>) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedUser } : state.user,
    })),

  clearError: () => set({ error: null }),
}));
