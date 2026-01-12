import { create } from 'zustand';
import { connectionApi, missionApi, messageApi } from '../services/api';

interface OtherUser {
  id: string;
  name: string;
  photos: string[];
  bio?: string;
  interests?: string[];
  values?: string[];
  location?: string;
}

interface MissionTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  content: any;
  category: string;
  difficulty: number;
  points: number;
  isMainInterest?: boolean;
  isSharedInterest?: boolean;
}

interface MissionRound {
  id: string;
  roundNumber: number;
  status: 'VOTING' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'SKIPPED';
  votingEndsAt?: string;
  missionEndsAt?: string;
}

interface SharedInterest {
  interest: string;
  weight: number;
  isMain: boolean;
}

interface Connection {
  id: string;
  initiatorId: string;
  receiverId: string;
  status: 'PENDING' | 'LATER' | 'ACTIVE' | 'COMPLETED' | 'COOLED' | 'ENDED';
  progress: number;
  chatUnlocked: boolean;
  temperature: string;
  compatibilityScore: number;
  seenByReceiver: boolean;
  lastActivity: string;
  otherUser: OtherUser;
  isInitiator: boolean;
  currentMission?: MissionTemplate;
  currentRound?: MissionRound;
  sharedInterests?: SharedInterest[];
  chatLevel?: 'none' | 'guided' | 'voice' | 'full';
}

interface PendingCounts {
  pending: number;
  later: number;
  unseen: number;
  rejected: number;
  total: number;
}

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    photos: string[];
  };
}

interface CurrentRoundState {
  round: MissionRound | null;
  options: MissionTemplate[];
  selectedMission: MissionTemplate | null;
  voting: {
    userVoted: boolean;
    userVoteId?: string;
    otherVoted: boolean;
    otherVoteId?: string;
  };
  responses: {
    userResponded: boolean;
    otherResponded: boolean;
    userResponse: any;
    otherResponse: any;
  };
  sharedInterests: SharedInterest[];
}

interface ConnectionState {
  connections: Connection[];
  activeConnection: Connection | null;
  pendingCounts: PendingCounts;
  currentRound: CurrentRoundState | null;
  otherUserPresent: boolean;
  messages: Message[];
  isLoading: boolean;
  error: string | null;

  // Actions
  loadConnections: (params?: { status?: string; sortBy?: string; filter?: string }) => Promise<void>;
  loadPendingCounts: () => Promise<void>;
  loadConnection: (connectionId: string) => Promise<void>;
  initiateConnection: (targetUserId: string) => Promise<string | null>;
  acceptConnection: (connectionId: string) => Promise<boolean>;
  postponeConnection: (connectionId: string) => Promise<boolean>;
  declineConnection: (connectionId: string) => Promise<boolean>;
  loadCurrentRound: (connectionId: string) => Promise<void>;
  submitVote: (connectionId: string, missionOptionId: string) => Promise<any>;
  submitMissionResponse: (connectionId: string, response: any) => Promise<any>;
  setOtherUserPresent: (present: boolean) => void;
  loadMessages: (connectionId: string) => Promise<void>;
  sendMessage: (connectionId: string, content: string, type?: string) => Promise<boolean>;
  addMessage: (message: Message) => void;
  clearActiveConnection: () => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  activeConnection: null,
  pendingCounts: { pending: 0, later: 0, unseen: 0, rejected: 0, total: 0 },
  currentRound: null,
  otherUserPresent: false,
  messages: [],
  isLoading: false,
  error: null,

  loadConnections: async (params) => {
    set({ isLoading: true });
    try {
      const response = await connectionApi.getAll(params);
      set({ connections: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Error al cargar conexiones',
        isLoading: false,
      });
    }
  },

  loadPendingCounts: async () => {
    try {
      const response = await connectionApi.getPendingCount();
      set({ pendingCounts: response.data });
    } catch (error: any) {
      console.error('Error loading pending counts:', error);
    }
  },

  loadConnection: async (connectionId) => {
    set({ isLoading: true });
    try {
      const response = await connectionApi.getOne(connectionId);
      set({ activeConnection: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Error al cargar conexión',
        isLoading: false,
      });
    }
  },

  initiateConnection: async (targetUserId) => {
    try {
      const response = await connectionApi.initiate(targetUserId);
      const { connections } = get();
      set({ connections: [...connections, response.data] });
      return response.data.id; // Return the connection ID
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al iniciar conexión' });
      return null;
    }
  },

  acceptConnection: async (connectionId) => {
    try {
      const response = await connectionApi.accept(connectionId);
      const { connections } = get();
      set({
        connections: connections.map((c) =>
          c.id === connectionId ? response.data : c
        ),
        activeConnection: response.data,
      });
      // Reload counts
      get().loadPendingCounts();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al aceptar conexión' });
      return false;
    }
  },

  postponeConnection: async (connectionId) => {
    try {
      await connectionApi.postpone(connectionId);
      const { connections } = get();
      set({
        connections: connections.map((c) =>
          c.id === connectionId ? { ...c, status: 'LATER' as const } : c
        ),
      });
      // Reload counts
      get().loadPendingCounts();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al posponer conexión' });
      return false;
    }
  },

  declineConnection: async (connectionId) => {
    try {
      await connectionApi.decline(connectionId);
      const { connections } = get();
      set({
        connections: connections.filter((c) => c.id !== connectionId),
      });
      // Reload counts
      get().loadPendingCounts();
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al rechazar conexión' });
      return false;
    }
  },

  loadCurrentRound: async (connectionId: string) => {
    try {
      const response = await missionApi.getCurrentRound(connectionId);
      set({ currentRound: response.data });
    } catch (error: any) {
      set({ currentRound: null });
    }
  },

  submitVote: async (connectionId: string, missionOptionId: string) => {
    try {
      const result = await missionApi.vote(connectionId, missionOptionId);

      // Reload round state
      await get().loadCurrentRound(connectionId);

      return result.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al votar' });
      return null;
    }
  },

  submitMissionResponse: async (connectionId: string, response: any) => {
    try {
      const result = await missionApi.respond(connectionId, response);

      // Reload round state
      await get().loadCurrentRound(connectionId);

      // If mission completed, reload connection for updated progress
      if (result.data.missionCompleted) {
        await get().loadConnection(connectionId);
      }

      return result.data;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al enviar respuesta' });
      return null;
    }
  },

  setOtherUserPresent: (present: boolean) => {
    set({ otherUserPresent: present });
  },

  loadMessages: async (connectionId) => {
    set({ isLoading: true });
    try {
      const response = await messageApi.getMessages(connectionId);
      set({ messages: response.data.messages, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Error al cargar mensajes',
        isLoading: false,
      });
    }
  },

  sendMessage: async (connectionId, content, type = 'TEXT') => {
    try {
      const response = await messageApi.send(connectionId, content, type);
      const { messages } = get();
      set({ messages: [...messages, response.data] });
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.error || 'Error al enviar mensaje' });
      return false;
    }
  },

  addMessage: (message) => {
    const { messages } = get();
    // Avoid duplicates
    if (!messages.find((m) => m.id === message.id)) {
      set({ messages: [...messages, message] });
    }
  },

  clearActiveConnection: () => {
    set({ activeConnection: null, currentRound: null, otherUserPresent: false, messages: [] });
  },
}));
