"use strict";
/**
 * VAST 4.1 Streaming Formats Example
 * Demonstrates HLS, DASH, and Progressive video delivery support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ad3 = exports.ad2 = exports.ad1 = exports.progressiveAd = exports.dashAd = exports.hlsAd = void 0;
const index_1 = require("../src/index");
// HLS (HTTP Live Streaming) Example
const hlsAd = (0, index_1.buildInlineAd)({
    title: 'HLS Streaming Video Ad',
    impressions: ['https://analytics.example.com/hls-impression'],
    creatives: [{
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
                        maintainAspectRatio: true
                    },
                    // Mobile variant
                    {
                        url: 'https://cdn.example.com/ads/hls/mobile.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 720,
                        height: 480,
                        delivery: 'streaming',
                        maxBitrate: 1000000
                    }
                ],
                tracking: [
                    { event: 'start', url: 'https://analytics.example.com/hls-start' },
                    { event: 'firstQuartile', url: 'https://analytics.example.com/hls-q1' },
                    { event: 'midpoint', url: 'https://analytics.example.com/hls-mid' },
                    { event: 'thirdQuartile', url: 'https://analytics.example.com/hls-q3' },
                    { event: 'complete', url: 'https://analytics.example.com/hls-complete' }
                ]
            }
        }]
});
exports.hlsAd = hlsAd;
// DASH (Dynamic Adaptive Streaming over HTTP) Example
const dashAd = (0, index_1.buildInlineAd)({
    title: 'DASH Streaming Video Ad',
    impressions: ['https://analytics.example.com/dash-impression'],
    creatives: [{
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
                        maintainAspectRatio: true
                    }
                ],
                tracking: [
                    { event: 'start', url: 'https://analytics.example.com/dash-start' },
                    { event: 'complete', url: 'https://analytics.example.com/dash-complete' }
                ]
            }
        }]
});
exports.dashAd = dashAd;
// Progressive Download Example (Traditional MP4)
const progressiveAd = (0, index_1.buildInlineAd)({
    title: 'Progressive Download Video Ad',
    impressions: ['https://analytics.example.com/progressive-impression'],
    creatives: [{
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
                        codec: 'h264'
                    },
                    // Medium quality version
                    {
                        url: 'https://cdn.example.com/ads/video-720p.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                        bitrate: 1500000,
                        codec: 'h264'
                    },
                    // Mobile optimized version
                    {
                        url: 'https://cdn.example.com/ads/video-480p.mp4',
                        type: 'video/mp4',
                        width: 854,
                        height: 480,
                        delivery: 'progressive',
                        bitrate: 800000,
                        codec: 'h264'
                    }
                ]
            }
        }]
});
exports.progressiveAd = progressiveAd;
// Multi-format Ad Pod (Sequential delivery with different formats)
const ad1 = (0, index_1.buildInlineAd)({
    title: 'Multi-Format Ad Pod - HLS',
    impressions: ['https://analytics.example.com/pod-impression-1'],
    creatives: [{
            linear: {
                duration: '00:00:15',
                mediaFiles: [{
                        url: 'https://cdn.example.com/pod/ad1.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming'
                    }]
            }
        }]
});
exports.ad1 = ad1;
const ad2 = (0, index_1.buildInlineAd)({
    title: 'Multi-Format Ad Pod - DASH',
    impressions: ['https://analytics.example.com/pod-impression-2'],
    creatives: [{
            linear: {
                duration: '00:00:15',
                mediaFiles: [{
                        url: 'https://cdn.example.com/pod/ad2.mpd',
                        type: 'application/dash+xml',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming'
                    }]
            }
        }]
});
exports.ad2 = ad2;
const ad3 = (0, index_1.buildInlineAd)({
    title: 'Multi-Format Ad Pod - Progressive',
    impressions: ['https://analytics.example.com/pod-impression-3'],
    creatives: [{
            linear: {
                duration: '00:00:15',
                mediaFiles: [{
                        url: 'https://cdn.example.com/pod/ad3.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        delivery: 'progressive',
                        bitrate: 2000000
                    }]
            }
        }]
});
exports.ad3 = ad3;
// Generate VAST XML for each format
console.log('=== HLS STREAMING FORMAT ===');
const hlsVast = (0, index_1.buildVast)({ ads: [hlsAd] });
console.log(hlsVast);
console.log('\n=== DASH STREAMING FORMAT ===');
const dashVast = (0, index_1.buildVast)({ ads: [dashAd] });
console.log(dashVast);
console.log('\n=== PROGRESSIVE DOWNLOAD FORMAT ===');
const progressiveVast = (0, index_1.buildVast)({ ads: [progressiveAd] });
console.log(progressiveVast);
console.log('\n=== MULTI-FORMAT AD POD ===');
const podVast = (0, index_1.buildVast)({ ads: [ad1, ad2, ad3] });
console.log(podVast);
