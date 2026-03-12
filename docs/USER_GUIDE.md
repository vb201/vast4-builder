# VAST4Builder User Guide

Complete guide to building, parsing, and validating VAST 4.1 XML with TypeScript.

## Table of Contents

-   [Getting Started](#getting-started)
-   [Basic Usage](#basic-usage)
-   [Linear Video Ads](#linear-video-ads)
-   [Non-Linear Overlay Ads](#non-linear-overlay-ads)
-   [Wrapper Ads & Ad Server Chaining](#wrapper-ads--ad-server-chaining)
-   [Ad Pods & Sequential Playback](#ad-pods--sequential-playback)
-   [Streaming Formats](#streaming-formats)
-   [Tracking & Analytics](#tracking--analytics)
-   [Validation & Error Handling](#validation--error-handling)
-   [Best Practices](#best-practices)
-   [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

```bash
# Using npm
npm install vast4-builder

# Using pnpm (recommended)
pnpm install vast4-builder

# Using yarn
yarn add vast4-builder
```

### Quick Start

```typescript
import { buildVast, buildInlineAd } from 'vast4-builder';

// Create a simple video ad
const ad = buildInlineAd({
    title: 'My First Video Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/video.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});

// Generate VAST XML
const vastXml = buildVast({ ads: [ad] });
console.log(vastXml);
```

## Basic Usage

### Creating Your First Ad

The most basic VAST ad requires:

1. A title for identification
2. At least one impression tracking URL
3. At least one creative with media files

```typescript
import { buildInlineAd, buildVast } from 'vast4-builder';

const basicAd = buildInlineAd({
    title: 'Summer Sale Promotion',
    impressions: ['https://my-analytics.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:15', // 15-second ad
                mediaFiles: [
                    {
                        url: 'https://my-cdn.com/summer-sale.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                    },
                ],
            },
        },
    ],
});

const xml = buildVast({ ads: [basicAd] });
```

### Understanding the Structure

VAST documents have a hierarchical structure:

```
VAST Document
├── Ad (one or more)
│   ├── InLine or Wrapper
│   │   ├── AdSystem
│   │   ├── AdTitle
│   │   ├── Impression URLs
│   │   ├── Error URLs
│   │   └── Creatives
│   │       ├── Linear
│   │       │   ├── Duration
│   │       │   ├── MediaFiles
│   │       │   ├── TrackingEvents
│   │       │   └── VideoClicks
│   │       ├── NonLinear
│   │       └── CompanionAds
```

## Linear Video Ads

Linear ads play in sequence with the main content and take full control of the video player.

### Basic Linear Ad

```typescript
const linearAd = buildInlineAd({
    title: 'Product Demo Video',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/demo.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        delivery: 'progressive',
                        bitrate: 2000000,
                    },
                ],
            },
        },
    ],
});
```

### Skippable Linear Ad

```typescript
const skippableAd = buildInlineAd({
    title: 'Skippable Product Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05', // Allow skip after 5 seconds
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/skippable.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});
```

### Multiple Media Files (Quality Ladder)

Provide multiple quality options for adaptive playback:

```typescript
const adaptiveAd = buildInlineAd({
    title: 'Multi-Quality Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    // Low quality for mobile/slow connections
                    {
                        url: 'https://cdn.example.com/low.mp4',
                        type: 'video/mp4',
                        width: 640,
                        height: 360,
                        bitrate: 500000,
                        delivery: 'progressive',
                    },
                    // Medium quality
                    {
                        url: 'https://cdn.example.com/medium.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        bitrate: 1500000,
                        delivery: 'progressive',
                    },
                    // High quality
                    {
                        url: 'https://cdn.example.com/high.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        bitrate: 3000000,
                        delivery: 'progressive',
                    },
                ],
            },
        },
    ],
});
```

### Interactive Linear Ad

Add click-through and tracking:

```typescript
const interactiveAd = buildInlineAd({
    title: 'Interactive Brand Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/interactive.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
                clicks: {
                    clickThrough: 'https://brand.example.com/landing',
                    clickTracking: [
                        'https://analytics.example.com/click',
                        'https://brand.example.com/click-tracking',
                    ],
                },
            },
        },
    ],
});
```

## Non-Linear Overlay Ads

Non-linear ads display as overlays without interrupting content playback.

### Banner Overlay

```typescript
const bannerOverlay = buildInlineAd({
    title: 'Bottom Banner Overlay',
    impressions: ['https://analytics.example.com/overlay-impression'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 728,
                        height: 90,
                        minSuggestedDuration: '00:00:15',
                        staticResource: 'https://cdn.example.com/banner.png',
                        nonLinearClickThrough: 'https://example.com/landing',
                        nonLinearClickTracking: ['https://analytics.example.com/overlay-click'],
                    },
                ],
            },
        },
    ],
});
```

### Rich Media Overlay

```typescript
const richMediaOverlay = buildInlineAd({
    title: 'Interactive Rich Media',
    impressions: ['https://analytics.example.com/rich-impression'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 300,
                        height: 250,
                        expandedWidth: 600,
                        expandedHeight: 500,
                        scalable: true,
                        maintainAspectRatio: true,
                        minSuggestedDuration: '00:00:20',
                        iframeResource: 'https://ads.example.com/rich-media.html',
                        nonLinearClickThrough: 'https://example.com/product',
                        nonLinearClickTracking: ['https://analytics.example.com/rich-click'],
                        adParameters: JSON.stringify({
                            productId: '12345',
                            campaignId: 'summer2024',
                            customization: {
                                color: '#ff6b35',
                                animation: 'slide',
                            },
                        }),
                    },
                ],
            },
        },
    ],
});
```

### HTML5 Creative

```typescript
const html5Overlay = buildInlineAd({
    title: 'HTML5 Interactive Ad',
    impressions: ['https://analytics.example.com/html5-impression'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 320,
                        height: 250,
                        minSuggestedDuration: '00:00:30',
                        htmlResource: `
          <div style="width:320px;height:250px;background:linear-gradient(45deg,#ff6b35,#f7931e);color:white;padding:20px;font-family:Arial;">
            <h2>Special Offer!</h2>
            <p>Get 50% off your first order</p>
            <button onclick="parent.postMessage('click', '*')" style="background:white;color:#ff6b35;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">
              Shop Now
            </button>
          </div>
        `,
                        nonLinearClickThrough: 'https://example.com/offer',
                        nonLinearClickTracking: ['https://analytics.example.com/html5-click'],
                    },
                ],
            },
        },
    ],
});
```

## Wrapper Ads & Ad Server Chaining

Wrapper ads enable ad server mediation and network chaining.

### Basic Wrapper

```typescript
import { buildWrapperAd } from 'vast4-builder';

const wrapperAd = buildWrapperAd({
    adSystem: 'Primary Ad Network',
    vastAdTagURI: 'https://secondary-network.com/vast?placement=premium',
    impressions: ['https://primary-network.com/wrapper-impression'],
    errorUrls: ['https://primary-network.com/wrapper-error'],
});
```

### Wrapper with Tracking

Add wrapper-level tracking that fires regardless of the final ad:

```typescript
const trackedWrapper = buildWrapperAd({
    adSystem: 'Analytics Network v2.1',
    vastAdTagURI: 'https://content-network.com/vast?auction=abc123',
    impressions: [
        'https://analytics-network.com/wrapper-impression',
        'https://backup-analytics.com/wrapper-impression',
    ],
    errorUrls: ['https://analytics-network.com/wrapper-error'],
    tracking: [
        { event: 'start', url: 'https://analytics-network.com/wrapper-start' },
        { event: 'firstQuartile', url: 'https://analytics-network.com/wrapper-q1' },
        { event: 'midpoint', url: 'https://analytics-network.com/wrapper-mid' },
        { event: 'thirdQuartile', url: 'https://analytics-network.com/wrapper-q3' },
        { event: 'complete', url: 'https://analytics-network.com/wrapper-complete' },
    ],
    clicks: {
        clickTracking: ['https://analytics-network.com/wrapper-click'],
    },
});
```

### Multi-Level Wrapper Chain

Create complex ad server relationships:

```typescript
// Tier 1: Publisher's ad server
const publisherWrapper = buildWrapperAd({
    adSystem: 'Publisher AdServer',
    vastAdTagURI: 'https://ssp.example.com/vast?site=news&placement=preroll',
    impressions: ['https://publisher.com/impression'],
    tracking: [{ event: 'start', url: 'https://publisher.com/start' }],
});

// Tier 2: SSP (Supply-Side Platform)
const sspWrapper = buildWrapperAd({
    adSystem: 'SSP Platform v3.2',
    vastAdTagURI: 'https://dsp.example.com/vast?bid=xyz789&price=2.50',
    impressions: ['https://ssp.example.com/impression'],
    tracking: [{ event: 'start', url: 'https://ssp.example.com/start' }],
});

// Tier 3: DSP (Demand-Side Platform) - Final Ad
const finalAd = buildInlineAd({
    adSystem: 'DSP Creative Engine',
    title: 'Final Brand Campaign',
    impressions: ['https://dsp.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/final-creative.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});
```

## Ad Pods & Sequential Playback

Ad pods enable back-to-back ad playback for longer commercial breaks.

### Simple Ad Pod

```typescript
import { buildAdPod } from 'vast4-builder';

const ad1 = buildInlineAd({
  title: 'Car Commercial',
  impressions: ['https://analytics.com/car-impression'],
  creatives: [{ linear: { duration: '00:00:15', mediaFiles: [...] } }]
});

const ad2 = buildInlineAd({
  title: 'Food Commercial',
  impressions: ['https://analytics.com/food-impression'],
  creatives: [{ linear: { duration: '00:00:30', mediaFiles: [...] } }]
});

const ad3 = buildInlineAd({
  title: 'Tech Commercial',
  impressions: ['https://analytics.com/tech-impression'],
  creatives: [{ linear: { duration: '00:00:15', mediaFiles: [...] } }]
});

// Create sequenced pod
const podAds = buildAdPod([ad1, ad2, ad3]);

const vastXml = buildVast({
  ads: podAds
});
```

### Mixed Format Pod

Combine different ad types in a pod:

```typescript
const videoAd = buildInlineAd({
    title: 'Video Advertisement',
    impressions: ['https://analytics.com/video-imp'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/video.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});

const overlayAd = buildInlineAd({
    title: 'Banner Overlay',
    impressions: ['https://analytics.com/overlay-imp'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 728,
                        height: 90,
                        minSuggestedDuration: '00:00:10',
                        staticResource: 'https://cdn.example.com/banner.png',
                    },
                ],
            },
        },
    ],
});

const wrapperAd = buildWrapperAd({
    vastAdTagURI: 'https://partner.com/vast',
    impressions: ['https://analytics.com/wrapper-imp'],
});

// Mix different ad types in pod
const mixedPod = buildAdPod([videoAd, overlayAd, wrapperAd]);
```

## Streaming Formats

Support for modern adaptive streaming protocols.

### HLS (HTTP Live Streaming)

Perfect for iOS and Safari compatibility:

```typescript
const hlsAd = buildInlineAd({
    title: 'HLS Streaming Advertisement',
    impressions: ['https://analytics.example.com/hls-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    // Master playlist
                    {
                        url: 'https://stream.example.com/master.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                        scalable: true,
                        maintainAspectRatio: true,
                    },
                    // Specific quality streams
                    {
                        url: 'https://stream.example.com/720p.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1280,
                        height: 720,
                        delivery: 'streaming',
                        maxBitrate: 2000000,
                    },
                    {
                        url: 'https://stream.example.com/480p.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 854,
                        height: 480,
                        delivery: 'streaming',
                        maxBitrate: 1000000,
                    },
                ],
            },
        },
    ],
});
```

### DASH (Dynamic Adaptive Streaming)

Industry-standard adaptive streaming:

```typescript
const dashAd = buildInlineAd({
    title: 'DASH Streaming Advertisement',
    impressions: ['https://analytics.example.com/dash-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://stream.example.com/manifest.mpd',
                        type: 'application/dash+xml',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                        scalable: true,
                        maintainAspectRatio: true,
                    },
                ],
            },
        },
    ],
});
```

### Universal Streaming Support

Provide multiple formats for maximum compatibility:

```typescript
const universalAd = buildInlineAd({
    title: 'Universal Streaming Ad',
    impressions: ['https://analytics.example.com/universal-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    // DASH for broad compatibility
                    {
                        url: 'https://stream.example.com/manifest.mpd',
                        type: 'application/dash+xml',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                    },
                    // HLS for Apple devices
                    {
                        url: 'https://stream.example.com/playlist.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                    },
                    // Progressive fallback
                    {
                        url: 'https://cdn.example.com/fallback.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        delivery: 'progressive',
                        bitrate: 2000000,
                    },
                ],
            },
        },
    ],
});
```

## Tracking & Analytics

Comprehensive tracking for ad performance measurement.

### Standard IAB Quartiles

Use the helper function for standard tracking:

```typescript
import { withIABQuartiles } from 'vast4-builder';

const standardTracking = buildInlineAd({
    title: 'Standard Tracking Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                tracking: withIABQuartiles(
                    'https://analytics.example.com/track?event={event}&id=12345'
                ),
                mediaFiles: [
                    /* ... */
                ],
            },
        },
    ],
});
```

### Custom Progress Tracking

Track specific moments in ad playback:

```typescript
const customTracking = buildInlineAd({
    title: 'Custom Tracking Ad',
    impressions: ['https://analytics.example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:01:00', // 60-second ad
                tracking: [
                    // Standard quartiles
                    { event: 'start', url: 'https://analytics.example.com/start' },
                    { event: 'firstQuartile', url: 'https://analytics.example.com/q1' },
                    { event: 'midpoint', url: 'https://analytics.example.com/mid' },
                    { event: 'thirdQuartile', url: 'https://analytics.example.com/q3' },
                    { event: 'complete', url: 'https://analytics.example.com/complete' },

                    // Custom time-based tracking
                    {
                        event: 'progress',
                        offset: '00:00:05',
                        url: 'https://analytics.example.com/5s',
                    },
                    {
                        event: 'progress',
                        offset: '00:00:10',
                        url: 'https://analytics.example.com/10s',
                    },
                    {
                        event: 'progress',
                        offset: '00:00:30',
                        url: 'https://analytics.example.com/30s',
                    },

                    // Percentage-based tracking
                    {
                        event: 'progress',
                        offset: '10%',
                        url: 'https://analytics.example.com/10pct',
                    },
                    {
                        event: 'progress',
                        offset: '90%',
                        url: 'https://analytics.example.com/90pct',
                    },

                    // Interaction tracking
                    { event: 'mute', url: 'https://analytics.example.com/mute' },
                    { event: 'unmute', url: 'https://analytics.example.com/unmute' },
                    { event: 'pause', url: 'https://analytics.example.com/pause' },
                    { event: 'resume', url: 'https://analytics.example.com/resume' },
                    { event: 'fullscreen', url: 'https://analytics.example.com/fullscreen' },
                    {
                        event: 'exitFullscreen',
                        url: 'https://analytics.example.com/exit-fullscreen',
                    },
                    { event: 'skip', url: 'https://analytics.example.com/skip' },
                ],
                mediaFiles: [
                    /* ... */
                ],
            },
        },
    ],
});
```

### Multiple Analytics Providers

Send tracking to multiple systems:

```typescript
const multiAnalyticsAd = buildInlineAd({
    title: 'Multi-Analytics Ad',
    impressions: [
        'https://primary-analytics.com/impression',
        'https://backup-analytics.com/impression',
        'https://client-analytics.com/impression',
    ],
    errorUrls: ['https://primary-analytics.com/error', 'https://backup-analytics.com/error'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                tracking: [
                    // Primary analytics
                    { event: 'start', url: 'https://primary-analytics.com/start' },
                    { event: 'complete', url: 'https://primary-analytics.com/complete' },

                    // Backup analytics
                    { event: 'start', url: 'https://backup-analytics.com/start' },
                    { event: 'complete', url: 'https://backup-analytics.com/complete' },

                    // Client analytics
                    { event: 'start', url: 'https://client-analytics.com/start' },
                    { event: 'complete', url: 'https://client-analytics.com/complete' },
                ],
                clicks: {
                    clickThrough: 'https://example.com/landing',
                    clickTracking: [
                        'https://primary-analytics.com/click',
                        'https://backup-analytics.com/click',
                        'https://client-analytics.com/click',
                    ],
                },
                mediaFiles: [
                    /* ... */
                ],
            },
        },
    ],
});
```

## Validation & Error Handling

Ensure VAST compliance and handle errors gracefully.

### Basic Validation

```typescript
import { validateVast } from 'vast4-builder';

const ad = buildInlineAd({
    title: 'Test Ad',
    impressions: ['https://example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://example.com/video.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});

const vastXml = buildVast({ ads: [ad] });

// Validate the generated VAST
const validation = validateVast(vastXml);

if (validation.isValid) {
    console.log('✅ VAST is valid');
} else {
    console.log('❌ Validation errors:');
    validation.errors.forEach((error) => console.log(`  - ${error}`));
}

if (validation.warnings && validation.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    validation.warnings.forEach((warning) => console.log(`  - ${warning}`));
}
```

### Pre-Build Validation

Validate individual components before building:

```typescript
import { isValidUrl, isValidDuration, isValidMimeType } from 'vast4-builder';

// Validate URLs
const impressionUrl = 'https://analytics.example.com/impression';
if (!isValidUrl(impressionUrl)) {
    throw new Error(`Invalid impression URL: ${impressionUrl}`);
}

// Validate duration
const duration = '00:00:30';
if (!isValidDuration(duration)) {
    throw new Error(`Invalid duration format: ${duration}`);
}

// Validate MIME type
const mimeType = 'video/mp4';
if (!isValidMimeType(mimeType)) {
    throw new Error(`Invalid MIME type: ${mimeType}`);
}

// Build with confidence
const ad = buildInlineAd({
    title: 'Validated Ad',
    impressions: [impressionUrl],
    creatives: [
        {
            linear: {
                duration: duration,
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/video.mp4',
                        type: mimeType,
                        width: 1920,
                        height: 1080,
                    },
                ],
            },
        },
    ],
});
```

### Error Recovery Patterns

```typescript
import { buildVast, buildInlineAd, validateVast } from 'vast4-builder';

function createRobustVAST(adConfig: any): string {
    try {
        // Build the ad
        const ad = buildInlineAd(adConfig);
        const vast = buildVast({ ads: [ad] });

        // Validate before returning
        const validation = validateVast(vast);

        if (!validation.isValid) {
            console.warn('VAST validation failed, attempting recovery...');

            // Log specific issues
            validation.errors.forEach((error) => {
                console.error(`Validation error: ${error}`);
            });

            // Attempt to create a minimal fallback ad
            const fallbackAd = buildInlineAd({
                title: adConfig.title || 'Fallback Ad',
                impressions: Array.isArray(adConfig.impressions)
                    ? adConfig.impressions
                    : ['https://example.com/fallback-impression'],
                creatives: [
                    {
                        linear: {
                            duration: '00:00:30',
                            mediaFiles: [
                                {
                                    url: 'https://cdn.example.com/fallback.mp4',
                                    type: 'video/mp4',
                                    width: 640,
                                    height: 360,
                                },
                            ],
                        },
                    },
                ],
            });

            return buildVast({ ads: [fallbackAd] });
        }

        return vast;
    } catch (error) {
        console.error('Failed to create VAST:', error);

        // Return minimal valid VAST as last resort
        const emergencyAd = buildInlineAd({
            title: 'Emergency Fallback',
            impressions: ['https://example.com/emergency-impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
                        mediaFiles: [
                            {
                                url: 'https://cdn.example.com/emergency.mp4',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                            },
                        ],
                    },
                },
            ],
        });

        return buildVast({ ads: [emergencyAd] });
    }
}
```

## Best Practices

### Performance Optimization

1. **Use appropriate media file sizes**:

```typescript
// Good: Multiple quality options
mediaFiles: [
    {
        url: 'https://cdn.example.com/mobile.mp4',
        type: 'video/mp4',
        width: 640,
        height: 360,
        bitrate: 500000, // 500 kbps for mobile
    },
    {
        url: 'https://cdn.example.com/desktop.mp4',
        type: 'video/mp4',
        width: 1920,
        height: 1080,
        bitrate: 2000000, // 2 Mbps for desktop
    },
];
```

2. **Implement fallback chains**:

```typescript
mediaFiles: [
    // Primary: Streaming format
    {
        url: 'https://stream.example.com/playlist.m3u8',
        type: 'application/vnd.apple.mpegurl',
        width: 1920,
        height: 1080,
        delivery: 'streaming',
    },
    // Fallback: Progressive download
    {
        url: 'https://cdn.example.com/fallback.mp4',
        type: 'video/mp4',
        width: 1920,
        height: 1080,
        delivery: 'progressive',
    },
];
```

### Analytics Best Practices

1. **Use multiple tracking URLs for redundancy**:

```typescript
impressions: [
  'https://primary-analytics.com/impression',
  'https://backup-analytics.com/impression'
],
errorUrls: [
  'https://primary-analytics.com/error',
  'https://backup-analytics.com/error'
]
```

2. **Include session identifiers**:

```typescript
const sessionId = generateSessionId();
const userId = getCurrentUserId();

impressions: [
  `https://analytics.com/impression?session=${sessionId}&user=${userId}`
],
tracking: [
  {
    event: 'start',
    url: `https://analytics.com/start?session=${sessionId}&user=${userId}`
  }
]
```

### Security Considerations

1. **Validate all URLs**:

```typescript
import { isValidUrl } from 'vast4-builder';

const urls = ['https://analytics.example.com/impression', 'https://cdn.example.com/video.mp4'];

urls.forEach((url) => {
    if (!isValidUrl(url)) {
        throw new Error(`Security: Invalid URL detected: ${url}`);
    }

    // Additional security checks
    const urlObj = new URL(url);
    if (!['https:', 'http:'].includes(urlObj.protocol)) {
        throw new Error(`Security: Invalid protocol: ${urlObj.protocol}`);
    }
});
```

2. **Sanitize content for CDATA**:

```typescript
import { cdata } from 'vast4-builder';

// The library handles CDATA safely, but be aware of content
const adParameters = JSON.stringify({
    // Safe: No ]]> sequences
    campaignId: 'summer2024',
    userId: 'user123',
});
```

### Testing Strategies

1. **Unit test your ad configurations**:

```typescript
import { buildInlineAd, validateVast, buildVast } from 'vast4-builder';

describe('Ad Configuration Tests', () => {
    test('should create valid linear ad', () => {
        const ad = buildInlineAd({
            title: 'Test Ad',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        mediaFiles: [
                            {
                                url: 'https://example.com/video.mp4',
                                type: 'video/mp4',
                                width: 1920,
                                height: 1080,
                            },
                        ],
                    },
                },
            ],
        });

        const vast = buildVast({ ads: [ad] });
        const validation = validateVast(vast);

        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
    });
});
```

2. **Integration test with real URLs**:

```typescript
test('should handle real streaming URLs', async () => {
    // Use actual test URLs from your CDN
    const ad = buildInlineAd({
        title: 'Real URL Test',
        impressions: ['https://analytics.test.example.com/impression'],
        creatives: [
            {
                linear: {
                    duration: '00:00:30',
                    mediaFiles: [
                        {
                            url: 'https://cdn.test.example.com/test-video.mp4',
                            type: 'video/mp4',
                            width: 1920,
                            height: 1080,
                        },
                    ],
                },
            },
        ],
    });

    const vast = buildVast({ ads: [ad] });

    // Optionally verify URLs are reachable
    const mediaUrl = 'https://cdn.test.example.com/test-video.mp4';
    const response = await fetch(mediaUrl, { method: 'HEAD' });
    expect(response.ok).toBe(true);
});
```

## Troubleshooting

### Common Issues

#### 1. Invalid Duration Format

```
Error: Invalid duration format
```

**Solution**: Ensure duration is in HH:MM:SS format:

```typescript
// ❌ Wrong
duration: '30';
duration: '0:30';
duration: '30s';

// ✅ Correct
duration: '00:00:30';
```

#### 2. Missing Required Properties

```
Error: Missing required property 'impressions'
```

**Solution**: Include all required properties:

```typescript
// ❌ Missing impressions
buildInlineAd({
  title: 'My Ad'
  // creatives: [...]
});

// ✅ Complete
buildInlineAd({
  title: 'My Ad',
  impressions: ['https://example.com/impression'],
  creatives: [{ linear: { duration: '00:00:30', mediaFiles: [...] } }]
});
```

#### 3. Invalid URL Format

```
Error: Invalid URL format
```

**Solution**: Use complete, valid URLs:

```typescript
// ❌ Invalid URLs
impressions: ['example.com'];
impressions: ['//example.com/path'];
impressions: ['ftp://example.com'];

// ✅ Valid URLs
impressions: ['https://example.com/impression'];
impressions: ['http://localhost:3000/track'];
```

#### 4. CDATA Content Issues

```
Warning: Content contains ]]> sequence
```

**Solution**: The library handles this automatically, but be aware:

```typescript
// Content with ]]> is automatically escaped, not wrapped in CDATA
const problematicContent = 'Some content with ]]> in it';
// Library will XML-escape this instead of using CDATA
```

### Debugging Tips

1. **Enable verbose validation**:

```typescript
const validation = validateVast(vastXml);
console.log('Validation result:', JSON.stringify(validation, null, 2));
```

2. **Check generated XML structure**:

```typescript
const vast = buildVast({ ads: [ad] });
console.log('Generated VAST:');
console.log(vast);

// Use XML formatter for better readability
import { formatXml } from 'xml-formatter';
console.log(formatXml(vast));
```

3. **Validate individual components**:

```typescript
import { isValidUrl, isValidDuration, isValidMimeType } from 'vast4-builder';

console.log('URL valid:', isValidUrl('https://example.com/video.mp4'));
console.log('Duration valid:', isValidDuration('00:00:30'));
console.log('MIME valid:', isValidMimeType('video/mp4'));
```

This comprehensive user guide covers all aspects of building VAST 4.1 XML with the TypeScript package. For additional examples and API details, see the `/examples` directory and API documentation.
