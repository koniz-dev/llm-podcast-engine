"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion, Variants } from 'framer-motion'
import { useCallback, useRef, useState } from "react"
import { Header } from "@/components/podcast/Header"
import { UrlInputSection } from "@/components/podcast/UrlInputSection"
import { PodcastContentSection } from "@/components/podcast/PodcastContentSection"
import { AudioPlayerProps } from "@/components/podcast/AudioPlayer"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { usePodcastGeneration } from "@/hooks/usePodcastGeneration"
import { DEFAULT_MODE, DEFAULT_URLS, GRADIENT_COLORS, PODCAST_FILENAME } from "@/constants/podcast"
import { downloadFile, validateUrl } from "@/lib/podcast"
import { UrlMode } from "@/types/podcast"

// Animation variants
const gradientAnimation: Variants = {
  initial: {
    background: `linear-gradient(45deg, ${GRADIENT_COLORS.orange}, ${GRADIENT_COLORS.black})`,
  },
  animate: {
    background: [
      `linear-gradient(45deg, ${GRADIENT_COLORS.orange}, ${GRADIENT_COLORS.black})`,
      `linear-gradient(45deg, ${GRADIENT_COLORS.black}, ${GRADIENT_COLORS.orange})`,
    ],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "linear",
      repeatType: "loop"
    }
  }
}

export default function Home() {
  const [mode, setMode] = useState<UrlMode>(DEFAULT_MODE)
  const [urls, setUrls] = useState<string[]>(DEFAULT_URLS)
  const [singleUrl, setSingleUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const {
    audioRef,
    isPlaying,
    isAudioLoading,
    setIsAudioLoading,
    togglePlayPause,
  } = useAudioPlayer()

  // Get current URLs based on mode
  const currentUrls = mode === 'single' 
    ? (singleUrl ? [singleUrl] : [])
    : urls

  const {
    isLoading,
    newsScript,
    currentStatus,
    showAudio,
    audioSrc,
    isExpanded,
    generatePodcast,
  } = usePodcastGeneration(currentUrls, selectedVoiceId)

  const handleModeChange = useCallback((newMode: UrlMode) => {
    setMode(newMode)
    // Clear single URL when switching to multiple mode
    if (newMode === 'multiple') {
      setSingleUrl('')
    }
  }, [])

  const addUrl = useCallback(() => {
    if (newUrl && !urls.includes(newUrl) && validateUrl(newUrl)) {
      setUrls(prev => [...prev, newUrl])
      setNewUrl('')
    }
  }, [newUrl, urls])

  const removeUrl = useCallback((urlToRemove: string) => {
    setUrls(prev => prev.filter(url => url !== urlToRemove))
  }, [])

  const downloadAudio = useCallback(() => {
    if (audioSrc) {
      downloadFile(audioSrc, PODCAST_FILENAME)
    }
  }, [audioSrc])

  return (
    <motion.div
      className="min-h-screen w-full flex flex-col font-light text-white overflow-x-hidden"
      initial="initial"
      animate={isLoading ? "animate" : "initial"}
      variants={gradientAnimation}
    >
      <Header title="Podcast Engine" />

      <main className="flex-grow flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8 w-full">
        <div className="w-full max-w-7xl mx-auto">
          <Card className="w-full rounded-lg shadow-lg overflow-hidden bg-black border-orange-500 border">
            <CardContent className="!p-4 sm:!p-6 flex flex-col lg:flex-row gap-4 sm:gap-6 h-[calc(100vh-12rem)] overflow-hidden w-full max-w-full">
              <UrlInputSection
                mode={mode}
                urls={urls}
                singleUrl={singleUrl}
                newUrl={newUrl}
                selectedVoiceId={selectedVoiceId}
                onModeChange={handleModeChange}
                onUrlChange={setNewUrl}
                onSingleUrlChange={setSingleUrl}
                onVoiceChange={setSelectedVoiceId}
                onAddUrl={addUrl}
                onRemoveUrl={removeUrl}
                onGenerate={generatePodcast}
                isLoading={isLoading}
                isExpanded={isExpanded}
              />

              <AnimatePresence>
                {isExpanded && (
                  <PodcastContentSection
                    isLoading={isLoading}
                    newsScript={newsScript}
                    currentStatus={currentStatus}
                    showAudio={showAudio}
                    scrollAreaRef={scrollAreaRef}
                    audioPlayerProps={{
                      audioRef,
                      audioSrc,
                      isPlaying,
                      isAudioLoading,
                      onTogglePlayPause: togglePlayPause,
                      onDownload: downloadAudio,
                      onLoadedData: () => setIsAudioLoading(false),
                    }}
                  />
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>
    </motion.div>
  )
}
