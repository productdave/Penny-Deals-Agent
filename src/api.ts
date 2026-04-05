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
