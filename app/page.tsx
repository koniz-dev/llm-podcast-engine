"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, FileAudio, Sparkles, WandSparkles } from "lucide-react"
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#090907] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-48 -top-48 h-[32rem] w-[32rem] rounded-full bg-orange-500/[0.12] blur-[120px]" />
        <div className="absolute -right-48 top-1/3 h-[30rem] w-[30rem] rounded-full bg-amber-200/[0.06] blur-[140px]" />
        <div className="noise-overlay absolute inset-0 opacity-[0.035]" />
      </div>
      <Header title="Podcast Engine" />

      <main className="relative mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
              <Sparkles className="h-3.5 w-3.5" /> AI audio workspace
            </div>
            <h2 className="max-w-3xl text-balance text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              Turn the stories you save into <span className="text-orange-300">episodes worth hearing.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-400 sm:text-base">
              Bring an article, pick a narrator, and let the engine shape it into a polished listening experience.
            </p>
          </div>
          <div className="hidden items-center gap-5 pb-1 text-xs text-stone-500 md:flex">
            <span className="flex items-center gap-2"><span className="font-mono text-orange-300">01</span> Add sources</span>
            <span className="h-px w-7 bg-white/10" />
            <span className="flex items-center gap-2"><span className="font-mono text-orange-300">02</span> Choose voice</span>
            <span className="h-px w-7 bg-white/10" />
            <span className="flex items-center gap-2"><span className="font-mono text-orange-300">03</span> Listen</span>
          </div>
        </section>

        <LocalStatus />

        <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#11110e]/90 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex min-h-[36rem] w-full flex-col gap-4 p-3 sm:p-4 lg:h-[min(48rem,calc(100vh-15rem))] lg:min-h-[40rem] lg:flex-row">
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
                  className="relative hidden flex-1 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-[#0c0c0a] lg:flex"
                >
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-orange-500/[0.06] to-transparent" />
                  <div className="relative max-w-sm px-8 text-center">
                    <div className="relative mx-auto mb-7 h-28 w-28">
                      <div className="absolute inset-0 rounded-full border border-orange-300/10" />
                      <div className="absolute inset-3 rounded-full border border-dashed border-orange-300/20 motion-safe:animate-[spin_18s_linear_infinite]" />
                      <div className="absolute inset-7 grid place-items-center rounded-full bg-orange-300 text-[#17120b] shadow-[0_0_50px_rgba(253,186,116,0.2)]">
                        <FileAudio className="h-7 w-7" />
                      </div>
                    </div>
                    <p className="text-lg font-medium tracking-tight text-stone-100">Your listening room is ready</p>
                    <p className="mt-2 text-sm leading-6 text-stone-500">Add a source and select a voice. Your script and finished episode will unfold here in real time.</p>
                    <div className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-orange-300/80">
                      <WandSparkles className="h-3.5 w-3.5" /> Waiting for your first story <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
