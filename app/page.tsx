"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from "react"
import { Header } from "@/components/podcast/Header"
import { LocalStatus } from "@/components/podcast/LocalStatus"
import { UrlInputSection } from "@/components/podcast/UrlInputSection"
import { PodcastContentSection } from "@/components/podcast/PodcastContentSection"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { usePodcastGeneration } from "@/hooks/usePodcastGeneration"
import { DEFAULT_MODE, DEFAULT_URLS, PODCAST_FILENAME } from "@/constants/podcast"
import { downloadFile, validateUrl } from "@/lib/podcast"
import type { UrlMode } from "@/types/podcast"

const PREFERENCES_KEY = 'podcast-engine-preferences'

export default function Home() {
  const [mode, setMode] = useState<UrlMode>(DEFAULT_MODE)
  const [urls, setUrls] = useState<string[]>(DEFAULT_URLS)
  const [singleUrl, setSingleUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const currentUrls = mode === 'single' ? (singleUrl ? [singleUrl.trim()] : []) : urls
  const {
    isLoading,
    newsScript,
    currentStatus,
    showAudio,
    audioSrc,
    isExpanded,
    generatePodcast,
    cancelPodcast,
  } = usePodcastGeneration(currentUrls, selectedVoiceId)

  const {
    audioRef,
    isAudioLoading,
    setIsAudioLoading,
  } = useAudioPlayer()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREFERENCES_KEY)
      if (saved) {
        const preferences = JSON.parse(saved) as {
          mode?: UrlMode
          urls?: string[]
          singleUrl?: string
          selectedVoiceId?: string
        }
        if (preferences.mode === 'single' || preferences.mode === 'multiple') setMode(preferences.mode)
        if (Array.isArray(preferences.urls)) setUrls(preferences.urls)
        if (typeof preferences.singleUrl === 'string') setSingleUrl(preferences.singleUrl)
        if (typeof preferences.selectedVoiceId === 'string') setSelectedVoiceId(preferences.selectedVoiceId)
      }
    } catch {
      localStorage.removeItem(PREFERENCES_KEY)
    } finally {
      setPreferencesLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!preferencesLoaded) return
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify({ mode, urls, singleUrl, selectedVoiceId }))
  }, [mode, preferencesLoaded, selectedVoiceId, singleUrl, urls])

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]')
    if (viewport && isLoading) viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' })
  }, [isLoading, newsScript])

  const handleModeChange = useCallback((newMode: UrlMode) => setMode(newMode), [])

  const addUrl = useCallback(() => {
    const normalized = newUrl.trim()
    if (normalized && !urls.includes(normalized) && validateUrl(normalized)) {
      setUrls((previous) => [...previous, normalized])
      setNewUrl('')
    }
  }, [newUrl, urls])

  const removeUrl = useCallback((urlToRemove: string) => {
    setUrls((previous) => previous.filter((url) => url !== urlToRemove))
  }, [])

  const downloadAudio = useCallback(() => {
    if (audioSrc) downloadFile(audioSrc, PODCAST_FILENAME)
  }, [audioSrc])

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07090d] text-white [background-image:radial-gradient(circle_at_15%_0%,rgba(249,115,22,0.16),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(59,130,246,0.08),transparent_28%)]">
      <Header title="Podcast Engine" />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <LocalStatus />

        <Card className="mt-4 overflow-hidden rounded-2xl border-white/10 bg-[#0d1117]/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <CardContent className="flex min-h-[34rem] w-full flex-col gap-5 !p-4 sm:!p-6 lg:h-[calc(100vh-11.5rem)] lg:min-h-[38rem] lg:flex-row lg:gap-6">
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
              onCancel={cancelPodcast}
              isLoading={isLoading}
              isExpanded={isExpanded}
            />

            <AnimatePresence mode="wait">
              {isExpanded ? (
                <PodcastContentSection
                  key="podcast-content"
                  isLoading={isLoading}
                  newsScript={newsScript}
                  currentStatus={currentStatus}
                  showAudio={showAudio}
                  scrollAreaRef={scrollAreaRef}
                  audioPlayerProps={{
                    audioRef,
                    audioSrc,
                    isAudioLoading,
                    onDownload: downloadAudio,
                    onLoadStart: () => setIsAudioLoading(true),
                    onLoadedData: () => setIsAudioLoading(false),
                  }}
                />
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hidden flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] lg:flex"
                >
                  <div className="max-w-xs text-center">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/10 text-2xl">🎧</div>
                    <p className="text-sm font-medium text-slate-300">Your episode will appear here</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">Add a source, choose a voice, then let the local pipeline do the rest.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
