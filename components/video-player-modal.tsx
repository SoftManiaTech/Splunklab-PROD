"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { motion } from "framer-motion"

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
}

export function VideoPlayerModal({ isOpen, onClose, videoId }: VideoPlayerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 bg-transparent border-0 shadow-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-6 right-6 z-50 bg-black/50 hover:bg-white/70 text-white rounded-full p-2 shadow-lg transition-all"
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Video container */}
          <div className="relative w-full h-full flex items-center justify-center px-4">
            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                title="Lab Purchase Guide"
                className="w-full h-full rounded-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
