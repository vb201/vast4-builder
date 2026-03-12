# VAST 4.0 Builder

[![npm version](https://badge.fury.io/js/vast4-builder.svg)](https://badge.fury.io/js/vast4-builder)
[![npm downloads](https://img.shields.io/npm/dm/vast4-builder.svg)](https://www.npmjs.com/package/vast4-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Production-ready VAST 4.0 XML builder and parser for Linear, Non-Linear, Ad Pods, and Wrapper ads. Built with TypeScript and fully compliant with the IAB VAST 4.0 specification.

## Features

-   🎯 **Complete VAST 4.0 Support**: Linear ads, Non-Linear overlays, Ad Pods, and Wrapper ads
-   🔧 **TypeScript First**: Full type safety with comprehensive interfaces
-   📺 **Media Rich**: Multi-bitrate support, streaming manifests (HLS/DASH), progressive delivery
-   📊 **Tracking Complete**: IAB quartiles, custom events, progress tracking, click tracking
-   🎮 **Interactive**: Skippable ads, click-through URLs, custom telemetry
-   🔗 **Ad Chaining**: Wrapper ads for ad network chains
-   🎬 **Ad Pods**: Sequential ad playback (pre-roll, mid-roll, post-roll)
-   ✅ **Validation**: Runtime validation with extensible XSD support
-   🧪 **Well Tested**: Comprehensive test suite with golden fixtures

## Installation

```bash
# Using pnpm (recommended)
pnpm add vast4-builder

# Using npm
npm install vast4-builder

# Using yarn
yarn add vast4-builder
```

## Quick Start

### Basic Linear Ad

```typescript
import { buildInlineAd, buildVast } from 'vast4-builder';

const ad = buildInlineAd({
    title: 'My Pre-roll Ad',
    impressions: ['https://example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://example.com/video.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                        bitrate: 1500,
                    },
                ],
            },
        },
    ],
});

const xml = buildVast({ ads: [ad] });
console.log(xml);
```

### Skippable Ad with Tracking

```typescript
import { buildInlineAd, withIABQuartiles } from 'vast4-builder';

const skippableAd = buildInlineAd({
    title: 'Skippable Pre-roll',
    impressions: ['https://example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05', // Skippable after 5 seconds
                tracking: [
                    ...withIABQuartiles('https://example.com/tracking'),
                    { event: 'skip', url: 'https://example.com/skip' },
                    { event: 'progress', offset: '00:00:10', url: 'https://example.com/10s' },
                ],
                clicks: {
                    clickThrough: 'https://example.com/landing',
                    clickTracking: ['https://example.com/click'],
                },
                mediaFiles: [
                    // Progressive ladder
                    {
                        url: 'https://cdn.example.com/360p.mp4',
                        type: 'video/mp4',
                        width: 640,
                        height: 360,
                        bitrate: 800,
                        delivery: 'progressive',
                    },
                    {
                        url: 'https://cdn.example.com/720p.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        bitrate: 1500,
                        delivery: 'progressive',
                    },
                    // Streaming manifests
                    {
                        url: 'https://stream.example.com/playlist.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1280,
                        height: 720,
                        delivery: 'streaming',
                    },
                ],
            },
        },
    ],
});
```

### Ad Pod (Sequential Ads)

```typescript
import { buildAdPod } from 'vast4-builder';

const ad1 = buildInlineAd({
    title: 'First Ad',
    impressions: ['https://example.com/imp1'],
    creatives: [
        {
            linear: {
                duration: '00:00:15',
                mediaFiles: [
                    /* ... */
                ],
            },
        },
    ],
});

const ad2 = buildInlineAd({
    title: 'Second Ad',
    impressions: ['https://example.com/imp2'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    /* ... */
                ],
            },
        },
    ],
});

const pod = buildAdPod([ad1, ad2]);
const xml = buildVast({ ads: pod });
```

### Wrapper Ad (Ad Network Chain)

```typescript
import { buildWrapperAd } from 'vast4-builder';

const wrapper = buildWrapperAd({
    impressions: ['https://networkA.com/impression'],
    vastAdTagURI: 'https://networkB.com/vast-tag',
    tracking: [{ event: 'start', url: 'https://networkA.com/start' }],
    clicks: {
        clickTracking: ['https://networkA.com/click'],
    },
});
```

### Non-Linear Overlay

```typescript
const overlay = buildInlineAd({
    title: 'Banner Overlay',
    impressions: ['https://example.com/overlay-imp'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 300,
                        height: 50,
                        minSuggestedDuration: '00:00:15',
                        staticResource: 'https://example.com/banner.png',
                        nonLinearClickThrough: 'https://example.com/landing',
                        nonLinearClickTracking: ['https://example.com/overlay-click'],
                    },
                ],
            },
        },
    ],
});
```

### Streaming Formats Support

VAST4Builder fully supports modern streaming formats alongside traditional progressive download:

#### HLS (HTTP Live Streaming)

```typescript
const hlsAd = buildInlineAd({
    title: 'HLS Streaming Ad',
    impressions: ['https://analytics.example.com/hls'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://stream.example.com/playlist.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                    },
                ],
            },
        },
    ],
});
```

#### DASH (Dynamic Adaptive Streaming)

```typescript
const dashAd = buildInlineAd({
    title: 'DASH Streaming Ad',
    impressions: ['https://analytics.example.com/dash'],
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
                    },
                ],
            },
        },
    ],
});
```

#### Progressive Download (Traditional)

```typescript
const progressiveAd = buildInlineAd({
    title: 'Progressive Video Ad',
    impressions: ['https://analytics.example.com/progressive'],
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
                        delivery: 'progressive',
                        bitrate: 2000000,
                    },
                ],
            },
        },
    ],
});
```

**Supported Formats:**

-   🎬 **HLS**: `.m3u8` files with `application/vnd.apple.mpegurl`
-   🎬 **DASH**: `.mpd` files with `application/dash+xml`
-   🎬 **Progressive**: `.mp4`, `.webm`, `.mov` with respective MIME types
-   🎬 **Multi-bitrate**: Adaptive streaming with quality ladders

See `examples/streaming-formats.ts` for comprehensive examples.

## API Reference

### Core Functions

#### `buildInlineAd(opts: InlineAdOpts): BuiltAd`

Builds a complete InLine ad with creatives and tracking.

#### `buildWrapperAd(opts: WrapperAdOpts): BuiltAd`

Builds a Wrapper ad with automatic wrapper-mode constraints enforcement.

#### `buildAdPod(ads: BuiltAd[]): BuiltAd[]`

Converts a list of ads into a sequenced pod.

#### `buildVast(doc: VastDocument): string`

Generates the final VAST 4.0 XML document.

#### `parseVast(xml: string): Vast4Json`

Parses VAST XML into structured JSON.

#### `validateVast(input: string | object): ValidationResult`

Validates VAST structure (runtime checks + optional XSD).

### Utility Functions

#### `toClockTime(seconds: number): string`

Converts seconds to `HH:MM:SS` format.

#### `withIABQuartiles(baseUrl: string): TrackingEvent[]`

Generates standard IAB quartile tracking events.

#### `cdata(content: string): string`

Marks content for CDATA wrapping (handled automatically by XML builder).

## TypeScript Support

Full TypeScript support with comprehensive interfaces:

```typescript
interface LinearCreativeOpts {
    duration: string; // "HH:MM:SS"
    skipoffset?: string;
    tracking?: TrackingEvent[];
    clicks?: Clicks;
    mediaFiles: MediaFile[];
}

interface MediaFile {
    url: string;
    type: string; // MIME type
    width: number;
    height: number;
    delivery?: 'progressive' | 'streaming';
    bitrate?: number;
    // ... more options
}

interface TrackingEvent {
    event: TrackingEventName | string;
    url: string;
    offset?: string; // "HH:MM:SS" or "n%"
}
```

## VAST 4.0 Compliance

This library implements the complete IAB VAST 4.0 specification:

-   ✅ **Linear Ads**: Duration, skippable, media files, tracking, clicks
-   ✅ **Non-Linear Ads**: Static/iframe/HTML resources, click tracking
-   ✅ **Ad Pods**: Sequential playback with sequence numbers
-   ✅ **Wrapper Ads**: Ad network chaining with tracking shells
-   ✅ **Media Files**: Multi-bitrate, progressive/streaming delivery
-   ✅ **Tracking Events**: IAB quartiles, custom events, progress tracking
-   ✅ **Click Tracking**: ClickThrough, ClickTracking, CustomClick
-   ✅ **Error Handling**: Error URLs with macro support
-   ✅ **Extensions**: Custom telemetry and data
-   ✅ **CDATA Handling**: Proper XML escaping

### Wrapper-Mode Constraints

The library automatically enforces VAST 4.0 wrapper constraints:

-   Wrapper Linear creatives contain **only** VideoClicks and TrackingEvents
-   Wrapper NonLinear creatives contain **only** click tracking and events
-   **No media files** are allowed in wrapper creatives
-   Automatic validation prevents invalid wrapper structures

## Streaming Support

Built-in support for modern streaming formats:

```typescript
const streamingMediaFiles = [
    {
        url: 'https://example.com/playlist.m3u8',
        type: 'application/vnd.apple.mpegurl', // HLS
        width: 1280,
        height: 720,
        delivery: 'streaming',
    },
    {
        url: 'https://example.com/manifest.mpd',
        type: 'application/dash+xml', // DASH
        width: 1280,
        height: 720,
        delivery: 'streaming',
    },
];
```

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Building

```bash
# Build the package
pnpm build

# Development build with watch
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## Browser Support

-   Modern browsers with ES2020 support
-   Node.js 16+
-   Compatible with bundlers (Webpack, Vite, Rollup)

## 📚 Complete Documentation

This README provides a quick start guide. For comprehensive documentation:

### 📖 User Documentation

-   **[USER_GUIDE.md](docs/USER_GUIDE.md)** - Complete usage guide with examples, best practices, and troubleshooting
-   **[API.md](docs/API.md)** - Full API reference with detailed function documentation
-   **[Examples](examples/)** - Working code examples for all use cases

### 🔧 Technical Documentation

-   **[TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** - Architecture, implementation details, and extensibility

**Quick Links:**

-   🎬 [Streaming Formats Guide](docs/USER_GUIDE.md#streaming-formats) (HLS, DASH, Progressive)
-   🔗 [Ad Server Chaining](docs/USER_GUIDE.md#wrapper-ads--ad-server-chaining) (Wrapper ads)
-   📊 [Analytics & Tracking](docs/USER_GUIDE.md#tracking--analytics) (IAB quartiles, custom events)
-   🛠️ [API Reference](docs/API.md) (Complete function reference)

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Related

-   [IAB VAST 4.0 Specification](https://www.iab.com/guidelines/digital-video-ad-serving-template-vast-3-0/)

---

Built with ❤️ for the ad tech community.
