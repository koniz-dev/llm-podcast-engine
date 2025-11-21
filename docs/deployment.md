# Deployment Guide

This guide covers deploying the LLM Podcast Engine to various platforms.

## Prerequisites

- All environment variables configured (see README.md)
- Node.js 18+ or Bun installed
- Git repository set up

## Environment Variables

Ensure all required environment variables are set in your deployment platform:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.1-8b-instant
FIRECRAWL_API_KEY=your_firecrawl_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
```

## Vercel Deployment

Vercel is the recommended platform for Next.js applications.

### Steps:

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Add environment variables in the project settings
   - Deploy

3. **Deploy via CLI**:
```bash
vercel
```

### Important Notes for Vercel:

- **File Storage**: Audio files are saved to the `public/` directory, which is ephemeral on Vercel. Consider using a cloud storage service (S3, Cloudinary) for production.
- **Serverless Functions**: API routes run as serverless functions with execution time limits.
- **Environment Variables**: Set all required environment variables in the Vercel dashboard.

## Docker Deployment

### Create Dockerfile:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Update next.config.ts:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... other config
}

export default nextConfig
```

### Build and Run:

```bash
docker build -t llm-podcast-engine .
docker run -p 3000:3000 --env-file .env.local llm-podcast-engine
```

## Railway Deployment

1. **Connect Repository**:
   - Go to [railway.app](https://railway.app)
   - Create a new project
   - Connect your Git repository

2. **Configure Environment Variables**:
   - Add all required environment variables in the Railway dashboard

3. **Deploy**:
   - Railway will automatically detect Next.js and deploy

## Render Deployment

1. **Create New Web Service**:
   - Go to [render.com](https://render.com)
   - Create a new Web Service
   - Connect your Git repository

2. **Configure**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node

3. **Add Environment Variables**:
   - Add all required environment variables

4. **Deploy**:
   - Click "Create Web Service"

## Self-Hosted Deployment

### Using PM2:

1. **Build the application**:
```bash
npm run build
```

2. **Install PM2**:
```bash
npm install -g pm2
```

3. **Start the application**:
```bash
pm2 start npm --name "podcast-engine" -- start
```

4. **Save PM2 configuration**:
```bash
pm2 save
pm2 startup
```

### Using systemd:

Create `/etc/systemd/system/podcast-engine.service`:

```ini
[Unit]
Description=LLM Podcast Engine
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/llm-podcast-engine
Environment="NODE_ENV=production"
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable podcast-engine
sudo systemctl start podcast-engine
```

## Production Considerations

### File Storage

The current implementation saves audio files to the `public/` directory. For production:

1. **Use Cloud Storage**:
   - AWS S3
   - Google Cloud Storage
   - Cloudinary
   - Azure Blob Storage

2. **Implement Cleanup**:
   - Delete old audio files periodically
   - Set up a cron job or scheduled function

### Rate Limiting

Implement rate limiting to protect your API:

- Use middleware like `express-rate-limit`
- Or use a service like Cloudflare
- Consider implementing per-user rate limits

### Monitoring

Set up monitoring and logging:

- **Error Tracking**: Sentry, Rollbar
- **Analytics**: Google Analytics, Plausible
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Logs**: Logtail, Datadog

### Security

1. **HTTPS**: Always use HTTPS in production
2. **CORS**: Configure CORS properly
3. **API Keys**: Never expose API keys in client-side code
4. **Input Validation**: Validate all inputs server-side
5. **Rate Limiting**: Implement rate limiting

### Performance

1. **Caching**: Implement caching for scraped content
2. **CDN**: Use a CDN for static assets
3. **Database**: Consider adding a database for storing podcasts
4. **Queue**: Use a job queue for long-running tasks

## Troubleshooting

### Build Failures

- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

### Runtime Errors

- Verify all environment variables are set
- Check API keys are valid
- Review server logs

### Audio Generation Issues

- Verify ElevenLabs API key and credits
- Check file system permissions
- Ensure `public/` directory exists and is writable

## Support

For deployment issues, please open an issue on GitHub or check the documentation.

