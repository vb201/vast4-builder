import { describe, it, expect } from 'vitest';
import {
    buildInlineAd,
    buildVast,
    buildWrapperAd,
    buildCompanionAds,
    validateInlineAd,
    validateWrapperAd,
    validateAdVerification,
    validateViewableImpression,
    validateCompanionAds,
} from '../src';

describe('VAST 4.1/4.2 Full Spec Features', () => {
    // ─── Metadata: Category, Description, Advertiser, Pricing, Survey ───

    describe('InLine Metadata', () => {
        it('should build ad with description and advertiser', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                description: 'A test video advertisement',
                advertiser: 'Acme Corp',
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

            expect(ad.node.InLine.Description).toContain('A test video advertisement');
            expect(ad.node.InLine.Advertiser).toContain('Acme Corp');

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<Description>');
            expect(xml).toContain('<Advertiser>');
        });

        it('should build ad with category taxonomy', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                category: [
                    {
                        value: 'IAB3-1',
                        authority: 'https://iabtechlab.com/standards/content-taxonomy/',
                    },
                    { value: 'IAB7-2' },
                ],
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

            expect(ad.node.InLine.Category).toHaveLength(2);
            expect(ad.node.InLine.Category[0]['#text']).toBe('IAB3-1');
            expect(ad.node.InLine.Category[0]['@authority']).toContain('iabtechlab');

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<Category');
            expect(xml).toContain('authority=');
            expect(xml).toContain('IAB3-1');
        });

        it('should build ad with pricing', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                pricing: { value: '25.00', model: 'CPM', currency: 'USD' },
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

            expect(ad.node.InLine.Pricing['@model']).toBe('CPM');
            expect(ad.node.InLine.Pricing['@currency']).toBe('USD');

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<Pricing');
            expect(xml).toContain('model="CPM"');
            expect(xml).toContain('currency="USD"');
        });

        it('should build ad with survey', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                survey: [{ url: 'https://survey.example.com/track', type: 'text/javascript' }],
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

            expect(ad.node.InLine.Survey).toHaveLength(1);
            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<Survey');
        });

        it('should build ad with adServingId and expires', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                adServingId: 'a532d16d-4d7f-4440-bd29-2ec05553fc80',
                expires: 600,
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

            expect(ad.node.InLine.AdServingId).toBe('a532d16d-4d7f-4440-bd29-2ec05553fc80');
            expect(ad.node.InLine.Expires).toBe(600);

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<AdServingId>');
            expect(xml).toContain('<Expires>600</Expires>');
        });
    });

    // ─── Creative-level attributes ────────────────────────────────────────

    describe('Creative attributes', () => {
        it('should add adId, sequence, apiFramework to Creative', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                impressions: ['https://example.com/impression'],
                creatives: [
                    {
                        adId: 'ADID-12345',
                        sequence: 1,
                        apiFramework: 'SIMID',
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

            const creative = ad.node.InLine.Creatives.Creative[0];
            expect(creative['@adId']).toBe('ADID-12345');
            expect(creative['@sequence']).toBe(1);
            expect(creative['@apiFramework']).toBe('SIMID');

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('adId="ADID-12345"');
            expect(xml).toContain('apiFramework="SIMID"');
        });

        it('should add UniversalAdId to Creative', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                impressions: ['https://example.com/impression'],
                creatives: [
                    {
                        universalAdId: { idValue: 'AD-ID-1234567890', idRegistry: 'Ad-ID' },
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

            const creative = ad.node.InLine.Creatives.Creative[0];
            expect(creative.UniversalAdId['@idRegistry']).toBe('Ad-ID');
            expect(creative.UniversalAdId['#text']).toBe('AD-ID-1234567890');

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<UniversalAdId');
            expect(xml).toContain('idRegistry="Ad-ID"');
            expect(xml).toContain('AD-ID-1234567890');
        });
    });

    // ─── ViewableImpression ──────────────────────────────────────────────

    describe('ViewableImpression', () => {
        it('should build ViewableImpression in InLine ad', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                impressions: ['https://example.com/impression'],
                viewableImpression: {
                    id: 'vi-1',
                    viewable: ['https://example.com/viewable'],
                    notViewable: ['https://example.com/not-viewable'],
                    viewUndetermined: ['https://example.com/undetermined'],
                },
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
            expect(xml).toContain('<ViewableImpression');
            expect(xml).toContain('<Viewable>');
            expect(xml).toContain('<NotViewable>');
            expect(xml).toContain('<ViewUndetermined>');
        });

        it('should build ViewableImpression in Wrapper ad', () => {
            const wrapper = buildWrapperAd({
                vastAdTagURI: 'https://example.com/vast',
                impressions: ['https://example.com/impression'],
                viewableImpression: {
                    viewable: ['https://example.com/viewable'],
                },
            });

            const xml = buildVast({ ads: [wrapper] });
            expect(xml).toContain('<ViewableImpression>');
            expect(xml).toContain('<Viewable>');
        });
    });

    // ─── Companion Ads ───────────────────────────────────────────────────

    describe('CompanionAds', () => {
        it('should build companion ads standalone with buildCompanionAds', () => {
            const result = buildCompanionAds({
                required: 'all',
                companions: [
                    {
                        width: 300,
                        height: 250,
                        id: 'comp-1',
                        staticResource: {
                            url: 'https://example.com/banner.jpg',
                            creativeType: 'image/jpeg',
                        },
                        companionClickThrough: 'https://example.com/landing',
                        altText: 'Test banner',
                    },
                ],
            });

            expect(result['@required']).toBe('all');
            expect(result.Companion).toHaveLength(1);
            expect(result.Companion[0]['@width']).toBe(300);
            expect(result.Companion[0]['@height']).toBe(250);
            expect(result.Companion[0]['@id']).toBe('comp-1');
            expect(result.Companion[0].CompanionClickThrough).toContain(
                'https://example.com/landing',
            );
            expect(result.Companion[0].AltText).toBe('Test banner');
        });

        it('should build companion ads with static resource', () => {
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
                        companionAds: {
                            required: 'any',
                            companions: [
                                {
                                    width: 300,
                                    height: 250,
                                    id: 'companion-1',
                                    staticResource: {
                                        url: 'https://example.com/banner.jpg',
                                        creativeType: 'image/jpeg',
                                    },
                                    companionClickThrough: 'https://example.com/landing',
                                    companionClickTracking: ['https://example.com/click-track'],
                                    altText: 'Banner ad',
                                },
                            ],
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<CompanionAds');
            expect(xml).toContain('required="any"');
            expect(xml).toContain('<Companion');
            expect(xml).toContain('width="300"');
            expect(xml).toContain('height="250"');
            expect(xml).toContain('<StaticResource');
            expect(xml).toContain('<CompanionClickThrough>');
            expect(xml).toContain('<AltText>');
        });

        it('should build companion with iframe resource', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                impressions: ['https://example.com/impression'],
                creatives: [
                    {
                        companionAds: {
                            companions: [
                                {
                                    width: 728,
                                    height: 90,
                                    iframeResource: 'https://example.com/companion.html',
                                },
                            ],
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<IFrameResource>');
        });
    });

    // ─── InteractiveCreativeFile ─────────────────────────────────────────

    describe('InteractiveCreativeFile', () => {
        it('should build linear with SIMID interactive creative', () => {
            const ad = buildInlineAd({
                title: 'Interactive Ad',
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
                            interactiveCreativeFiles: [
                                {
                                    url: 'https://example.com/interactive.html',
                                    type: 'text/html',
                                    apiFramework: 'SIMID',
                                    variableDuration: true,
                                },
                            ],
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<InteractiveCreativeFile');
            expect(xml).toContain('apiFramework="SIMID"');
            expect(xml).toContain('variableDuration="true"');
        });
    });

    // ─── ClosedCaptionFiles ─────────────────────────────────────────────

    describe('ClosedCaptionFiles', () => {
        it('should build linear with closed caption files', () => {
            const ad = buildInlineAd({
                title: 'Captioned Ad',
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
                            closedCaptionFiles: [
                                {
                                    url: 'https://example.com/captions-en.vtt',
                                    type: 'text/vtt',
                                    language: 'en',
                                },
                                {
                                    url: 'https://example.com/captions-es.vtt',
                                    type: 'text/vtt',
                                    language: 'es',
                                },
                            ],
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<ClosedCaptionFiles>');
            expect(xml).toContain('<ClosedCaptionFile');
            expect(xml).toContain('language="en"');
            expect(xml).toContain('language="es"');
            expect(xml).toContain('type="text/vtt"');
        });
    });

    // ─── Mezzanine ──────────────────────────────────────────────────────

    describe('Mezzanine', () => {
        it('should build linear with mezzanine source file', () => {
            const ad = buildInlineAd({
                title: 'Ad Stitching',
                impressions: ['https://example.com/impression'],
                creatives: [
                    {
                        linear: {
                            duration: '00:00:15',
                            mediaFiles: [
                                {
                                    url: 'https://cdn.example.com/video_720.mp4',
                                    type: 'video/mp4',
                                    width: 1280,
                                    height: 720,
                                },
                            ],
                            mezzanine: {
                                url: 'https://cdn.example.com/video_source.mp4',
                                type: 'video/mp4',
                                width: 3840,
                                height: 2160,
                                codec: 'H.265',
                                fileSize: 524288000,
                            },
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('<Mezzanine');
            expect(xml).toContain('fileSize="524288000"');
            expect(xml).toContain('codec="H.265"');
        });
    });

    // ─── Wrapper attributes ─────────────────────────────────────────────

    describe('Wrapper attributes', () => {
        it('should support BlockedAdCategories', () => {
            const wrapper = buildWrapperAd({
                vastAdTagURI: 'https://example.com/vast',
                impressions: ['https://example.com/impression'],
                blockedAdCategories: [
                    {
                        value: 'IAB25',
                        authority: 'https://iabtechlab.com/standards/content-taxonomy/',
                    },
                ],
            });

            const xml = buildVast({ ads: [wrapper] });
            expect(xml).toContain('<BlockedAdCategories');
            expect(xml).toContain('IAB25');
        });

        it('should support followAdditionalWrappers and allowMultipleAds', () => {
            const wrapper = buildWrapperAd({
                vastAdTagURI: 'https://example.com/vast',
                impressions: ['https://example.com/impression'],
                followAdditionalWrappers: false,
                allowMultipleAds: true,
                fallbackOnNoAd: true,
            });

            const xml = buildVast({ ads: [wrapper] });
            expect(xml).toContain('followAdditionalWrappers="false"');
            expect(xml).toContain('allowMultipleAds="true"');
            expect(xml).toContain('fallbackOnNoAd="true"');
        });
    });

    // ─── conditionalAd ──────────────────────────────────────────────────

    describe('conditionalAd', () => {
        it('should add conditionalAd attribute to Ad element', () => {
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

            ad.conditionalAd = true;
            const xml = buildVast({ ads: [ad] });
            expect(xml).toContain('conditionalAd="true"');
        });
    });

    // ─── VAST 4.x tracking events ──────────────────────────────────────

    describe('VAST 4.x tracking events', () => {
        it('should support loaded, playerExpand, playerCollapse events', () => {
            const ad = buildInlineAd({
                title: 'Test Ad',
                impressions: ['https://example.com/impression'],
                creatives: [
                    {
                        linear: {
                            duration: '00:00:15',
                            tracking: [
                                { event: 'loaded', url: 'https://example.com/loaded' },
                                { event: 'playerExpand', url: 'https://example.com/expand' },
                                { event: 'playerCollapse', url: 'https://example.com/collapse' },
                                { event: 'otherAdInteraction', url: 'https://example.com/other' },
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
            expect(xml).toContain('event="loaded"');
            expect(xml).toContain('event="playerExpand"');
            expect(xml).toContain('event="playerCollapse"');
            expect(xml).toContain('event="otherAdInteraction"');
        });
    });

    // ─── Validation ─────────────────────────────────────────────────────

    describe('Validation', () => {
        it('should validate ad verification options', () => {
            const noResource = validateAdVerification({ vendor: 'test' });
            expect(noResource.valid).toBe(false);
            expect(noResource.errors).toContain(
                'at least one JavaScriptResource or ExecutableResource is required',
            );

            const valid = validateAdVerification({
                vendor: 'test',
                javaScriptResource: { url: 'https://example.com/omid.js', apiFramework: 'omid' },
            });
            expect(valid.valid).toBe(true);
        });

        it('should validate viewable impression options', () => {
            const empty = validateViewableImpression({});
            expect(empty.valid).toBe(false);

            const valid = validateViewableImpression({
                viewable: ['https://example.com/viewable'],
            });
            expect(valid.valid).toBe(true);
        });

        it('should validate companion ads options', () => {
            const noCompanions = validateCompanionAds({ companions: [] });
            expect(noCompanions.valid).toBe(false);

            const valid = validateCompanionAds({
                companions: [
                    {
                        width: 300,
                        height: 250,
                        staticResource: {
                            url: 'https://example.com/banner.jpg',
                            creativeType: 'image/jpeg',
                        },
                    },
                ],
            });
            expect(valid.valid).toBe(true);
        });

        it('should validate inline ad with VAST 4.x features', () => {
            const result = validateInlineAd({
                title: 'Test',
                impressions: ['https://example.com/imp'],
                pricing: { value: '', model: 'CPM', currency: 'USD' },
                creatives: [
                    {
                        universalAdId: { idValue: '', idRegistry: '' },
                        linear: {
                            duration: '00:00:15',
                            mediaFiles: [
                                {
                                    url: 'https://example.com/v.mp4',
                                    type: 'video/mp4',
                                    width: 640,
                                    height: 360,
                                },
                            ],
                        },
                    },
                ],
            });

            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.includes('pricing.value'))).toBe(true);
            expect(result.errors.some((e) => e.includes('universalAdId.idValue'))).toBe(true);
        });

        it('should validate wrapper ad with adVerifications', () => {
            const result = validateWrapperAd({
                vastAdTagURI: 'https://example.com/vast',
                impressions: ['https://example.com/imp'],
                adVerifications: [{ vendor: 'test' }], // missing resource
            });

            expect(result.valid).toBe(false);
            expect(
                result.errors.some((e) => e.includes('JavaScriptResource or ExecutableResource')),
            ).toBe(true);
        });
    });

    // ─── Full integration: all features in one VAST document ────────────

    describe('Full VAST 4.1 document', () => {
        it('should build a complete VAST 4.1 document with all features', () => {
            const ad = buildInlineAd({
                title: 'Full-Featured VAST 4.1 Ad',
                adSystem: 'TimePay',
                adServingId: 'a532d16d-4d7f-4440-bd29-2ec05553fc80',
                description: 'Complete ad with all VAST 4.1 features',
                advertiser: 'Acme Corp',
                category: [{ value: 'IAB3-1', authority: 'https://iabtechlab.com' }],
                pricing: { value: '25.00', model: 'CPM', currency: 'USD' },
                survey: [{ url: 'https://survey.example.com/track' }],
                expires: 600,
                impressions: ['https://example.com/impression'],
                errorUrls: ['https://example.com/error'],
                viewableImpression: {
                    id: 'vi-1',
                    viewable: ['https://example.com/viewable'],
                    notViewable: ['https://example.com/not-viewable'],
                    viewUndetermined: ['https://example.com/undetermined'],
                },
                adVerifications: [
                    {
                        vendor: 'company.com-omid',
                        javaScriptResource: {
                            url: 'https://verification.company.com/omid.js',
                            apiFramework: 'omid',
                            browserOptional: true,
                        },
                        verificationParameters: 'param=1',
                        trackingEvents: [
                            {
                                event: 'verificationNotExecuted',
                                url: 'https://example.com/not-executed',
                            },
                        ],
                    },
                ],
                creatives: [
                    {
                        adId: 'ADID-12345',
                        universalAdId: { idValue: 'AD-ID-1234567890', idRegistry: 'Ad-ID' },
                        linear: {
                            duration: '00:00:30',
                            skipoffset: '00:00:05',
                            tracking: [
                                { event: 'start', url: 'https://example.com/start' },
                                { event: 'loaded', url: 'https://example.com/loaded' },
                                { event: 'complete', url: 'https://example.com/complete' },
                            ],
                            clicks: {
                                clickThrough: 'https://example.com/landing',
                                clickTracking: ['https://example.com/click'],
                            },
                            mediaFiles: [
                                {
                                    url: 'https://cdn.example.com/video.mp4',
                                    type: 'video/mp4',
                                    width: 1920,
                                    height: 1080,
                                    delivery: 'progressive',
                                    bitrate: 5000,
                                    id: 'mf-1',
                                },
                            ],
                            mezzanine: {
                                url: 'https://cdn.example.com/source.mp4',
                                type: 'video/mp4',
                                width: 3840,
                                height: 2160,
                            },
                            interactiveCreativeFiles: [
                                {
                                    url: 'https://example.com/interactive.html',
                                    type: 'text/html',
                                    apiFramework: 'SIMID',
                                },
                            ],
                            closedCaptionFiles: [
                                {
                                    url: 'https://example.com/captions.vtt',
                                    type: 'text/vtt',
                                    language: 'en',
                                },
                            ],
                        },
                        companionAds: {
                            required: 'any',
                            companions: [
                                {
                                    width: 300,
                                    height: 250,
                                    staticResource: {
                                        url: 'https://example.com/banner.jpg',
                                        creativeType: 'image/jpeg',
                                    },
                                    companionClickThrough: 'https://example.com/companion-landing',
                                },
                            ],
                        },
                    },
                ],
            });

            const xml = buildVast({ ads: [ad] });

            // Version
            expect(xml).toContain('<VAST version="4.1"');

            // Metadata
            expect(xml).toContain('<AdServingId>');
            expect(xml).toContain('<Description>');
            expect(xml).toContain('<Advertiser>');
            expect(xml).toContain('<Category');
            expect(xml).toContain('<Pricing');
            expect(xml).toContain('<Survey');
            expect(xml).toContain('<Expires>600</Expires>');

            // Creative attributes
            expect(xml).toContain('adId="ADID-12345"');
            expect(xml).toContain('<UniversalAdId');

            // ViewableImpression
            expect(xml).toContain('<ViewableImpression');
            expect(xml).toContain('<Viewable>');

            // AdVerifications
            expect(xml).toContain('<AdVerifications>');
            expect(xml).toContain('<Verification');

            // MediaFiles sub-elements
            expect(xml).toContain('<Mezzanine');
            expect(xml).toContain('<InteractiveCreativeFile');
            expect(xml).toContain('<ClosedCaptionFiles>');

            // CompanionAds
            expect(xml).toContain('<CompanionAds');
            expect(xml).toContain('<Companion');
        });
    });
});
