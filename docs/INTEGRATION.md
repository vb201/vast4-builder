# VAST4Builder Integration Guide

Complete guide for deploying and integrating VAST4Builder in production environments.

## Table of Contents

-   [Installation & Setup](#installation--setup)
-   [Integration Patterns](#integration-patterns)
-   [Performance Optimization](#performance-optimization)
-   [Input Validation](#input-validation)

## Installation & Setup

### Package Installation

```bash
# Using npm
npm install vast4-builder

# Using pnpm (recommended for better performance)
pnpm install vast4-builder

# Using yarn
yarn add vast4-builder
```

## Integration Patterns

### Node.js Express Server

```typescript
import express from 'express';
import { buildVast, buildInlineAd, validateVast } from 'vast4-builder';

const app = express();
app.use(express.json());

// VAST generation endpoint
app.post('/api/vast', async (req, res) => {
    try {
        const { adConfig, sessionId, userId } = req.body;

        // Build tracking URLs with session context
        const impressions = [
            `${process.env.ANALYTICS_BASE_URL}/impression?session=${sessionId}&user=${userId}`,
        ];

        const ad = buildInlineAd({
            title: adConfig.title,
            impressions,
            errorUrls: [
                `${process.env.ANALYTICS_BASE_URL}/error?session=${sessionId}&user=${userId}`,
            ],
            creatives: [
                {
                    linear: {
                        duration: adConfig.duration,
                        skipoffset: adConfig.skipOffset,
                        tracking: generateTrackingEvents(sessionId, userId),
                        clicks: {
                            clickThrough: adConfig.landingUrl,
                            clickTracking: [
                                `${process.env.ANALYTICS_BASE_URL}/click?session=${sessionId}&user=${userId}`,
                            ],
                        },
                        mediaFiles: adConfig.mediaFiles,
                    },
                },
            ],
        });

        const vastXml = buildVast({ ads: [ad] });

        // Validate before sending
        const validation = validateVast(vastXml);
        if (!validation.isValid) {
            throw new Error(`VAST validation failed: ${validation.errors.join(', ')}`);
        }

        res.set('Content-Type', 'application/xml');
        res.send(vastXml);
    } catch (error) {
        console.error('VAST generation error:', error);
        res.status(500).json({ error: 'Failed to generate VAST' });
    }
});

function generateTrackingEvents(sessionId: string, userId: string) {
    const baseUrl = `${process.env.ANALYTICS_BASE_URL}/track?session=${sessionId}&user=${userId}&event=`;

    return [
        { event: 'start', url: `${baseUrl}start` },
        { event: 'firstQuartile', url: `${baseUrl}q1` },
        { event: 'midpoint', url: `${baseUrl}mid` },
        { event: 'thirdQuartile', url: `${baseUrl}q3` },
        { event: 'complete', url: `${baseUrl}complete` },
    ];
}

app.listen(3000, () => {
    console.log('VAST server running on port 3000');
});
```

### Next.js API Route

```typescript
// pages/api/vast.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { buildVast, buildInlineAd } from 'vast4-builder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { placement, user, device } = req.body;

        // Select appropriate creative based on device
        const mediaFiles = getMediaFilesForDevice(device);

        const ad = buildInlineAd({
            title: `Ad for ${placement}`,
            impressions: [
                `https://analytics.example.com/impression?placement=${placement}&user=${user}`,
            ],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        mediaFiles: mediaFiles,
                        tracking: [
                            {
                                event: 'start',
                                url: `https://analytics.example.com/start?placement=${placement}`,
                            },
                            {
                                event: 'complete',
                                url: `https://analytics.example.com/complete?placement=${placement}`,
                            },
                        ],
                    },
                },
            ],
        });

        const vastXml = buildVast({ ads: [ad] });

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200).send(vastXml);
    } catch (error) {
        console.error('VAST generation failed:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

function getMediaFilesForDevice(device: string) {
    if (device === 'mobile') {
        return [
            {
                url: 'https://cdn.example.com/mobile.mp4',
                type: 'video/mp4',
                width: 720,
                height: 480,
                bitrate: 1000000,
            },
        ];
    }

    return [
        {
            url: 'https://cdn.example.com/desktop.mp4',
            type: 'video/mp4',
            width: 1920,
            height: 1080,
            bitrate: 3000000,
        },
    ];
}
```

### AWS Lambda Function

```typescript
// lambda/vast-generator.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { buildVast, buildInlineAd } from 'vast4-builder';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing request body' }),
            };
        }

        const request = JSON.parse(event.body);
        const { campaignId, placement, targetingData } = request;

        // Retrieve campaign configuration (could be from DynamoDB)
        const campaign = await getCampaignConfig(campaignId);

        const ad = buildInlineAd({
            title: campaign.title,
            impressions: [
                `https://analytics.example.com/impression?campaign=${campaignId}&placement=${placement}`,
            ],
            creatives: [
                {
                    linear: {
                        duration: campaign.duration,
                        mediaFiles: campaign.mediaFiles,
                        tracking: generateCampaignTracking(campaignId, placement),
                    },
                },
            ],
        });

        const vastXml = buildVast({
            ads: [ad],
            errorUrl: `https://analytics.example.com/error?campaign=${campaignId}`,
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
            body: vastXml,
        };
    } catch (error) {
        console.error('Lambda VAST generation error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};

async function getCampaignConfig(campaignId: string) {
    // Implementation would fetch from database
    return {
        title: `Campaign ${campaignId}`,
        duration: '00:00:30',
        mediaFiles: [
            {
                url: `https://cdn.example.com/campaigns/${campaignId}/video.mp4`,
                type: 'video/mp4',
                width: 1920,
                height: 1080,
            },
        ],
    };
}

function generateCampaignTracking(campaignId: string, placement: string) {
    const baseUrl = `https://analytics.example.com/track?campaign=${campaignId}&placement=${placement}&event=`;

    return [
        { event: 'start', url: `${baseUrl}start` },
        { event: 'complete', url: `${baseUrl}complete` },
    ];
}
```

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
    vast-server:
        build: .
        ports:
            - '3000:3000'
        environment:
            - NODE_ENV=production
            - ANALYTICS_BASE_URL=https://analytics.example.com
            - CDN_BASE_URL=https://cdn.example.com
        healthcheck:
            test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
            interval: 30s
            timeout: 10s
            retries: 3
        restart: unless-stopped

    nginx:
        image: nginx:alpine
        ports:
            - '80:80'
            - '443:443'
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - vast-server
        restart: unless-stopped
```

## Performance Optimization

### Caching Strategy

```typescript
import NodeCache from 'node-cache';

// In-memory cache for frequently generated ads
const vastCache = new NodeCache({
    stdTTL: 300, // 5 minutes
    checkperiod: 60, // Check for expired keys every minute
});

// Redis cache for distributed systems
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function getCachedVast(cacheKey: string): Promise<string | null> {
    // Try in-memory cache first
    const memoryResult = vastCache.get<string>(cacheKey);
    if (memoryResult) {
        return memoryResult;
    }

    // Try Redis cache
    const redisResult = await redis.get(cacheKey);
    if (redisResult) {
        // Store in memory cache for faster access
        vastCache.set(cacheKey, redisResult);
        return redisResult;
    }

    return null;
}

export async function setCachedVast(
    cacheKey: string,
    vast: string,
    ttl: number = 300
): Promise<void> {
    // Store in both caches
    vastCache.set(cacheKey, vast, ttl);
    await redis.setex(cacheKey, ttl, vast);
}

// Cache key generation
export function generateCacheKey(adConfig: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(adConfig));
    return `vast:${hash.digest('hex')}`;
}
```

### Connection Pooling

```typescript
import { Pool } from 'pg';

// Database connection pool
const dbPool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// HTTP agent for external requests
import { Agent } from 'https';

const httpsAgent = new Agent({
    keepAlive: true,
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000,
});

export const httpConfig = {
    agent: httpsAgent,
    timeout: 10000,
};
```

### Memory Management

```typescript
// Memory usage monitoring
setInterval(() => {
    const usage = process.memoryUsage();
    const used = Math.round((usage.rss / 1024 / 1024) * 100) / 100;

    if (used > 512) {
        // MB
        logger.warn('High memory usage detected', { memoryUsageMB: used });
    }

    // Force garbage collection if memory is high (development only)
    if (process.env.NODE_ENV === 'development' && used > 256) {
        if (global.gc) {
            global.gc();
        }
    }
}, 30000);

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, starting graceful shutdown');

    // Close database connections
    await dbPool.end();

    // Close Redis connection
    redis.disconnect();

    // Close HTTP server
    server.close(() => {
        logger.info('Graceful shutdown completed');
        process.exit(0);
    });
});
```

## Input Validation

```typescript
import Joi from 'joi';

const adConfigSchema = Joi.object({
    title: Joi.string().max(100).required(),
    duration: Joi.string()
        .pattern(/^\d{2}:\d{2}:\d{2}$/)
        .required(),
    impressions: Joi.array()
        .items(Joi.string().uri({ scheme: ['http', 'https'] }))
        .min(1)
        .max(10)
        .required(),
    mediaFiles: Joi.array()
        .items(
            Joi.object({
                url: Joi.string()
                    .uri({ scheme: ['http', 'https'] })
                    .required(),
                type: Joi.string()
                    .pattern(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/)
                    .required(),
                width: Joi.number().integer().min(1).max(7680).required(),
                height: Joi.number().integer().min(1).max(4320).required(),
                bitrate: Joi.number().integer().min(1).max(100000000).optional(),
            })
        )
        .min(1)
        .max(20)
        .required(),
});

export function validateAdConfig(config: any): { isValid: boolean; error?: string } {
    const { error } = adConfigSchema.validate(config);
    return {
        isValid: !error,
        error: error?.details[0]?.message,
    };
}
```
