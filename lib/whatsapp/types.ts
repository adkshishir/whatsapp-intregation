export interface WhatsAppMessage {
  from: string
  fromName: string
  text: string
  timestamp: string
  direction: 'incoming' | 'outgoing'
  messageId: string
}

export interface UserSession {
  phone: string
  name: string
  lastMessageAt: number
  messages: WhatsAppMessage[]
}

export interface WhatsAppWebhookPayload {
  object: string
  entry: {
    id: string
    changes: {
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: {
          profile: { name: string }
          wa_id: string
        }[]
        messages?: {
          from: string
          id: string
          timestamp: string
          text?: { body: string }
          type: string
        }[]
      }
      field: string
    }[]
  }[]
}
