'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, MessageCircle, Send, Truck, Shield, ShoppingBag, Clock, Gem, Phone } from 'lucide-react'

interface WhatsAppChatProps {
  open: boolean
  onClose: () => void
  whatsappNumber: string
}

interface ChatMessage {
  id: number
  text: string
  sender: 'bot' | 'user'
  type?: 'text' | 'action'
  actions?: { label: string; action: string }[]
}

interface QuickAction {
  label: string
  action: string
  response: string
}

interface FaqItem {
  key: string
  label: string
  icon: string
  response: string
}

interface ChatbotConfig {
  greeting: string
  quick_actions: QuickAction[]
  faq_items: FaqItem[]
  whatsapp_message: string
  n8n_webhook_url: string | null
  n8n_enabled: boolean
}

const DEFAULT_CONFIG: ChatbotConfig = {
  greeting: 'Bienvenue chez Maison Dorée ! 👋 Comment puis-je vous aider ?',
  quick_actions: [
    { label: 'Voir les collections', action: 'catalogue', response: 'Découvrez notre collection complète de montres de luxe. Redirection en cours...' },
    { label: 'Passer commande', action: 'commander', response: 'Commandez facilement en remplissant notre formulaire. Paiement à la livraison ! Redirection en cours...' },
    { label: 'Parler à un conseiller', action: 'whatsapp', response: '' },
  ],
  faq_items: [
    { key: 'livraison', label: 'Livraison', icon: 'truck', response: '📦 Nous livrons dans les 58 wilayas d\'Algérie. Délai de livraison : 48h dans les grandes villes, 3-5 jours pour les autres wilayas. Chaque montre est expédiée dans un écrin de luxe avec assurance transport.' },
    { key: 'garantie', label: 'Garantie', icon: 'shield', response: '🛡️ Toutes nos montres bénéficient d\'une garantie internationale de 3 ans couvrant le mouvement et les défauts de fabrication. Les montres avec tourbillon bénéficient d\'une garantie étendue de 5 ans.' },
    { key: 'paiement', label: 'Paiement', icon: 'shopping-bag', response: '💳 Nous proposons le paiement à la livraison (COD) sur toutes nos commandes. Aucun paiement en ligne requis. Vous pouvez inspecter votre montre avant de payer.' },
    { key: 'authenticite', label: 'Authenticité', icon: 'clock', response: '✅ Toutes nos montres sont livrées avec un certificat d\'authenticité et un numéro de série unique. Nous travaillons exclusivement avec des fournisseurs agréés et des manufactures certifiées.' },
  ],
  whatsapp_message: 'Bonjour, je suis intéressé(e) par vos montres de luxe. Puis-je avoir plus d\'informations ?',
  n8n_webhook_url: null,
  n8n_enabled: false,
}

const ICON_MAP: Record<string, React.ReactNode> = {
  truck: <Truck className="w-3 h-3" />,
  shield: <Shield className="w-3 h-3" />,
  'shopping-bag': <ShoppingBag className="w-3 h-3" />,
  clock: <Clock className="w-3 h-3" />,
  gem: <Gem className="w-3 h-3" />,
  phone: <Phone className="w-3 h-3" />,
}

// Generate a session ID for n8n
function generateSessionId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

