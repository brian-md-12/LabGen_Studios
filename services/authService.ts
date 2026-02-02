import { User } from '../types';

const MOCK_USER_KEY = 'labgen_hackathon_user';

// HARDCODED GUEST FOR HACKATHON
const GUEST_RESEARCHER: User = {
  id: 'hackathon-judge-2025',
  email: 'judge@gemini-hackathon.com',
  name: 'Gemini Judge',
  avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Gemini3`,
  apiMode: 'admin',
  role: 'educator',
  subscriptionStatus: 'pro', // Force Pro for hackathon
  isSuperAdmin: true,
  createdAt: new Date().toISOString(),
  provider: 'local',
  tutorialFlags: {
    general: true,
    curriculum: true,
    report: true,
    export: true,
    review: true
  }
};

export const getCurrentUser = (): User | null => {
  return GUEST_RESEARCHER;
};

export const updateUserProfile = async (updates: Partial<User>): Promise<User> => {
  // For hackathon, we just echo back the updates into the local session
  const saved = localStorage.getItem(MOCK_USER_KEY);
  const current = saved ? JSON.parse(saved) : GUEST_RESEARCHER;
  const updated = { ...current, ...updates };
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
  return updated;
};

export const signInWithGoogle = async (): Promise<void> => {
  console.log("OAuth Bypassed for Hackathon Edition");
};

export const signUp = async (name: string, email: string): Promise<User> => {
  return { ...GUEST_RESEARCHER, name, email };
};

export const signIn = async (): Promise<User> => {
  return GUEST_RESEARCHER;
};

export const signOut = async () => {
  localStorage.removeItem(MOCK_USER_KEY);
  window.location.reload();
};