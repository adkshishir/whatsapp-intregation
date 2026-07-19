import { UserSession, WhatsAppMessage } from './types'

const TTL_MS = 24 * 60 * 60 * 1000
const sessions = new Map<string, UserSession>()

function getKey(phone: string): string {
  return phone
}

setInterval(() => {
  const now = Date.now()
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastMessageAt > TTL_MS) {
      sessions.delete(key)
    }
  }
}, 60_000)

export function getOrCreateSession(phone: string, name: string): UserSession {
  const key = getKey(phone)
  if (!sessions.has(key)) {
    sessions.set(key, { phone, name, lastMessageAt: Date.now(), messages: [] })
  }
  return sessions.get(key)!
}

export function addMessage(phone: string, msg: WhatsAppMessage): UserSession {
  const session = getOrCreateSession(phone, msg.fromName)
  session.messages.push(msg)
  session.lastMessageAt = Date.now()
  return session
}

export function getAllSessions(): UserSession[] {
  const now = Date.now()
  return Array.from(sessions.values())
    .filter(s => now - s.lastMessageAt <= TTL_MS)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
}

export function getSessionByPhone(phone: string): UserSession | undefined {
  return sessions.get(getKey(phone))
}
