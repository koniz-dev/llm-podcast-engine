# Architecture Documentation

## Overview

The LLM Podcast Engine is a Next.js application that combines web scraping, AI-powered content generation, and text-to-speech to create automated podcasts from web content.

## System Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/SSE
         │
┌────────▼────────────────────────┐
│   Next.js API Routes             │
│   - /api/generate-podcast        │
│   - /api/voices                  │
└────────┬─────────────────────────┘
         │
         ├──────────┬──────────────┬──────────────┐
         │          │              │              │
    ┌────▼────┐ ┌──▼──────┐  ┌───▼──────┐  ┌───▼──────┐
    │ Firecrawl│ │  Groq   │  │ElevenLabs│  │  File    │
    │   API   │ │   API   │  │   API   │  │  System  │
    └─────────┘ └─────────┘  └─────────┘  └──────────┘
```

## Component Architecture

### Frontend Components

#### Main Page (`app/page.tsx`)
- Root component that orchestrates the entire UI
- Manages global state (mode, URLs, voice selection)
- Handles animations and layout

#### URL Input Section (`components/podcast/UrlInputSection.tsx`)
- Handles URL input (single or multiple mode)
- Voice selection dropdown
- Generate button
- URL management (add/remove)

#### Podcast Content Section (`components/podcast/PodcastContentSection.tsx`)
- Displays generated script
- Shows status updates
- Contains audio player component

#### Audio Player (`components/podcast/AudioPlayer.tsx`)
- Play/pause controls
- Download functionality
- Loading states

### Custom Hooks

#### `usePodcastGeneration`
- Manages podcast generation state
- Handles SSE stream connection
- Processes stream messages (updates, content, errors)
- Updates UI state based on stream events

#### `useAudioPlayer`
- Manages audio playback state
- Controls play/pause functionality
- Handles audio loading states

### API Routes

#### `/api/generate-podcast` (POST)
**Flow:**
1. Receives URLs and voiceId from client
2. Creates SSE stream
3. Scrapes URLs using Firecrawl
4. Generates script using Groq LLM (streamed)
5. Converts script to audio using ElevenLabs
6. Saves audio file to `public/` directory
7. Streams updates to client throughout the process

**Stream Message Types:**
- `update`: Status messages
- `content`: Script content chunks
- `complete`: Final message with audio filename
- `error`: Error messages

#### `/api/voices` (GET)
- Fetches available voices from ElevenLabs
- Filters to show only premade voices
- Returns sorted list of voices

## Data Flow

### Podcast Generation Flow

```
1. User Input
   └─> URLs + Voice Selection
       │
2. Frontend
   └─> POST /api/generate-podcast
       │
3. API Route
   ├─> Create SSE Stream
   ├─> Scrape URLs (Firecrawl)
   │   └─> Stream: "Gathering news..."
   ├─> Generate Script (Groq LLM)
   │   └─> Stream: Script chunks
   ├─> Generate Audio (ElevenLabs)
   │   └─> Stream: "Generating audio..."
   ├─> Save Audio File
   └─> Stream: Complete with filename
       │
4. Frontend
   └─> Update UI with script + audio player
```

## State Management

### Component State
- Uses React `useState` for local component state
- No global state management library (Redux, Zustand, etc.)

### State Flow
```
Page Component (app/page.tsx)
├─> URL State (mode, urls, singleUrl)
├─> Voice Selection State
└─> Podcast Generation Hook
    ├─> Loading State
    ├─> Script State
    ├─> Status State
    ├─> Audio State
    └─> Expanded State
```

## File Structure

```
llm-podcast-engine/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── generate-podcast/     # Main generation endpoint
│   │   └── voices/               # Voices endpoint
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
│
├── components/                    # React components
│   ├── podcast/                  # Podcast-specific components
│   └── ui/                       # Reusable UI components
│
├── hooks/                        # Custom React hooks
│   ├── useAudioPlayer.ts
│   └── usePodcastGeneration.ts
│
├── lib/                          # Utility functions
│   ├── podcast.ts               # Podcast utilities
│   └── utils.ts                 # General utilities
│
├── constants/                    # Constants
│   └── podcast.ts
│
├── types/                        # TypeScript types
│   └── podcast.ts
│
└── public/                       # Static files + generated audio
```

## Key Technologies

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **Framer Motion**: Animations
- **Radix UI**: Accessible UI components
- **Sonner**: Toast notifications

### Backend/API
- **Next.js API Routes**: Server-side endpoints
- **Server-Sent Events (SSE)**: Real-time streaming
- **Firecrawl**: Web scraping
- **Groq API**: LLM inference
- **ElevenLabs**: Text-to-speech

## Error Handling

### API Errors
- Network errors: Displayed via toast notifications
- API errors: Streamed as error messages
- Validation errors: Client-side validation before API calls

### Error Types
1. **Connection Errors**: Failed to connect to server
2. **Scraping Errors**: Failed to scrape URLs
3. **LLM Errors**: Failed to generate script
4. **TTS Errors**: Failed to generate audio
5. **File Errors**: Failed to save audio file

## Performance Considerations

### Streaming
- Script generation is streamed to provide real-time feedback
- Reduces perceived wait time
- Improves user experience

### Audio Generation
- Audio files are saved to `public/` directory
- Files are served statically after generation
- Consider cleanup strategy for old files

### Rate Limiting
- Groq API has rate limits (especially on free tier)
- Consider implementing retry logic
- May need to queue requests for high-volume usage

## Security Considerations

### API Keys
- All API keys stored in environment variables
- Never exposed to client-side code
- Use `.env.local` for local development

### URL Validation
- Client-side URL validation before sending to API
- Server-side validation recommended for production

### File Storage
- Audio files stored in `public/` directory
- Consider implementing file cleanup
- May want to use cloud storage for production

## Future Improvements

1. **Database Integration**: Store generated podcasts
2. **User Authentication**: Multi-user support
3. **Podcast Scheduling**: Automated daily podcasts
4. **Custom Prompts**: Allow users to customize script style
5. **Audio Editing**: Add intro/outro music
6. **RSS Feed**: Generate RSS feeds for podcast distribution
7. **File Cleanup**: Automatic cleanup of old audio files
8. **Error Recovery**: Retry logic for failed API calls
9. **Caching**: Cache scraped content to reduce API calls
10. **Analytics**: Track usage and popular URLs

