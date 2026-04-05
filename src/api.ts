import { TrackedItem, Message } from './types';

// --- Tracked Items ---

export async function fetchItems(): Promise<TrackedItem[]> {
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export async function createItem(item: Omit<TrackedItem, 'id'>): Promise<TrackedItem> {
  const res = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json();
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

export interface PriceHistoryRow {
  id: number;
  itemId: string;
  price: number;
  source: string | null;
  recordedAt: string | number | Date;
}

export async function fetchPriceHistory(itemId: string): Promise<PriceHistoryRow[]> {
  const res = await fetch(`/api/items/${itemId}/price-history`);
  if (!res.ok) throw new Error('Failed to fetch price history');
  return res.json();
}

export interface AlternativePick {
  title: string;
  url: string | null;
  estimated_price: number | null;
  notes?: string | null;
}

export interface AlternativesResponse {
  messageMarkdown: string;
  alternatives: AlternativePick[];
}

export async function fetchAlternatives(itemId: string): Promise<AlternativesResponse> {
  const res = await fetch('/api/chat/alternatives', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to fetch alternatives');
  return {
    messageMarkdown: data.messageMarkdown ?? '',
    alternatives: data.alternatives ?? [],
  };
}

// --- Chat ---

export async function createChatSession(): Promise<{ id: string }> {
  const res = await fetch('/api/chat/sessions', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create chat session');
  return res.json();
}

export async function fetchMessages(sessionId: string): Promise<Message[]> {
  const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function saveMessage(sessionId: string, message: Omit<Message, 'id'>): Promise<Message> {
  const res = await fetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
  if (!res.ok) throw new Error('Failed to save message');
  return res.json();
}

// --- Jobs ---

export interface PriceCheckResult {
  name: string;
  oldPrice: number;
  newPrice: number | null;
  targetPrice: number;
  source: string | null;
  confidence: string;
  status: 'price_drop' | 'price_increase' | 'no_change' | 'skipped';
  hitTarget: boolean;
  emailSent: boolean;
  emailError?: string;
}

export async function triggerPriceCheck(): Promise<PriceCheckResult[]> {
  const res = await fetch('/api/jobs/price-check', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Price check failed');
  return data.results;
}

export async function sendTestEmail(email?: string): Promise<string> {
  const res = await fetch('/api/jobs/test-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Failed to send test email');
  return data.message;
}
