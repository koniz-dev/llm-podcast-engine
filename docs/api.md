# API Documentation

## Overview

The LLM Podcast Engine provides RESTful API endpoints for generating podcasts and fetching available voices.

## Base URL

All API endpoints are relative to your deployment URL. For local development:
```
http://localhost:3000
```

## Endpoints

### Generate Podcast

**Endpoint:** `POST /api/generate-podcast`

**Description:** Generates a podcast from provided URLs. Returns a Server-Sent Events (SSE) stream with real-time updates.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "urls": ["https://example.com/article1", "https://example.com/article2"],
  "voiceId": "21m00Tcm4TlvDq8ikWAM"
}
```

**Parameters:**
- `urls` (string[], required): Array of URLs to scrape and generate podcast from
- `voiceId` (string, required): ElevenLabs voice ID for text-to-speech

**Response:** Server-Sent Events stream

**Stream Message Format:**
```
data: {"type": "update", "message": "Status message"}
data: {"type": "content", "content": "Script content chunk"}
data: {"type": "complete", "audioUrl": "https://storage.example.com/podcast.mp3"}
data: {"type": "error", "message": "Error message"}
```

**Message Types:**

1. **update**
   - Status updates during generation
   - Example: `{"type": "update", "message": "Gathering news from various sources..."}`

2. **content**
   - Script content chunks (streamed as LLM generates)
   - Example: `{"type": "content", "content": "Welcome to today's tech news..."}`

3. **complete**
   - Generation complete with a playable audio URL
   - Example: `{"type": "complete", "audioUrl": "https://storage.example.com/podcast.mp3"}`

4. **error**
   - Error messages
   - Example: `{"type": "error", "message": "Failed to scrape URLs"}`

**Example Request (JavaScript):**
```javascript
const response = await fetch('/api/generate-podcast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urls: ['https://techcrunch.com/2024/01/01/article'],
    voiceId: '21m00Tcm4TlvDq8ikWAM'
  })
})

const reader = response.body.getReader()
const decoder = new TextDecoder()
let buffer = ''

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  buffer += decoder.decode(value, { stream: true })
  const events = buffer.split('\n\n')
  buffer = events.pop() || ''
  for (const event of events) {
    const dataLine = event.split('\n').find(line => line.startsWith('data: '))
    if (dataLine) console.log(JSON.parse(dataLine.slice(6)))
  }
}
```

**Example Request (cURL):**
```bash
curl -X POST http://localhost:3000/api/generate-podcast \
  -H "Content-Type: application/json" \
  -d '{
    "urls": ["https://techcrunch.com/2024/01/01/article"],
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }'
```

**Status Codes:**
- `200`: Stream started successfully
- `400`: Invalid request body
- `429`: Per-client generation limit exceeded
- `503`: Required server configuration is missing
- `500`: Server error

**Error Responses:**
```json
{
  "error": "Error message"
}
```

---

### Get Voices

**Endpoint:** `GET /api/voices`

**Description:** Fetches available voices from ElevenLabs.

**Request:** No parameters required

**Response:**
```json
{
  "voices": [
    {
      "voice_id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "Calm, empathetic female voice"
    },
    {
      "voice_id": "AZnzlk1XvdvUeBnXmlld",
      "name": "Domi",
      "category": "premade",
      "description": "Strong, deep female voice"
    }
  ]
}
```

**Response Fields:**
- `voice_id` (string): Unique identifier for the voice
- `name` (string): Display name of the voice
- `category` (string): Voice category (typically "premade")
- `description` (string): Description of the voice characteristics

**Example Request (JavaScript):**
```javascript
const response = await fetch('/api/voices')
const data = await response.json()
console.log(data.voices)
```

**Example Request (cURL):**
```bash
curl http://localhost:3000/api/voices
```

**Status Codes:**
- `200`: Success
- `401`: ElevenLabs API authentication failed
- `500`: Server error

**Error Responses:**
```json
{
  "error": "Failed to fetch voices from ElevenLabs"
}
```

---

## Rate Limiting

The generation endpoint includes a local in-memory limit of three requests per client per minute. This protects a single process during development; multi-instance production deployments should replace it with a shared Redis/KV-backed limiter. The underlying services also have their own limits:

- **Groq API**: Rate limits vary by model and tier (free tier has daily/minute limits)
- **Firecrawl**: Rate limits based on your plan
- **ElevenLabs**: Rate limits based on your subscription tier

## Error Handling

All endpoints return appropriate HTTP status codes and error messages. Errors are also included in the SSE stream for the generate-podcast endpoint.

### Common Error Scenarios

1. **Invalid API Keys**
   - Status: `401` or `500`
   - Message: API authentication failed

2. **Invalid URLs**
   - Status: `400`
   - Message: "Only public HTTP(S) URLs are allowed"

3. **Missing Voice ID**
   - Status: `400`
   - Message: "Required"

4. **Network Errors**
   - Status: `500`
   - Message: Server error details

## Best Practices

1. **Handle Stream Errors**: Always check for error messages in the SSE stream
2. **Validate URLs**: Validate URLs client-side before sending to API
3. **Select Voice First**: Ensure a voice is selected before generating
4. **Handle Disconnections**: Abort the request when the user leaves or cancels
5. **Rate Limiting**: Respect `RateLimit-*` response headers and back off after `429`

## WebSocket Alternative

Currently, the API uses Server-Sent Events (SSE) for streaming. For bidirectional communication or more complex scenarios, consider implementing WebSocket support in the future.

