import { create } from 'zustand';
import { api } from '../services/api';

interface CategoryProgress {
  category: string;
  answered: number;
  total: number;
  isCompleted: boolean;
}

interface Question {
  id: string;
  order: number;
  type: 'TEXT' | 'CHOICE' | 'MULTIPLE' | 'THIS_OR_THAT' | 'RANKING';
  text: string;
  options?: any;
  userResponse: any | null;
  otherResponse: any | null;
  bothAnswered: boolean;
}

interface MiniGame {
  type: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  gameId?: string;
}

interface NucleusOverview {
  connection: {
    id: string;
    progress: number;
    chatLevel: 'NONE' | 'LIMITED' | 'UNLIMITED';
    status: string;
  };
  otherUser: {
    id: string;
    name: string;
    photos: string[];
  };
  sections: {
    questions: {
      categories: CategoryProgress[];
      progress: number;
      maxProgress: number;
    };
    photos: {
      userUploaded: boolean;
      otherUploaded: boolean;
      prompt: string;
      progress: number;
      maxProgress: number;
    };
    voice: {
      userSent: boolean;
      otherSent: boolean;
      prompt: string;
      progress: number;
      maxProgress: number;
    };
    games: {
      completed: number;
      total: number;
      games: MiniGame[];
      progress: number;
      maxProgress: number;
    };
  };
  sharedInterests: { interest: string; isMain: boolean }[];
}

interface CategoryData {
  category: string;
  questions: Question[];
  progress: {
    answered: number;
    total: number;
    isCompleted: boolean;
  };
}

interface NucleusState {
  overview: NucleusOverview | null;
  currentCategory: CategoryData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadOverview: (connectionId: string) => Promise<void>;
  loadCategoryQuestions: (connectionId: string, category: string) => Promise<void>;
  submitAnswer: (connectionId: string, questionId: string, response: any) => Promise<any>;
  uploadPhoto: (connectionId: string, photoUrl: string, prompt: string) => Promise<any>;
  uploadVoiceNote: (connectionId: string, audioUrl: string, duration: number, prompt: string) => Promise<any>;
  clearNucleus: () => void;
}

export const useNucleusStore = create<NucleusState>((set, get) => ({
  overview: null,
  currentCategory: null,
  isLoading: false,
  error: null,

  loadOverview: async (connectionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/nucleus/${connectionId}`);
      set({ overview: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Error al cargar el núcleo',
        isLoading: false,
      });
    }
  },

  loadCategoryQuestions: async (connectionId: string, category: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/nucleus/${connectionId}/questions/${category}`);
      set({ currentCategory: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Error al cargar preguntas',
        isLoading: false,
      });
    }
  },

  submitAnswer: async (connectionId: string, questionId: string, response: any) => {
    try {
      const result = await api.post(`/nucleus/${connectionId}/questions/${questionId}/answer`, { response });

      // Reload current category
      const { currentCategory } = get();
      if (currentCategory) {
        await get().loadCategoryQuestions(connectionId, currentCategory.category);
      }

      // Reload overview for updated progress
      await get().loadOverview(connectionId);

      return result.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al enviar respuesta' });
      return null;
    }
  },

  uploadPhoto: async (connectionId: string, photoUrl: string, prompt: string) => {
    try {
      const result = await api.post(`/nucleus/${connectionId}/photos`, { photoUrl, prompt });

      // Reload overview for updated progress
      await get().loadOverview(connectionId);

      return result.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al subir foto' });
      return null;
    }
  },

  uploadVoiceNote: async (connectionId: string, audioUrl: string, duration: number, prompt: string) => {
    try {
      const result = await api.post(`/nucleus/${connectionId}/voice`, { audioUrl, duration, prompt });

      // Reload overview for updated progress
      await get().loadOverview(connectionId);

      return result.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al enviar nota de voz' });
      return null;
    }
  },

  clearNucleus: () => {
    set({ overview: null, currentCategory: null, error: null });
  },
}));
