const WHATSAPP_API_BASE = 'https://graph.facebook.com/v22.0'

function getConfig() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    throw new Error('WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID must be set')
  }
  return { token, phoneNumberId }
}

export async function sendWhatsAppMessage(to: string, text: string) {
  const { token, phoneNumberId } = getConfig()

  const res = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${err}`)
  }

  return res.json()
}

export async function sendInteractiveButtons(to: string, bodyText: string, buttons: { id: string; title: string }[]) {
  const { token, phoneNumberId } = getConfig()

  const res = await fetch(`${WHATSAPP_API_BASE}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: {
          buttons: buttons.map(b => ({
            type: 'reply',
            reply: b,
          })),
        },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${err}`)
  }

  return res.json()
}
