# VAST4Builder API Documentation

Complete API reference for the VAST 4.1 TypeScript package.

## Table of Contents

-   [Core Functions](#core-functions)
-   [Builder Functions](#builder-functions)
-   [Utility Functions](#utility-functions)
-   [Validation Functions](#validation-functions)
-   [Type Definitions](#type-definitions)
-   [Error Handling](#error-handling)
-   [Advanced Usage](#advanced-usage)

## Core Functions

### `buildVast(doc: VastDocument): string`

Generates the final VAST 4.1 XML document from a structured document object.

**Parameters:**

-   `doc: VastDocument` - Document configuration with ads array and optional metadata

**Returns:**

-   `string` - Complete VAST 4.1 XML document

**Example:**

```typescript
import { buildVast, buildInlineAd } from 'vast4-builder';

const ad = buildInlineAd({
    title: 'My Video Ad',
    impressions: ['https://example.com/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://example.com/video.mp4',
                        type: 'video/mp4',
                        width: 640,
                        height: 360,
                    },
                ],
            },
        },
    ],
});

const vastXml = buildVast({
    ads: [ad],
    version: '3.0',
    errorUrl: 'https://example.com/error',
});
```

### `parseVast(xml: string): Vast4Json`

Parses VAST XML into a structured JSON object for programmatic access.

**Parameters:**

-   `xml: string` - Valid VAST 4.1 XML document

**Returns:**

-   `Vast4Json` - Parsed VAST structure as JSON

**Throws:**

-   `Error` - If XML is malformed or invalid

**Example:**

```typescript
import { parseVast } from 'vast4-builder';

const vastXml = `<?xml version="1.0"?>
<VAST version="3.0">
  <!-- VAST content -->
</VAST>`;

try {
    const parsed = parseVast(vastXml);
    console.log('VAST version:', parsed.VAST['@version']);
    console.log('Number of ads:', parsed.VAST.Ad.length);
} catch (error) {
    console.error('Parse error:', error.message);
}
```

### `validateVast(input: string | object): ValidationResult`

Validates VAST structure against spec requirements and common issues.

**Parameters:**

-   `input: string | object` - VAST XML string or parsed object

**Returns:**

-   `ValidationResult` - Validation status and error details

**Example:**

```typescript
import { validateVast } from 'vast4-builder';

const result = validateVast(vastXml);

if (result.isValid) {
    console.log('VAST is valid!');
} else {
    console.log('Validation errors:', result.errors);
    console.log('Warnings:', result.warnings);
}
```

## Builder Functions

### `buildInlineAd(opts: InlineAdOpts): BuiltAd`

Creates a complete InLine ad with embedded creative content.

**Parameters:**

-   `opts: InlineAdOpts` - Configuration for the inline ad

**Returns:**

-   `BuiltAd` - Constructed ad object ready for VAST generation

**Required Properties:**

-   `title: string` - Ad title for identification
-   `impressions: URLString[]` - Array of impression tracking URLs
-   `creatives: Creative[]` - Array of creative elements

**Optional Properties:**

-   `id?: string | number` - Unique ad identifier
-   `adSystem?: string` - Ad serving system name (default: 'VAST4Builder')
-   `errorUrls?: URLString[]` - Error tracking URLs

**Example:**

```typescript
const inlineAd = buildInlineAd({
    id: 'ad-12345',
    title: 'Summer Sale Video',
    adSystem: 'MyAdServer',
    impressions: [
        'https://analytics.example.com/impression',
        'https://backup.example.com/impression',
    ],
    errorUrls: ['https://analytics.example.com/error'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05',
                tracking: [
                    { event: 'start', url: 'https://analytics.example.com/start' },
                    { event: 'complete', url: 'https://analytics.example.com/complete' },
                ],
                clicks: {
                    clickThrough: 'https://example.com/landing',
                    clickTracking: ['https://analytics.example.com/click'],
                },
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

### `buildWrapperAd(opts: WrapperAdOpts): BuiltAd`

Creates a Wrapper ad that chains to another VAST tag for ad server mediation.

**Parameters:**

-   `opts: WrapperAdOpts` - Configuration for the wrapper ad

**Returns:**

-   `BuiltAd` - Constructed wrapper ad object

**Required Properties:**

-   `vastAdTagURI: URLString` - URL to the next VAST tag in the chain
-   `impressions: URLString[]` - Wrapper-level impression tracking

**Optional Properties:**

-   `id?: string | number` - Unique ad identifier
-   `adSystem?: string` - Ad serving system name
-   `errorUrls?: URLString[]` - Error tracking URLs
-   `tracking?: TrackingEvent[]` - Wrapper-level tracking events
-   `clicks?: Clicks` - Click tracking for wrapper

**Example:**

```typescript
const wrapperAd = buildWrapperAd({
    id: 'wrapper-67890',
    adSystem: 'NetworkA',
    vastAdTagURI: 'https://networkb.example.com/vast?id=12345',
    impressions: ['https://networka.example.com/wrapper-impression'],
    errorUrls: ['https://networka.example.com/wrapper-error'],
    tracking: [
        { event: 'start', url: 'https://networka.example.com/start' },
        { event: 'complete', url: 'https://networka.example.com/complete' },
    ],
    clicks: {
        clickTracking: ['https://networka.example.com/wrapper-click'],
    },
});
```

### `buildAdPod(ads: BuiltAd[]): BuiltAd[]`

Converts individual ads into a sequenced ad pod for back-to-back playback.

**Parameters:**

-   `ads: BuiltAd[]` - Array of pre-built ads to sequence

**Returns:**

-   `BuiltAd[]` - Array of ads with proper sequencing attributes

**Example:**

```typescript
const ad1 = buildInlineAd({
    /* config */
});
const ad2 = buildInlineAd({
    /* config */
});
const ad3 = buildInlineAd({
    /* config */
});

const podAds = buildAdPod([ad1, ad2, ad3]);

const vastXml = buildVast({
    ads: podAds,
});
```

## Utility Functions

### `toClockTime(seconds: number): string`

Converts numeric seconds to VAST-compliant HH:MM:SS format.

**Parameters:**

-   `seconds: number` - Duration in seconds

**Returns:**

-   `string` - Formatted time string (HH:MM:SS)

**Example:**

```typescript
import { toClockTime } from 'vast4-builder';

console.log(toClockTime(30)); // "00:00:30"
console.log(toClockTime(90)); // "00:01:30"
console.log(toClockTime(3661)); // "01:01:01"
```

### `withIABQuartiles(baseUrl: string): TrackingEvent[]`

Generates standard IAB quartile tracking events with a base URL template.

**Parameters:**

-   `baseUrl: string` - Base URL template (use `{event}` placeholder)

**Returns:**

-   `TrackingEvent[]` - Array of standard quartile tracking events

**Example:**

```typescript
import { withIABQuartiles } from 'vast4-builder';

const tracking = withIABQuartiles('https://analytics.example.com/track?event={event}&id=12345');

// Generates:
// [
//   { event: 'start', url: 'https://analytics.example.com/track?event=start&id=12345' },
//   { event: 'firstQuartile', url: 'https://analytics.example.com/track?event=firstQuartile&id=12345' },
//   { event: 'midpoint', url: 'https://analytics.example.com/track?event=midpoint&id=12345' },
//   { event: 'thirdQuartile', url: 'https://analytics.example.com/track?event=thirdQuartile&id=12345' },
//   { event: 'complete', url: 'https://analytics.example.com/track?event=complete&id=12345' }
// ]
```

### `cdata(content: string): string`

Marks content for CDATA wrapping in XML output (handled automatically).

**Parameters:**

-   `content: string` - Content to be wrapped

**Returns:**

-   `string` - Same content (wrapper handled by XML builder)

**Note:** The XML builder automatically handles CDATA wrapping based on content. This function is provided for explicit marking but is generally not needed.

**Example:**

```typescript
import { cdata } from 'vast4-builder';

// Not typically needed - XML builder handles automatically
const safeContent = cdata('<script>alert("test")</script>');
```

## Validation Functions

### `isValidUrl(url: string): boolean`

Validates URL format for VAST compatibility.

**Parameters:**

-   `url: string` - URL to validate

**Returns:**

-   `boolean` - True if valid URL format

### `isValidDuration(duration: string): boolean`

Validates VAST duration format (HH:MM:SS or HH:MM:SS.mmm).

**Parameters:**

-   `duration: string` - Duration string to validate

**Returns:**

-   `boolean` - True if valid duration format

### `isValidProgressOffset(offset: string): boolean`

Validates progress offset format for tracking events.

**Parameters:**

-   `offset: string` - Progress offset (percentage, time, or keyword)

**Returns:**

-   `boolean` - True if valid offset format

**Valid Formats:**

-   Percentage: `"25%"`, `"50%"`, `"75%"`
-   Time: `"00:00:05"`, `"00:00:15"`
-   Keywords: `"start"`, `"firstQuartile"`, `"midpoint"`, `"thirdQuartile"`

### `isValidMimeType(mimeType: string): boolean`

Validates MIME type format.

**Parameters:**

-   `mimeType: string` - MIME type to validate

**Returns:**

-   `boolean` - True if valid MIME type format

## Type Definitions

### Core Types

#### `URLString`

```typescript
type URLString = string;
```

String representing a valid URL.

#### `TrackingEventName`

```typescript
type TrackingEventName =
    | 'start'
    | 'firstQuartile'
    | 'midpoint'
    | 'thirdQuartile'
    | 'complete'
    | 'mute'
    | 'unmute'
    | 'pause'
    | 'rewind'
    | 'resume'
    | 'fullscreen'
    | 'exitFullscreen'
    | 'expand'
    | 'collapse'
    | 'acceptInvitation'
    | 'close'
    | 'creativeView'
    | 'skip'
    | 'progress';
```

#### `TrackingEvent`

```typescript
interface TrackingEvent {
    event: TrackingEventName | (string & {});
    url: URLString;
    offset?: string; // For progress events
}
```

#### `MediaFile`

```typescript
interface MediaFile {
    url: URLString;
    type: string; // MIME type
    width: number;
    height: number;
    delivery?: 'progressive' | 'streaming';
    bitrate?: number;
    minBitrate?: number;
    maxBitrate?: number;
    scalable?: boolean;
    maintainAspectRatio?: boolean;
    codec?: string;
}
```

#### `Clicks`

```typescript
interface Clicks {
    clickThrough?: URLString;
    clickTracking?: URLString[];
    customClick?: Array<{
        id: string;
        url: URLString;
    }>;
}
```

### Creative Types

#### `LinearCreativeOpts`

```typescript
interface LinearCreativeOpts {
    duration: string; // "HH:MM:SS"
    skipoffset?: string; // enables skippable
    tracking?: TrackingEvent[];
    clicks?: Clicks;
    mediaFiles: MediaFile[];
}
```

#### `NonLinearUnit`

```typescript
interface NonLinearUnit {
    width: number;
    height: number;
    expandedWidth?: number;
    expandedHeight?: number;
    scalable?: boolean;
    maintainAspectRatio?: boolean;
    minSuggestedDuration?: string;
    apiFramework?: string;
    staticResource?: URLString;
    iframeResource?: URLString;
    htmlResource?: string;
    nonLinearClickThrough?: URLString;
    nonLinearClickTracking?: URLString[];
    adParameters?: string;
}
```

#### `Creative`

```typescript
interface Creative {
    linear?: LinearCreativeOpts;
    nonLinear?: NonLinearCreativeOpts;
}
```

### Ad Configuration Types

#### `InlineAdOpts`

```typescript
interface InlineAdOpts {
    id?: string | number;
    title: string;
    adSystem?: string;
    impressions: URLString[];
    errorUrls?: URLString[];
    creatives: Creative[];
}
```

#### `WrapperAdOpts`

```typescript
interface WrapperAdOpts {
    id?: string | number;
    adSystem?: string;
    vastAdTagURI: URLString;
    impressions: URLString[];
    errorUrls?: URLString[];
    tracking?: TrackingEvent[];
    clicks?: Clicks;
}
```

#### `VastDocument`

```typescript
interface VastDocument {
    ads: BuiltAd[];
    version?: string;
    errorUrl?: URLString;
}
```

### Validation Types

#### `ValidationResult`

```typescript
interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
```

## Error Handling

### Common Errors

#### Invalid Duration Format

```typescript
// ❌ Invalid
{
    duration: '30';
} // Missing time format
{
    duration: '0:30';
} // Wrong format
{
    duration: '30s';
} // Wrong format

// ✅ Valid
{
    duration: '00:00:30';
} // Correct HH:MM:SS format
```

#### Invalid URL Format

```typescript
// ❌ Invalid
impressions: ['not-a-url'];
impressions: ['ftp://example.com'];

// ✅ Valid
impressions: ['https://example.com/impression'];
impressions: ['http://localhost:3000/track'];
```

#### Missing Required Properties

```typescript
// ❌ Invalid - missing required fields
buildInlineAd({
  title: "My Ad"
  // Missing impressions and creatives
});

// ✅ Valid - all required fields present
buildInlineAd({
  title: "My Ad",
  impressions: ["https://example.com/impression"],
  creatives: [{ linear: { duration: "00:00:30", mediaFiles: [...] } }]
});
```

### Error Handling Best Practices

```typescript
import { buildVast, buildInlineAd, validateVast } from 'vast4-builder';

try {
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
                            width: 640,
                            height: 360,
                        },
                    ],
                },
            },
        ],
    });

    const vast = buildVast({ ads: [ad] });

    // Validate before using
    const validation = validateVast(vast);
    if (!validation.isValid) {
        throw new Error(`VAST validation failed: ${validation.errors.join(', ')}`);
    }

    console.log('VAST generated successfully');
} catch (error) {
    console.error('VAST generation failed:', error.message);
    // Handle error appropriately for your use case
}
```

## Advanced Usage

### Streaming Formats

#### HLS Support

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

#### DASH Support

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

### Multi-Format Media Files

```typescript
const adaptiveAd = buildInlineAd({
    title: 'Adaptive Streaming Ad',
    impressions: ['https://analytics.example.com/adaptive'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    // Progressive downloads for fallback
                    {
                        url: 'https://cdn.example.com/360p.mp4',
                        type: 'video/mp4',
                        width: 640,
                        height: 360,
                        bitrate: 800000,
                        delivery: 'progressive',
                    },
                    {
                        url: 'https://cdn.example.com/720p.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        bitrate: 1500000,
                        delivery: 'progressive',
                    },
                    // Streaming manifests for adaptive playback
                    {
                        url: 'https://stream.example.com/playlist.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                    },
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

### Complex Tracking Setup

```typescript
const complexAd = buildInlineAd({
    title: 'Complex Tracking Ad',
    impressions: [
        'https://primary.analytics.com/impression',
        'https://backup.analytics.com/impression',
    ],
    errorUrls: ['https://primary.analytics.com/error', 'https://backup.analytics.com/error'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05',
                tracking: [
                    // Standard quartiles
                    ...withIABQuartiles('https://analytics.example.com/track?event={event}'),

                    // Custom progress tracking
                    {
                        event: 'progress',
                        offset: '00:00:10',
                        url: 'https://analytics.example.com/10s',
                    },
                    {
                        event: 'progress',
                        offset: '50%',
                        url: 'https://analytics.example.com/50pct',
                    },

                    // Interaction tracking
                    { event: 'mute', url: 'https://analytics.example.com/mute' },
                    { event: 'unmute', url: 'https://analytics.example.com/unmute' },
                    { event: 'pause', url: 'https://analytics.example.com/pause' },
                    { event: 'resume', url: 'https://analytics.example.com/resume' },
                    { event: 'fullscreen', url: 'https://analytics.example.com/fullscreen' },
                    { event: 'skip', url: 'https://analytics.example.com/skip' },
                ],
                clicks: {
                    clickThrough: 'https://example.com/landing',
                    clickTracking: [
                        'https://analytics.example.com/click',
                        'https://backup.analytics.com/click',
                    ],
                    customClick: [
                        { id: 'cta-button', url: 'https://analytics.example.com/cta' },
                        { id: 'logo-click', url: 'https://analytics.example.com/logo' },
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

### Ad Server Chaining with Wrappers

```typescript
// Network A creates wrapper pointing to Network B
const networkAWrapper = buildWrapperAd({
    adSystem: 'NetworkA AdServer v2.1',
    vastAdTagURI: 'https://networkb.com/vast?placement=premium&auction=12345',
    impressions: ['https://networka.com/wrapper-impression'],
    tracking: [
        { event: 'start', url: 'https://networka.com/start' },
        { event: 'complete', url: 'https://networka.com/complete' },
    ],
    clicks: {
        clickTracking: ['https://networka.com/wrapper-click'],
    },
});

// Network B creates final inline ad
const networkBInline = buildInlineAd({
    adSystem: 'NetworkB AdServer v1.8',
    title: 'Final Ad Creative',
    impressions: ['https://networkb.com/final-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                tracking: [
                    { event: 'start', url: 'https://networkb.com/start' },
                    { event: 'complete', url: 'https://networkb.com/complete' },
                ],
                mediaFiles: [
                    /* final creative */
                ],
            },
        },
    ],
});
```

This comprehensive API documentation covers all aspects of the VAST4Builder package. For additional examples, see the `examples/` directory in the package.
