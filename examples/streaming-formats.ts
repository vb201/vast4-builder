/**
 * VAST 4.1 Streaming Formats Example
 * Demonstrates HLS, DASH, and Progressive video delivery support
 */

import { buildVast, buildInlineAd } from '../src/index';

// HLS (HTTP Live Streaming) Example
const hlsAd = buildInlineAd({
    title: 'HLS Streaming Video Ad',
    impressions: ['https://analytics.example.com/hls-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05', // Allow skip after 5 seconds
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/ads/hls/master.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                        scalable: true,
                        maintainAspectRatio: true,
                    },
                    // Mobile variant
                    {
                        url: 'https://cdn.example.com/ads/hls/mobile.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 720,
                        height: 480,
                        delivery: 'streaming',
                        maxBitrate: 1000000,
                    },
                ],
                tracking: [
                    { event: 'start', url: 'https://analytics.example.com/hls-start' },
                    { event: 'firstQuartile', url: 'https://analytics.example.com/hls-q1' },
                    { event: 'midpoint', url: 'https://analytics.example.com/hls-mid' },
                    { event: 'thirdQuartile', url: 'https://analytics.example.com/hls-q3' },
                    { event: 'complete', url: 'https://analytics.example.com/hls-complete' },
                ],
            },
        },
    ],
});

// DASH (Dynamic Adaptive Streaming over HTTP) Example
const dashAd = buildInlineAd({
    title: 'DASH Streaming Video Ad',
    impressions: ['https://analytics.example.com/dash-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/ads/dash/manifest.mpd',
                        type: 'application/dash+xml',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                        scalable: true,
                        maintainAspectRatio: true,
                    },
                ],
                tracking: [
                    { event: 'start', url: 'https://analytics.example.com/dash-start' },
                    { event: 'complete', url: 'https://analytics.example.com/dash-complete' },
                ],
            },
        },
    ],
});

// Progressive Download Example (Traditional MP4)
const progressiveAd = buildInlineAd({
    title: 'Progressive Download Video Ad',
    impressions: ['https://analytics.example.com/progressive-impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                mediaFiles: [
                    // High quality version
                    {
                        url: 'https://cdn.example.com/ads/video-1080p.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        delivery: 'progressive',
                        bitrate: 3000000,
                        codec: 'h264',
                    },
                    // Medium quality version
                    {
                        url: 'https://cdn.example.com/ads/video-720p.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                        bitrate: 1500000,
                        codec: 'h264',
                    },
                    // Mobile optimized version
                    {
                        url: 'https://cdn.example.com/ads/video-480p.mp4',
                        type: 'video/mp4',
                        width: 854,
                        height: 480,
                        delivery: 'progressive',
                        bitrate: 800000,
                        codec: 'h264',
                    },
                ],
            },
        },
    ],
});

// Multi-format Ad Pod (Sequential delivery with different formats)
const ad1 = buildInlineAd({
    title: 'Multi-Format Ad Pod - HLS',
    impressions: ['https://analytics.example.com/pod-impression-1'],
    creatives: [
        {
            linear: {
                duration: '00:00:15',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/pod/ad1.m3u8',
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

const ad2 = buildInlineAd({
    title: 'Multi-Format Ad Pod - DASH',
    impressions: ['https://analytics.example.com/pod-impression-2'],
    creatives: [
        {
            linear: {
                duration: '00:00:15',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/pod/ad2.mpd',
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

const ad3 = buildInlineAd({
    title: 'Multi-Format Ad Pod - Progressive',
    impressions: ['https://analytics.example.com/pod-impression-3'],
    creatives: [
        {
            linear: {
                duration: '00:00:15',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/pod/ad3.mp4',
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

// Generate VAST XML for each format
console.log('=== HLS STREAMING FORMAT ===');
const hlsVast = buildVast({ ads: [hlsAd] });
console.log(hlsVast);

console.log('\n=== DASH STREAMING FORMAT ===');
const dashVast = buildVast({ ads: [dashAd] });
console.log(dashVast);

console.log('\n=== PROGRESSIVE DOWNLOAD FORMAT ===');
const progressiveVast = buildVast({ ads: [progressiveAd] });
console.log(progressiveVast);

console.log('\n=== MULTI-FORMAT AD POD ===');
const podVast = buildVast({ ads: [ad1, ad2, ad3] });
console.log(podVast);

// Export for use in other modules
export { hlsAd, dashAd, progressiveAd, ad1, ad2, ad3 };
