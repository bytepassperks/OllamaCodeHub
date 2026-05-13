"use client";

import { apiClient } from "./api";

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  queriesUsed: number;
}

const TOKEN_KEY = "ollamacodehub_token";
const USER_KEY = "ollamacodehub_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === "ADMIN";
}

export async function login(email: string, password: string) {
  const data = await apiClient("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuth(data.token, data.user);
  return data;
}

export async function signup(email: string, password: string, name?: string) {
  const data = await apiClient("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  setAuth(data.token, data.user);
  return data;
}

export async function fetchMe() {
  const token = getToken();
  if (!token) return null;
  try {
    const user = await apiClient("/auth/me", { token });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    clearAuth();
    return null;
  }
}
