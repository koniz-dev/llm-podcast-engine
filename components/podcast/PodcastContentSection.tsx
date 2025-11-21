"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from 'framer-motion'
import { AudioPlayer, AudioPlayerProps } from "./AudioPlayer"

interface PodcastContentSectionProps {
  isLoading: boolean
  newsScript: string
  currentStatus: string
  showAudio: boolean
  scrollAreaRef: React.RefObject<HTMLDivElement | null>
  audioPlayerProps: AudioPlayerProps
}

export const PodcastContentSection = ({
  isLoading,
  newsScript,
  currentStatus,
  showAudio,
  scrollAreaRef,
  audioPlayerProps,
}: PodcastContentSectionProps) => (
  <motion.div
    className="w-full lg:w-1/2 lg:flex-shrink-0 lg:min-w-0 flex flex-col bg-black rounded-lg relative overflow-hidden h-full"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {isLoading && !newsScript ? (
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-black flex items-center justify-center">
        <p className="text-white text-center">{currentStatus}</p>
      </div>
    ) : (
      <div className="flex flex-col h-full">
        {currentStatus && (
          <div className="bg-orange-500 text-black p-2 rounded-md mb-2 flex-shrink-0">
            {currentStatus}
          </div>
        )}
        
        <ScrollArea 
          className="flex-1 min-h-0 rounded-md p-4 bg-black" 
          ref={scrollAreaRef}
        >
          <pre className="whitespace-pre-wrap font-light text-white">
            {newsScript}
          </pre>
        </ScrollArea>

        {showAudio && (
          <div className="flex-shrink-0 mt-4">
            <AudioPlayer {...audioPlayerProps} />
          </div>
        )}
      </div>
    )}
  </motion.div>
)

