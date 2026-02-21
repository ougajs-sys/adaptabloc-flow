export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  facebook_id?: string;
  google_id?: string;
  provider: "facebook" | "google" | "email";
  sector?: string;
  role: string;
  created_at: string;
  has_completed_onboarding: boolean;
}

const STORAGE_KEY = "easyflow_user";

export function saveUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function markOnboardingComplete(): void {
  const user = getUser();
  if (user) {
    user.has_completed_onboarding = true;
    saveUser(user);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockFacebookLogin(): Promise<User> {
  await delay(800);
  const user: User = {
    id: "fb_" + Math.random().toString(36).slice(2, 10),
    name: "Amadou Diallo",
    email: "amadou.diallo@facebook.com",
    avatar_url: "https://i.pravatar.cc/150?u=facebook_amadou",
    facebook_id: "10224567890123456",
    provider: "facebook",
    role: "admin",
    created_at: new Date().toISOString(),
    has_completed_onboarding: false,
  };
  saveUser(user);
  return user;
}

export async function mockGoogleLogin(): Promise<User> {
  await delay(800);
  const user: User = {
    id: "g_" + Math.random().toString(36).slice(2, 10),
    name: "Fatou Keita",
    email: "fatou.keita@gmail.com",
    avatar_url: "https://i.pravatar.cc/150?u=google_fatou",
    google_id: "112345678901234567890",
    provider: "google",
    role: "admin",
    created_at: new Date().toISOString(),
    has_completed_onboarding: false,
  };
  saveUser(user);
  return user;
}

export async function mockEmailLogin(email: string, _password: string): Promise<User> {
  await delay(600);
  const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const user: User = {
    id: "em_" + Math.random().toString(36).slice(2, 10),
    name,
    email,
    avatar_url: `https://i.pravatar.cc/150?u=${encodeURIComponent(email)}`,
    provider: "email",
    role: "admin",
    created_at: new Date().toISOString(),
    has_completed_onboarding: false,
  };
  saveUser(user);
  return user;
}
