// src/types/profile.ts

export interface MyProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  twoFactorEnabled: boolean;
  lastLogin: string | null;
  sessions?: SessionInfo[];
}

export interface UpdateMyProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
}

export interface SessionInfo {
  sessionId: string;
  device: string;
  ip: string;
  lastActive: string;
}
