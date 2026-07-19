'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserSession } from '@/lib/whatsapp/types'

export default function Home() {
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setSessions(data.sessions)
    } catch {
      console.error('Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 3000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const selectedSession = sessions.find(s => s.phone === selected)
  const formatTime = (ts: string) => {
    const d = new Date(parseInt(ts) * 1000)
    return d.toLocaleTimeString()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-80 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b bg-gray-50">
          <h1 className="text-lg font-semibold">WhatsApp Chats</h1>
          <p className="text-sm text-gray-500">
            {sessions.length} active session{sessions.length !== 1 && 's'}
          </p>
        </div>
        {loading && <div className="p-4 text-gray-400">Loading...</div>}
        {!loading && sessions.length === 0 && (
          <div className="p-4 text-gray-400 text-sm">No messages yet. Send a message to your WhatsApp number.</div>
        )}
        {sessions.map(s => (
          <button
            key={s.phone}
            onClick={() => setSelected(s.phone)}
            className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
              selected === s.phone ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
          >
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-gray-400">{s.phone}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {s.messages[s.messages.length - 1]?.text ?? ''}
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {!selectedSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a chat to view messages
          </div>
        ) : (
          <>
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold">{selectedSession.name}</h2>
              <p className="text-xs text-gray-400">{selectedSession.phone}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedSession.messages.map(m => (
                <div
                  key={m.messageId}
                  className={`flex ${m.direction === 'incoming' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                      m.direction === 'incoming'
                        ? 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        : 'bg-blue-500 text-white rounded-br-sm'
                    }`}
                  >
                    <p>{m.text}</p>
                    <p className={`text-xs mt-1 ${m.direction === 'incoming' ? 'text-gray-400' : 'text-blue-100'}`}>
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
