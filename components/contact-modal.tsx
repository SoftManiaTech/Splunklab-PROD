"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageCircle, Mail, Calendar, Headphones } from "lucide-react"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const handleContactOption = (type: "call" | "whatsapp" | "email" | "schedule") => {
    switch (type) {
      case "call":
        window.open("tel:+919876543210", "_self")
        break
      case "whatsapp":
        window.open("https://wa.me/918317349618?text=Hi, I'm interested in Splunk Lab Environments", "_blank")
        break
      case "email":
        window.open("mailto:info@softmania.in?subject=Splunk Lab Environment Inquiry", "_self")
        break
      case "schedule":
        window.open("https://bookings.softmania.in/#/services", "_blank")
        break
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Contact Our Sales Team
          </DialogTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Choose your preferred way to connect with our Splunk experts
          </p>
        </DialogHeader>
        <div className="space-y-4 p-6 pt-0">
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => handleContactOption("whatsapp")}
              className="bg-green-600 hover:bg-green-700 text-white flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <MessageCircle className="w-6 h-6 group-hover:animate-bounce" />
              <div className="text-center">
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs opacity-90">Instant chat</div>
              </div>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleContactOption("email")}
              variant="outline"
              className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <Mail className="w-6 h-6 group-hover:animate-pulse" />
              <div className="text-center">
                <div className="font-medium">Email Us</div>
                <div className="text-xs opacity-70">Get details</div>
              </div>
            </Button>
            <Button
              onClick={() => handleContactOption("schedule")}
              variant="outline"
              className="flex flex-col items-center gap-2 py-6 h-auto group transition-all duration-300 hover:scale-105 hover:shadow-md"
            >
              <Calendar className="w-6 h-6 group-hover:animate-pulse" />
              <div className="text-center">
                <div className="font-medium">Schedule</div>
                <div className="text-xs opacity-70">Book meeting</div>
              </div>
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full mt-4">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
