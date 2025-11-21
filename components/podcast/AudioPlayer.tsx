"use client"

import { Button } from "@/components/ui/button"
import { motion } from 'framer-motion'
import { Download, Loader, Pause, Play } from "lucide-react"

export interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  audioSrc: string
  isPlaying: boolean
  isAudioLoading: boolean
  onTogglePlayPause: () => void
  onDownload: () => void
  onLoadedData: () => void
}

export const AudioPlayer = ({
  audioRef,
  audioSrc,
  isPlaying,
  isAudioLoading,
  onTogglePlayPause,
  onDownload,
  onLoadedData,
}: AudioPlayerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="space-y-2"
  >
    <audio
      ref={audioRef}
      src={audioSrc}
      className="w-full"
      controls
      onLoadedData={onLoadedData}
    />
    
    <div className="flex space-x-2">
      <Button
        onClick={onTogglePlayPause}
        className="flex-grow bg-gradient-to-r from-orange-500 to-black text-white font-light"
        disabled={isAudioLoading}
      >
        {isAudioLoading ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Loading Audio
          </>
        ) : isPlaying ? (
          <>
            <Pause className="mr-2 h-4 w-4" />
            Pause Audio
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Play Audio
          </>
        )}
      </Button>
      
      <Button
        onClick={onDownload}
        className="bg-orange-500 hover:bg-orange-600 text-black"
        disabled={isAudioLoading}
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  </motion.div>
)

