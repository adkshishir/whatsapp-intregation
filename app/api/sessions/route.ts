import { getAllSessions } from '@/lib/whatsapp/store'

export async function GET() {
  const sessions = getAllSessions()
  return Response.json({ sessions })
}
