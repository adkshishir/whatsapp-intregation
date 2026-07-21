import { NextRequest } from 'next/server'
import { addMessage } from '@/lib/whatsapp/store'
import { sendWhatsAppMessage, sendInteractiveButtons } from '@/lib/whatsapp/api'
import { WhatsAppMessage, WhatsAppWebhookPayload } from '@/lib/whatsapp/types'

const VERIFY_TOKEN = 'dev_verify_token'

const MENU_OPTIONS = [
  { id: 'services', title: 'Our Services' },
  { id: 'support', title: 'Customer Support' },
  { id: 'send_message', title: '✏️ Send Message' },
]

const OPTION_RESPONSES: Record<string, string> = {
  services: 'We offer:\n• Web Development\n• Mobile Apps\n• AI Solutions\n• Cloud Services\n\n📍 Location: Kathmandu, Nepal\n📞 Phone: +977 976-4399832\n\nReply with any message to see the menu again.',
  support: 'Our support team is available Mon-Fri 9AM-6PM. For urgent issues, call +977-976-4399832.\n\n📍 Location: Kathmandu, Nepal\n✉️ Email: support@example.com\n\nReply with any message to see the menu again.',
  send_message: 'Sure! Please type your message below and send it. I will get back to you as soon as possible.',
}

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
          const timestamp = msg.timestamp

          let incomingText: string
          let replyText: string

          if (msg.type === 'interactive' && msg.interactive?.button_reply) {
            const buttonId = msg.interactive.button_reply.id
            incomingText = `[Menu selection] ${msg.interactive.button_reply.title}`
            replyText = OPTION_RESPONSES[buttonId] ?? 'Option not found. Reply with any message to see the menu.'
          } else {
            incomingText = msg.text?.body ?? ''
            replyText = `Welcome ${fromName}! 👋\n\nHow can I assist you today? Choose an option below:`
          }

          const incomingMsg: WhatsAppMessage = {
            from,
            fromName,
            text: incomingText,
            timestamp,
            direction: 'incoming',
            messageId: msg.id,
          }

          addMessage(from, incomingMsg)

          if (msg.type === 'interactive' && msg.interactive?.button_reply) {
            await sendWhatsAppMessage(from, replyText)
          } else {
            await sendInteractiveButtons(from, replyText, MENU_OPTIONS)
          }

          const outgoingMsg: WhatsAppMessage = {
            from,
            fromName: 'Bot',
            text: replyText,
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
