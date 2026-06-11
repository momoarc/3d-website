'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import WhatsAppChat from './WhatsAppChat'

export default function WhatsAppButton() {
  const [chatOpen, setChatOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('+213XXXXXXXXX')

  useEffect(() => {
    // Fetch WhatsApp settings
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        if (data?.whatsapp_number) {
          setWhatsappNumber(data.whatsapp_number)
        }
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2">
        {/* Chat badge on hover */}
        <div
          className={`transition-all duration-200 ${
            hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
        >
          <span className="bg-[#25D366] text-white text-[11px] font-semibold tracking-[1px] uppercase px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            Chat
          </span>
        </div>

        <button
          onClick={() => setChatOpen(!chatOpen)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_32px_rgba(37,211,102,0.55)] hover:scale-110 transition-all duration-200 group"
          aria-label="Ouvrir le chat WhatsApp"
        >
          <Image src="/images/whatsapp.png" alt="WhatsApp" width={30} height={30} className="object-contain" />

          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
        </button>
      </div>

      {/* Chat Widget */}
      <WhatsAppChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        whatsappNumber={whatsappNumber}
      />
    </>
  )
}