export default function WhatsAppChat({ open, onClose, whatsappNumber }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [config, setConfig] = useState<ChatbotConfig>(DEFAULT_CONFIG)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId] = useState(generateSessionId())
  const [initialized, setInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch chatbot config
  useEffect(() => {
    fetch('/api/chatbot')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setConfig({
            greeting: data.greeting || DEFAULT_CONFIG.greeting,
            quick_actions: data.quick_actions || DEFAULT_CONFIG.quick_actions,
            faq_items: data.faq_items || DEFAULT_CONFIG.faq_items,
            whatsapp_message: data.whatsapp_message || DEFAULT_CONFIG.whatsapp_message,
            n8n_webhook_url: data.n8n_webhook_url || null,
            n8n_enabled: data.n8n_enabled || false,
          })
        }
      })
      .catch(() => {
        // Keep default config
      })
  }, [])

  // Initialize greeting
  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true)
      setTimeout(() => {
        setMessages([
          {
            id: 1,
            text: config.greeting,
            sender: 'bot',
          },
          {
            id: 2,
            text: '',
            sender: 'bot',
            type: 'action',
            actions: config.quick_actions.map(a => ({ label: a.label, action: a.action })),
          },
        ])
      }, 300)
    }
  }, [open, initialized, config.greeting, config.quick_actions])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendToN8n = useCallback(async (message: string, action: string | null) => {
    if (!config.n8n_enabled || !config.n8n_webhook_url) return null

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(config.n8n_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          action,
          session_id: sessionId,
          source: 'chatbot',
          timestamp: new Date().toISOString(),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) return null

      const data = await response.json()
      return data
    } catch {
      return null
    }
  }, [config.n8n_enabled, config.n8n_webhook_url, sessionId])

  const handleAction = useCallback(async (action: string) => {
    const quickAction = config.quick_actions.find(a => a.action === action)

    // WhatsApp action — open directly
    if (action === 'whatsapp') {
      setMessages(prev => [
        ...prev,
        { id: Date.now(), text: quickAction?.label || 'Parler à un conseiller', sender: 'user' },
      ])
      openWhatsApp()
      return
    }

    // Add user message
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text: quickAction?.label || action, sender: 'user' },
    ])

    // Try n8n first
    if (config.n8n_enabled && config.n8n_webhook_url) {
      setIsTyping(true)
      const n8nResponse = await sendToN8n(quickAction?.label || action, action)
      setIsTyping(false)

      if (n8nResponse?.response) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            text: n8nResponse.response,
            sender: 'bot',
            type: n8nResponse.actions ? 'action' : 'text',
            actions: n8nResponse.actions || undefined,
          },
        ])
        return
      }
    }

    // Fallback: local config response
    const response = quickAction?.response || 'Comment puis-je vous aider ?'
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, text: response, sender: 'bot' },
    ])

    // Handle navigation for known actions
    if (action === 'catalogue') {
      setTimeout(() => { window.location.href = '/catalogue' }, 800)
    } else if (action === 'commander') {
      setTimeout(() => { window.location.href = '/commander' }, 800)
    }
  }, [config, sendToN8n])

  const handleFaqClick = useCallback(async (faq: FaqItem) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text: faq.label, sender: 'user' },
    ])

    // Try n8n first
    if (config.n8n_enabled && config.n8n_webhook_url) {
      setIsTyping(true)
      const n8nResponse = await sendToN8n(faq.label, faq.key)
      setIsTyping(false)

      if (n8nResponse?.response) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            text: n8nResponse.response,
            sender: 'bot',
            type: n8nResponse.actions ? 'action' : 'text',
            actions: n8nResponse.actions || undefined,
          },
        ])
        return
      }
    }

    // Fallback: local config response
    setMessages(prev => [
      ...prev,
      { id: Date.now() + 1, text: faq.response, sender: 'bot' },
    ])
  }, [config, sendToN8n])

  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim()
    if (!text) return

    setInputText('')
    setMessages(prev => [
      ...prev,
      { id: Date.now(), text, sender: 'user' },
    ])

    // Try n8n
    if (config.n8n_enabled && config.n8n_webhook_url) {
      setIsTyping(true)
      const n8nResponse = await sendToN8n(text, null)
      setIsTyping(false)

      if (n8nResponse?.response) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            text: n8nResponse.response,
            sender: 'bot',
            type: n8nResponse.actions ? 'action' : 'text',
            actions: n8nResponse.actions || undefined,
          },
        ])
        return
      }
    }

    // Fallback: no n8n or n8n failed
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + 1,
        text: 'Un conseiller vous répondra bientôt. Cliquez sur "Ouvrir WhatsApp" pour une réponse immédiate.',
        sender: 'bot',
      },
    ])
  }, [inputText, config, sendToN8n])

  const openWhatsApp = () => {
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '')
    const message = encodeURIComponent(config.whatsapp_message)
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!open) return null

  return (
    <div className="fixed bottom-24 right-6 z-[1000] w-[360px] max-w-[calc(100vw-48px)] animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#08080a] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col max-h-[520px]">
        {/* Header */}
        <div className="bg-[#25D366] px-4 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">MD</span>
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Maison Dorée</div>
              <div className="text-white/70 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-white rounded-full inline-block" />
                En ligne
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Fermer le chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.type === 'action' && msg.actions ? (
                <div className="flex flex-wrap gap-2 ml-2">
                  {msg.actions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => handleAction(action.action)}
                      className="bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] px-3 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#25D366]/25 transition-all duration-200"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed ${
                    msg.sender === 'bot'
                      ? 'bg-[#111113] text-[#f5f5f0] border border-white/[0.06]'
                      : 'bg-[#25D366]/15 text-[#f5f5f0] ml-auto border border-[#25D366]/20'
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-lg bg-[#111113] border border-white/[0.06]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-[#606060] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#606060] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#606060] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {/* FAQ Quick Buttons */}
          {config.faq_items.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <div className="text-[10px] tracking-[2px] uppercase text-[#606060] mb-2">
                Questions fréquentes
              </div>
              <div className="flex flex-wrap gap-1.5">
                {config.faq_items.map((faq) => (
                  <button
                    key={faq.key}
                    onClick={() => handleFaqClick(faq)}
                    className="flex items-center gap-1.5 bg-[#1a1a1e] border border-white/[0.06] text-[#a0a09a] px-2.5 py-1.5 rounded-lg text-[11px] hover:border-[#c9a84c]/30 hover:text-[#f5f5f0] transition-all duration-200"
                  >
                    {ICON_MAP[faq.icon] || <MessageCircle className="w-3 h-3" />}
                    {faq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Text Input */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez un message..."
              className="flex-1 bg-[#111113] border border-white/[0.08] text-[#f5f5f0] text-[13px] rounded-lg px-3 py-2.5 placeholder:text-[#606060] focus:outline-none focus:border-[#25D366]/40 transition-colors"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 bg-[#25D366] rounded-lg flex items-center justify-center text-white hover:bg-[#20bd5a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Envoyer le message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom WhatsApp Button */}
        <div className="border-t border-white/[0.06] p-3 flex-shrink-0">
          <button
            onClick={openWhatsApp}
            className="w-full bg-[#25D366] text-white py-3 rounded-lg text-[12px] font-bold tracking-[1.5px] uppercase flex items-center justify-center gap-2 hover:bg-[#20bd5a] transition-colors duration-200 shadow-[0_2px_16px_rgba(37,211,102,0.3)]"
          >
            <MessageCircle className="w-4 h-4" />
            Ouvrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
