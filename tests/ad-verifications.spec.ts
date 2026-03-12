import { describe, it, expect } from 'vitest';
import { buildInlineAd, buildVast, buildWrapperAd } from '../src';

describe('VAST 4.1 AdVerifications support', () => {
    it('should build a complete VAST document with version 4.1', () => {
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
        expect(xml).toContain('<VAST version="4.1"');
    });

    it('should include AdVerifications in InLine ad', () => {
        const ad = buildInlineAd({
            title: 'Test Ad',
            impressions: ['https://example.com/impression'],
            creatives: [
                {
                    linear: {
                        duration: '00:00:15',
                        mediaFiles: [
                            { url: 'https://example.com/video.mp4', type: 'video/mp4', width: 640, height: 360 },
                        ],
                    },
                },
            ],
            adVerifications: [
                {
                    vendor: 'company.com-omid',
                    javaScriptResource: {
                        url: 'https://verification.company.com/omid.js',
                        apiFramework: 'omid',
                        browserOptional: true,
                    },
                    verificationParameters: 'test-params=1',
                    trackingEvents: [
                        { event: 'verificationNotExecuted', url: 'https://example.com/not-executed' }
                    ]
                }
            ],
        });

        const xml = buildVast({ ads: [ad] });

        // Assert elements are present
        expect(xml).toContain('<AdVerifications>');
        expect(xml).toContain('<Verification vendor="company.com-omid">');
        expect(xml).toContain('<JavaScriptResource apiFramework="omid" browserOptional="true"><![CDATA[https://verification.company.com/omid.js]]></JavaScriptResource>');
        expect(xml).toContain('<VerificationParameters><![CDATA[test-params=1]]></VerificationParameters>');
        expect(xml).toContain('<Tracking event="verificationNotExecuted"><![CDATA[https://example.com/not-executed]]></Tracking>');
    });

    it('should include AdVerifications in Wrapper ad', () => {
        const wrapper = buildWrapperAd({
            vastAdTagURI: 'https://example.com/vast',
            impressions: ['https://example.com/wrapper-impression'],
            adVerifications: [
                {
                    vendor: 'company2.com-omid',
                    executableResource: {
                        url: 'https://verification.company2.com/omid.exe',
                        apiFramework: 'omid',
                        type: 'application/javascript'
                    }
                }
            ]
        });

        const xml = buildVast({ ads: [wrapper] });

        expect(xml).toContain('<AdVerifications>');
        expect(xml).toContain('<Verification vendor="company2.com-omid">');
        expect(xml).toContain('<ExecutableResource apiFramework="omid" type="application/javascript"><![CDATA[https://verification.company2.com/omid.exe]]></ExecutableResource>');
    });
});
