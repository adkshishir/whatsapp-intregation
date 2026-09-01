import { NextRequest } from 'next/server'
import { addMessage } from '@/lib/whatsapp/store'
import { sendWhatsAppMessage } from '@/lib/whatsapp/api'
import { WhatsAppMessage, WhatsAppWebhookPayload } from '@/lib/whatsapp/types'

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(request: Request) {
  try {
    const body: WhatsAppWebhookPayload = await request.json()

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value
        const messages = value.messages ?? []

        for (const msg of messages) {
          const from = msg.from
          const fromName = value.contacts?.[0]?.profile?.name ?? from
          const text = msg.text?.body ?? ''
          const timestamp = msg.timestamp

          const incomingMsg: WhatsAppMessage = {
            from,
            fromName,
            text,
            timestamp,
            direction: 'incoming',
            messageId: msg.id,
          }

          addMessage(from, incomingMsg)

          const welcome = `Hello ${fromName}! 👋\n\nThank you for reaching out. How can I help you today?`
          await sendWhatsAppMessage(from, welcome)

          const outgoingMsg: WhatsAppMessage = {
            from,
            fromName: 'Bot',
            text: welcome,
            timestamp: String(Math.floor(Date.now() / 1000)),
            direction: 'outgoing',
            messageId: `out_${msg.id}`,
          }
          addMessage(from, outgoingMsg)
        }
      }
    }

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response('OK', { status: 200 })
  }
}
