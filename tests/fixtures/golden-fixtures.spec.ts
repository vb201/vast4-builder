/**
 * Golden fixtures and edge case tests for VAST 4.1 Builder
 * These tests verify specific VAST 4.1 compliance requirements
 */

import { describe, it, expect } from 'vitest';
import {
    buildInlineAd,
    buildVast,
    buildAdPod,
    buildWrapperAd,
    buildNonLinearCreative,
    withIABQuartiles,
    isValidProgressOffset,
    cdata,
} from '../../src';

describe('VAST 4.1 Golden Fixtures', () => {
    it('Golden Fixture 1: Inline Linear (skippable, multi-bitrate + streaming manifests, full tracking & clicks)', () => {
        const ad = buildInlineAd({
            id: 'golden-linear-001',
            title: 'Premium Skippable Linear Ad',
            adSystem: 'TestAdServer 2.0',
            impressions: [
                'https://analytics.example.com/impression?campaign=golden',
                'https://backup-analytics.example.com/impression?campaign=golden',
            ],
            errorUrls: ['https://analytics.example.com/error?code=[ERRORCODE]'],
            customTelemetryJson: {
                test: 'golden-fixture-1',
                campaignId: 'CAMP-GOLDEN-001',
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
                            {
                                event: 'fullscreen',
                                url: 'https://analytics.example.com/fullscreen',
                            },
                            {
                                event: 'exitFullscreen',
                                url: 'https://analytics.example.com/exitFullscreen',
                            },
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
                            clickThrough: 'https://advertiser.example.com/landing',
                            clickTracking: [
                                'https://analytics.example.com/click',
                                'https://advertiser.example.com/click-tracking',
                            ],
                            customClicks: ['https://analytics.example.com/custom-action'],
                        },
                        mediaFiles: [
                            // Progressive ladder
                            {
                                url: 'https://cdn.example.com/golden/360p.mp4',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                                bitrate: 800,
                                delivery: 'progressive',
                            },
                            {
                                url: 'https://cdn.example.com/golden/720p.mp4',
                                type: 'video/mp4',
                                width: 1280,
                                height: 720,
                                bitrate: 1500,
                                delivery: 'progressive',
                            },
                            {
                                url: 'https://cdn.example.com/golden/1080p.mp4',
                                type: 'video/mp4',
                                width: 1920,
                                height: 1080,
                                bitrate: 3000,
                                delivery: 'progressive',
                            },
                            // Streaming manifests
                            {
                                url: 'https://stream.example.com/golden/playlist.m3u8',
                                type: 'application/vnd.apple.mpegurl',
                                width: 1920,
                                height: 1080,
                                delivery: 'streaming',
                            },
                            {
                                url: 'https://stream.example.com/golden/manifest.mpd',
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

        const xml = buildVast({ ads: [ad] });

        // Verify VAST structure
        expect(xml).toContain('<VAST version="4.1"');
        expect(xml).toContain('<Ad id="golden-linear-001"');
        expect(xml).toContain('<InLine id="');
        expect(xml).toContain('<AdSystem>TestAdServer 2.0</AdSystem>');
        expect(xml).toContain('<AdTitle><![CDATA[Premium Skippable Linear Ad]]></AdTitle>');

        // Verify multiple impressions
        expect(xml).toContain(
            '<Impression><![CDATA[https://analytics.example.com/impression?campaign=golden]]></Impression>'
        );
        expect(xml).toContain(
            '<Impression><![CDATA[https://backup-analytics.example.com/impression?campaign=golden]]></Impression>'
        );

        // Verify skippable
        expect(xml).toContain('<Linear skipoffset="00:00:05">');

        // Verify tracking events
        expect(xml).toContain('<Tracking event="start">');
        expect(xml).toContain('<Tracking event="skip">');
        expect(xml).toContain('<Tracking event="progress" offset="00:00:10">');
        expect(xml).toContain('<Tracking event="progress" offset="50%">');

        // Verify clicks
        expect(xml).toContain(
            '<ClickThrough><![CDATA[https://advertiser.example.com/landing]]></ClickThrough>'
        );
        expect(xml).toContain(
            '<ClickTracking><![CDATA[https://analytics.example.com/click]]></ClickTracking>'
        );

        // Verify multiple media files
        expect(xml).toContain(
            '<MediaFile delivery="progressive" type="video/mp4" width="640" height="360" bitrate="800">'
        );
        expect(xml).toContain(
            '<MediaFile delivery="streaming" type="application/vnd.apple.mpegurl"'
        );

        // Verify custom telemetry
        expect(xml).toContain('<Extension type="telemetry">');
        expect(xml).toContain('CAMP-GOLDEN-001');
    });

    it('Golden Fixture 2: NonLinear overlay with static/iframe/html resources + clickthrough/tracking', () => {
        const overlay = buildInlineAd({
            id: 'golden-nonlinear-001',
            title: 'Multi-Resource NonLinear Overlay',
            impressions: ['https://analytics.example.com/overlay/impression'],
            creatives: [
                {
                    nonLinear: {
                        units: [
                            {
                                width: 300,
                                height: 50,
                                minSuggestedDuration: '00:00:15',
                                staticResource:
                                    'https://cdn.example.com/banners/overlay-300x50.png',
                                nonLinearClickThrough:
                                    'https://advertiser.example.com/overlay-landing',
                                nonLinearClickTracking: [
                                    'https://analytics.example.com/overlay-click',
                                ],
                            },
                            {
                                width: 728,
                                height: 90,
                                minSuggestedDuration: '00:00:15',
                                iframeResource: 'https://widgets.example.com/banner-728x90.html',
                                nonLinearClickThrough:
                                    'https://advertiser.example.com/widget-landing',
                                nonLinearClickTracking: [
                                    'https://analytics.example.com/widget-click',
                                ],
                            },
                            {
                                width: 300,
                                height: 250,
                                htmlResource: '<div onclick="track()">HTML Banner</div>',
                                nonLinearClickTracking: [
                                    'https://analytics.example.com/html-click',
                                ],
                            },
                        ],
                    },
                },
            ],
        });

        const xml = buildVast({ ads: [overlay] });

        // Verify NonLinear structure
        expect(xml).toContain('<NonLinearAds>');
        expect(xml).toContain(
            '<NonLinear width="300" height="50" minSuggestedDuration="00:00:15">'
        );
        expect(xml).toContain('<StaticResource creativeType="image/png">');
        expect(xml).toContain(
            '<IFrameResource><![CDATA[https://widgets.example.com/banner-728x90.html]]></IFrameResource>'
        );
        expect(xml).toContain(
            '<HTMLResource><![CDATA[<div onclick="track()">HTML Banner</div>]]></HTMLResource>'
        );
        expect(xml).toContain('<NonLinearClickThrough>');
        expect(xml).toContain('<NonLinearClickTracking>');
    });

    it('Golden Fixture 3: Ad Pod with sequence=1..n; last linear optionally plus NonLinear', () => {
        const ad1 = buildInlineAd({
            title: 'Pod Ad 1 - Linear Only',
            impressions: ['https://analytics.example.com/pod/ad1/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
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
            title: 'Pod Ad 2 - Linear Only',
            impressions: ['https://analytics.example.com/pod/ad2/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:20',
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

        const ad3 = buildInlineAd({
            title: 'Pod Ad 3 - Linear + NonLinear (Last in Pod)',
            impressions: ['https://analytics.example.com/pod/ad3/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        tracking: withIABQuartiles('https://analytics.example.com/pod/ad3'),
                        mediaFiles: [
                            {
                                url: 'https://cdn.example.com/pod/ad3.mp4',
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
                                staticResource: 'https://cdn.example.com/pod/companion.jpg',
                                nonLinearClickThrough:
                                    'https://advertiser.example.com/pod-companion',
                            },
                        ],
                    },
                },
            ],
        });

        const pod = buildAdPod([ad1, ad2, ad3]);
        const xml = buildVast({ ads: pod });

        // Verify pod sequencing
        expect(xml).toContain('<Ad id="');
        expect(xml).toContain('sequence="1"');
        expect(xml).toContain('sequence="2"');
        expect(xml).toContain('sequence="3"');

        // Verify last ad has both Linear and NonLinear
        const ad3Match = xml.match(/<Ad[^>]*sequence="3"[^>]*>.*?<\/Ad>/s);
        expect(ad3Match).toBeTruthy();
        expect(ad3Match![0]).toContain('<Linear>');
        expect(ad3Match![0]).toContain('<NonLinearAds>');
    });

    it('Golden Fixture 4: Wrapper → Inline chain with tracking shells only', () => {
        const wrapper = buildWrapperAd({
            id: 'golden-wrapper-001',
            adSystem: 'NetworkA SSP',
            impressions: ['https://networkA.example.com/impression'],
            errorUrls: ['https://networkA.example.com/error?code=[ERRORCODE]'],
            vastAdTagURI: 'https://networkB.example.com/vast?placement=12345',
            tracking: [
                { event: 'start', url: 'https://networkA.example.com/start' },
                { event: 'firstQuartile', url: 'https://networkA.example.com/q1' },
                { event: 'midpoint', url: 'https://networkA.example.com/q2' },
                { event: 'thirdQuartile', url: 'https://networkA.example.com/q3' },
                { event: 'complete', url: 'https://networkA.example.com/complete' },
            ],
            clicks: {
                clickTracking: ['https://networkA.example.com/click'],
            },
            customTelemetryJson: {
                networkChain: ['NetworkA', 'NetworkB'],
                auctionId: 'auction-12345',
            },
        });

        const xml = buildVast({ ads: [wrapper] });

        // Verify Wrapper structure
        expect(xml).toContain('<Wrapper id="golden-wrapper-001">');
        expect(xml).toContain('<AdSystem>NetworkA SSP</AdSystem>');
        expect(xml).toContain(
            '<VASTAdTagURI><![CDATA[https://networkB.example.com/vast?placement=12345]]></VASTAdTagURI>'
        );

        // Verify wrapper has tracking shell only
        expect(xml).toContain('<Creatives>');
        expect(xml).toContain('<Linear>');
        expect(xml).toContain('<TrackingEvents>');
        expect(xml).toContain('<VideoClicks>');

        // Verify NO media files in wrapper
        expect(xml).not.toContain('<MediaFiles>');
        expect(xml).not.toContain('<MediaFile');

        // Verify telemetry
        expect(xml).toContain('<Extension type="telemetry">');
        expect(xml).toContain('NetworkA');
    });
});

describe('VAST 4.1 Edge Cases & Pitfalls', () => {
    it('should handle progress with time and percentage; multiple progress markers', () => {
        const ad = buildInlineAd({
            title: 'Progress Tracking Test',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:01:00',
                        tracking: [
                            {
                                event: 'progress',
                                offset: '00:00:10',
                                url: 'https://example.com/10s',
                            },
                            {
                                event: 'progress',
                                offset: '00:00:30',
                                url: 'https://example.com/30s',
                            },
                            { event: 'progress', offset: '25%', url: 'https://example.com/25pct' },
                            { event: 'progress', offset: '50%', url: 'https://example.com/50pct' },
                            { event: 'progress', offset: '75%', url: 'https://example.com/75pct' },
                        ],
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

        const xml = buildVast({ ads: [ad] });

        // Verify multiple progress events
        expect(xml).toContain('<Tracking event="progress" offset="00:00:10">');
        expect(xml).toContain('<Tracking event="progress" offset="00:00:30">');
        expect(xml).toContain('<Tracking event="progress" offset="25%">');
        expect(xml).toContain('<Tracking event="progress" offset="50%">');
        expect(xml).toContain('<Tracking event="progress" offset="75%">');
    });

    it('should validate progress offset formats', () => {
        // Valid time formats
        expect(isValidProgressOffset('00:00:10')).toBe(true);
        expect(isValidProgressOffset('01:23:45')).toBe(true);
        expect(isValidProgressOffset('00:00:05.500')).toBe(true);

        // Valid percentage formats
        expect(isValidProgressOffset('25%')).toBe(true);
        expect(isValidProgressOffset('0%')).toBe(true);
        expect(isValidProgressOffset('100%')).toBe(true);
        expect(isValidProgressOffset('50.5%')).toBe(true);

        // Invalid formats
        expect(isValidProgressOffset('invalid')).toBe(false);
        expect(isValidProgressOffset('25')).toBe(false);
        expect(isValidProgressOffset('25%%')).toBe(false);
        expect(isValidProgressOffset('1:23:45')).toBe(false); // Missing leading zero
    });

    it('should handle skipoffset formatting and trigger skip tracking', () => {
        const ad = buildInlineAd({
            title: 'Skippable Ad Test',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        skipoffset: '00:00:05',
                        tracking: [{ event: 'skip', url: 'https://example.com/skip' }],
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

        const xml = buildVast({ ads: [ad] });

        // Verify skipoffset attribute
        expect(xml).toContain('<Linear skipoffset="00:00:05">');

        // Verify skip tracking event
        expect(xml).toContain('<Tracking event="skip">');
    });

    it('should handle MediaFile with bitrate vs minBitrate/maxBitrate', () => {
        const ad = buildInlineAd({
            title: 'Bitrate Test',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        mediaFiles: [
                            {
                                url: 'https://example.com/fixed-bitrate.mp4',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                                bitrate: 1500,
                            },
                            {
                                url: 'https://example.com/adaptive-bitrate.mp4',
                                type: 'video/mp4',
                                width: 1280,
                                height: 720,
                                minBitrate: 800,
                                maxBitrate: 3000,
                            },
                        ],
                    },
                },
            ],
        });

        const xml = buildVast({ ads: [ad] });

        // Verify fixed bitrate
        expect(xml).toContain('bitrate="1500"');

        // Verify adaptive bitrate range
        expect(xml).toContain('minBitrate="800"');
        expect(xml).toContain('maxBitrate="3000"');
    });

    it('should handle CDATA wrapping with inner ]]> sequences', () => {
        const testUrl = 'https://example.com/track?data=<![CDATA[inner]]>test';
        const result = cdata(testUrl);

        // CDATA function should just return the string for xmlbuilder2 to handle
        expect(result).toBe(testUrl);

        // Test in actual XML generation
        const ad = buildInlineAd({
            title: 'CDATA Test with ]]>',
            impressions: [testUrl],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
                        mediaFiles: [
                            {
                                url: 'https://example.com/video.mp4?param=]]>test',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                            },
                        ],
                    },
                },
            ],
        });

        const xml = buildVast({ ads: [ad] });

        // Verify content with ]]> sequences is escaped properly (not wrapped in CDATA)
        expect(xml).toContain(']]&gt;');

        // Test with safe content that CAN use CDATA
        const safeAd = buildInlineAd({
            title: 'Safe CDATA Test',
            impressions: ['https://example.com/track?data=safe'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
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

        const safeXml = buildVast({ ads: [safeAd] });

        // Verify CDATA is used for safe content
        expect(safeXml).toContain('<![CDATA[');
    });

    it('should verify multiple same-type tracking URLs are included', () => {
        const ad = buildInlineAd({
            title: 'Multiple Tracking Test',
            impressions: [
                'https://primary.example.com/impression',
                'https://backup.example.com/impression',
            ],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        tracking: [
                            { event: 'start', url: 'https://analytics1.example.com/start' },
                            { event: 'start', url: 'https://analytics2.example.com/start' },
                            { event: 'complete', url: 'https://analytics1.example.com/complete' },
                            { event: 'complete', url: 'https://analytics2.example.com/complete' },
                        ],
                        clicks: {
                            clickTracking: [
                                'https://analytics1.example.com/click',
                                'https://analytics2.example.com/click',
                            ],
                        },
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

        const xml = buildVast({ ads: [ad] });

        // Verify multiple impressions
        expect(xml).toContain(
            '<Impression><![CDATA[https://primary.example.com/impression]]></Impression>'
        );
        expect(xml).toContain(
            '<Impression><![CDATA[https://backup.example.com/impression]]></Impression>'
        );

        // Verify multiple tracking URLs of same type
        const startMatches = xml.match(/<Tracking event="start">/g);
        expect(startMatches).toHaveLength(2);

        const completeMatches = xml.match(/<Tracking event="complete">/g);
        expect(completeMatches).toHaveLength(2);

        // Verify multiple click tracking
        const clickTrackingMatches = xml.match(/<ClickTracking>/g);
        expect(clickTrackingMatches).toHaveLength(2);
    });
});
