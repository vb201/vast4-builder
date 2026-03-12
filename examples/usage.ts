/**
 * Example usage of the VAST 4.1 Builder
 * Run this with: node -r esbuild-register examples/usage.ts
 */

import {
    buildInlineAd,
    buildWrapperAd,
    buildAdPod,
    buildVast,
    withIABQuartiles,
    toClockTime,
} from '../src';

// Example 1: Complete Linear Ad with all features
console.log('=== Example 1: Complete Linear Ad ===');

const complexLinearAd = buildInlineAd({
    id: 'pre-roll-001',
    title: 'Premium Pre-roll Campaign',
    adSystem: 'MyAdServer 1.0',
    impressions: [
        'https://analytics.example.com/impression?campaign=001',
        'https://backup-analytics.example.com/impression?campaign=001',
    ],
    errorUrls: ['https://analytics.example.com/error?code=[ERRORCODE]'],
    customTelemetryJson: {
        campaignId: 'CAMP-001',
        experiment: 'A/B-Test-1',
        targeting: { age: '25-34', interests: ['tech', 'gaming'] },
    },
    creatives: [
        {
            linear: {
                duration: '00:00:30',
                skipoffset: '00:00:05',
                tracking: [
                    ...withIABQuartiles('https://analytics.example.com/tracking'),
                    { event: 'mute', url: 'https://analytics.example.com/mute' },
                    { event: 'pause', url: 'https://analytics.example.com/pause' },
                    { event: 'resume', url: 'https://analytics.example.com/resume' },
                    { event: 'fullscreen', url: 'https://analytics.example.com/fullscreen' },
                    { event: 'skip', url: 'https://analytics.example.com/skip' },
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
                ],
                clicks: {
                    clickThrough: 'https://advertiser.example.com/landing?utm_source=vast',
                    clickTracking: [
                        'https://analytics.example.com/click',
                        'https://advertiser.example.com/click-tracking',
                    ],
                    customClicks: ['https://analytics.example.com/custom-action'],
                },
                mediaFiles: [
                    // Progressive ladder
                    {
                        url: 'https://cdn.example.com/ads/pre-roll-001/360p.mp4',
                        type: 'video/mp4',
                        width: 640,
                        height: 360,
                        bitrate: 800,
                        delivery: 'progressive',
                    },
                    {
                        url: 'https://cdn.example.com/ads/pre-roll-001/720p.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        bitrate: 1500,
                        delivery: 'progressive',
                    },
                    {
                        url: 'https://cdn.example.com/ads/pre-roll-001/1080p.mp4',
                        type: 'video/mp4',
                        width: 1920,
                        height: 1080,
                        bitrate: 3000,
                        delivery: 'progressive',
                    },
                    // Streaming manifests
                    {
                        url: 'https://stream.example.com/ads/pre-roll-001/playlist.m3u8',
                        type: 'application/vnd.apple.mpegurl',
                        width: 1920,
                        height: 1080,
                        delivery: 'streaming',
                    },
                    {
                        url: 'https://stream.example.com/ads/pre-roll-001/manifest.mpd',
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

const xml1 = buildVast({ ads: [complexLinearAd] });
console.log(xml1);
console.log('\n');

// Example 2: Ad Pod (Sequential Ads)
console.log('=== Example 2: Ad Pod ===');

const ad1 = buildInlineAd({
    title: 'Pod Ad 1',
    impressions: ['https://analytics.example.com/pod/ad1/impression'],
    creatives: [
        {
            linear: {
                duration: toClockTime(15), // 15 seconds
                tracking: withIABQuartiles('https://analytics.example.com/pod/ad1'),
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/pod/ad1.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                    },
                ],
            },
        },
    ],
});

const ad2 = buildInlineAd({
    title: 'Pod Ad 2',
    impressions: ['https://analytics.example.com/pod/ad2/impression'],
    creatives: [
        {
            linear: {
                duration: toClockTime(30), // 30 seconds
                tracking: withIABQuartiles('https://analytics.example.com/pod/ad2'),
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/pod/ad2.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                    },
                ],
            },
        },
    ],
});

const pod = buildAdPod([ad1, ad2]);
const xml2 = buildVast({ ads: pod });
console.log(xml2);
console.log('\n');

// Example 3: Wrapper Ad (Ad Network Chain)
console.log('=== Example 3: Wrapper Ad ===');

const wrapperAd = buildWrapperAd({
    id: 'wrapper-001',
    adSystem: 'NetworkA SSP',
    impressions: ['https://network-a.example.com/impression?id=wrapper-001'],
    errorUrls: ['https://network-a.example.com/error?code=[ERRORCODE]'],
    vastAdTagURI: 'https://network-b.example.com/vast?placement=12345',
    tracking: [
        { event: 'start', url: 'https://network-a.example.com/start' },
        { event: 'complete', url: 'https://network-a.example.com/complete' },
    ],
    clicks: {
        clickTracking: ['https://network-a.example.com/click'],
    },
    customTelemetryJson: {
        networkChain: ['NetworkA', 'NetworkB'],
        auctionId: 'auction-789',
    },
});

const xml3 = buildVast({ ads: [wrapperAd] });
console.log(xml3);
console.log('\n');

// Example 4: Non-Linear Overlay
console.log('=== Example 4: Non-Linear Overlay ===');

const overlayAd = buildInlineAd({
    title: 'Banner Overlay Campaign',
    impressions: ['https://analytics.example.com/overlay/impression'],
    creatives: [
        {
            nonLinear: {
                units: [
                    {
                        width: 300,
                        height: 50,
                        minSuggestedDuration: '00:00:15',
                        staticResource: 'https://cdn.example.com/banners/overlay-300x50.png',
                        nonLinearClickThrough: 'https://advertiser.example.com/landing',
                        nonLinearClickTracking: ['https://analytics.example.com/overlay/click'],
                    },
                    {
                        width: 728,
                        height: 90,
                        minSuggestedDuration: '00:00:15',
                        staticResource: 'https://cdn.example.com/banners/overlay-728x90.png',
                        nonLinearClickThrough: 'https://advertiser.example.com/landing',
                        nonLinearClickTracking: ['https://analytics.example.com/overlay/click'],
                    },
                ],
            },
        },
    ],
});

const xml4 = buildVast({ ads: [overlayAd] });
console.log(xml4);
console.log('\n');

// Example 5: Mixed Creative (Linear + NonLinear)
console.log('=== Example 5: Mixed Creative (Last in Pod) ===');

const mixedAd = buildInlineAd({
    title: 'Mixed Creative Ad',
    impressions: ['https://analytics.example.com/mixed/impression'],
    creatives: [
        {
            linear: {
                duration: '00:00:15',
                mediaFiles: [
                    {
                        url: 'https://cdn.example.com/mixed/video.mp4',
                        type: 'video/mp4',
                        width: 1280,
                        height: 720,
                        delivery: 'progressive',
                    },
                ],
            },
        },
        {
            nonLinear: {
                units: [
                    {
                        width: 300,
                        height: 250,
                        staticResource: 'https://cdn.example.com/mixed/banner.jpg',
                        nonLinearClickThrough: 'https://advertiser.example.com/mixed-landing',
                    },
                ],
            },
        },
    ],
});

const xml5 = buildVast({ ads: [mixedAd] });
console.log(xml5);
console.log('\n');

console.log('=== All Examples Complete ===');
