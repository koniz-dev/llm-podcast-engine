"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from 'framer-motion'
import { Flame, Link2, List, Mic, Plus, X } from "lucide-react"
import { UrlMode } from "@/types/podcast"
import { VoiceSelector } from "./VoiceSelector"

interface UrlInputSectionProps {
  mode: UrlMode
  urls: string[]
  singleUrl: string
  newUrl: string
  selectedVoiceId: string | null
  onModeChange: (mode: UrlMode) => void
  onUrlChange: (url: string) => void
  onSingleUrlChange: (url: string) => void
  onVoiceChange: (voiceId: string) => void
  onAddUrl: () => void
  onRemoveUrl: (url: string) => void
  onGenerate: () => void
  isLoading: boolean
  isExpanded: boolean
}

export const UrlInputSection = ({
  mode,
  urls,
  singleUrl,
  newUrl,
  selectedVoiceId,
  onModeChange,
  onUrlChange,
  onSingleUrlChange,
  onVoiceChange,
  onAddUrl,
  onRemoveUrl,
  onGenerate,
  isLoading,
  isExpanded,
}: UrlInputSectionProps) => (
  <motion.div
    className={`w-full ${isExpanded ? 'lg:w-1/2 lg:flex-shrink-0 lg:min-w-0' : ''} flex flex-col space-y-4`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {/* Voice Selector */}
    <VoiceSelector
      selectedVoiceId={selectedVoiceId}
      onVoiceChange={onVoiceChange}
    />

    {/* Mode Toggle */}
    <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
      <span className="text-sm text-gray-300">Mode:</span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('single')}
          className={mode === 'single' 
            ? 'bg-orange-500 hover:bg-orange-600 text-black' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
        >
          <Link2 className="h-4 w-4 mr-1" />
          Single URL
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onModeChange('multiple')}
          className={mode === 'multiple' 
            ? 'bg-orange-500 hover:bg-orange-600 text-black' 
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }
        >
          <List className="h-4 w-4 mr-1" />
          Multiple URLs
        </Button>
      </div>
    </div>

    {/* Single URL Mode */}
    {mode === 'single' ? (
      <div className="flex space-x-2">
        <Input
          type="url"
          placeholder="Enter a URL (e.g., https://example.com)"
          value={singleUrl}
          onChange={(e) => onSingleUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onGenerate()}
          className="flex-grow bg-gray-800 text-white border-orange-500"
        />
      </div>
    ) : (
      /* Multiple URLs Mode */
      <>
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Enter a URL (e.g., https://example.com)"
            value={newUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddUrl()}
            className="flex-grow bg-gray-800 text-white border-orange-500"
          />
          <Button 
            onClick={onAddUrl} 
            className="bg-orange-500 hover:bg-orange-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>

        <ScrollArea className="flex-grow">
          <div className="space-y-2">
            {urls.map((url, index) => (
              <div 
                key={`${url}-${index}`} 
                className="flex items-center justify-between bg-gray-800 p-2 rounded"
              >
                <span className="truncate text-orange-300">{url}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemoveUrl(url)} 
                  className="text-white hover:text-orange-300"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Remove {url}</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </>
    )}

    <Button
      onClick={onGenerate}
      disabled={isLoading || (mode === 'single' ? !singleUrl : urls.length === 0)}
      className="w-full bg-gradient-to-r from-orange-500 to-black text-white font-light cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <Flame className="mr-2 h-4 w-4 animate-pulse" />
          Generating Podcast
        </>
      ) : (
        <>
          <Mic className="mr-2 h-4 w-4" />
          Generate Podcast
        </>
      )}
    </Button>
  </motion.div>
)

