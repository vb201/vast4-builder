import { describe, it, expect } from 'vitest';
import {
    buildInlineAd,
    buildVast,
    buildAdPod,
    buildWrapperAd,
    withIABQuartiles,
    toClockTime,
    cdata,
} from '../src';

describe('VAST 4.1 Builder', () => {
    it('should build a simple linear ad', () => {
        const ad = buildInlineAd({
            title: 'Test Linear Ad',
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

        expect(ad.type).toBe('InLine');
        expect(ad.node.InLine).toBeDefined();
        expect(ad.node.InLine.AdTitle).toContain('Test Linear Ad');
    });

    it('should build a skippable ad with tracking', () => {
        const ad = buildInlineAd({
            title: 'Skippable Pre-roll',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:30',
                        skipoffset: '00:00:05',
                        tracking: [
                            ...withIABQuartiles('https://example.com'),
                            { event: 'skip', url: 'https://example.com/skip' },
                        ],
                        clicks: {
                            clickThrough: 'https://example.com/landing',
                            clickTracking: ['https://example.com/click'],
                        },
                        mediaFiles: [
                            {
                                url: 'https://example.com/video.mp4',
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

        expect(ad.node.InLine.Creatives.Creative[0].Linear['@skipoffset']).toBe('00:00:05');
        expect(ad.node.InLine.Creatives.Creative[0].Linear.TrackingEvents).toBeDefined();
        expect(ad.node.InLine.Creatives.Creative[0].Linear.VideoClicks).toBeDefined();
    });

    it('should build a complete VAST document', () => {
        const ad = buildInlineAd({
            title: 'Test Ad',
            impressions: ['https://example.com/impression'],
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

        const xml = buildVast({ ads: [ad] });

        expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(xml).toContain('<VAST version="4.1"');
        expect(xml).toContain('<InLine id="');
        expect(xml).toContain('<AdTitle><![CDATA[Test Ad]]></AdTitle>');
        expect(xml).toContain('<Duration>00:00:15</Duration>');
    });

    it('should build an ad pod with sequence numbers', () => {
        const ad1 = buildInlineAd({
            title: 'First Ad',
            impressions: ['https://example.com/imp1'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
                        mediaFiles: [
                            {
                                url: 'https://example.com/video1.mp4',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                            },
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
                            {
                                url: 'https://example.com/video2.mp4',
                                type: 'video/mp4',
                                width: 640,
                                height: 360,
                            },
                        ],
                    },
                },
            ],
        });

        const pod = buildAdPod([ad1, ad2]);

        expect(pod).toHaveLength(2);
        expect(pod[0].sequence).toBe(1);
        expect(pod[1].sequence).toBe(2);

        const xml = buildVast({ ads: pod });
        expect(xml).toContain('sequence="1"');
        expect(xml).toContain('sequence="2"');
    });

    it('should build a wrapper ad with tracking shells', () => {
        const wrapper = buildWrapperAd({
            impressions: ['https://netA.com/impression'],
            vastAdTagURI: 'https://netB.com/vast',
            tracking: [{ event: 'start', url: 'https://netA.com/start' }],
            clicks: {
                clickTracking: ['https://netA.com/click'],
            },
        });

        expect(wrapper.type).toBe('Wrapper');
        expect(wrapper.node.Wrapper.VASTAdTagURI).toBeDefined();
        expect(wrapper.node.Wrapper.Creatives.Creative[0].Linear.TrackingEvents).toBeDefined();
        expect(wrapper.node.Wrapper.Creatives.Creative[0].Linear.VideoClicks).toBeDefined();
    });

    it('should handle CDATA properly', () => {
        const result = cdata('https://example.com/track?param=value&other=123');
        expect(result).toBe('https://example.com/track?param=value&other=123');
    });

    it('should convert seconds to clock time', () => {
        expect(toClockTime(90)).toBe('00:01:30');
        expect(toClockTime(3661)).toBe('01:01:01');
    });

    it('should generate IAB quartiles', () => {
        const quartiles = withIABQuartiles('https://example.com');
        expect(quartiles).toHaveLength(5);
        expect(quartiles.map((q) => q.event)).toEqual([
            'start',
            'firstQuartile',
            'midpoint',
            'thirdQuartile',
            'complete',
        ]);
    });
});
