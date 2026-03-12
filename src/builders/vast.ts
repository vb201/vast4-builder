import { create } from 'xmlbuilder2';
import { BuiltAd } from '../types';
import { safeContent } from '../utils';

export interface VastDocument {
    ads: BuiltAd[];
    errorUrl?: string;
}

/**
 * Build a complete VAST 4.1 XML document
 */
export function buildVast(doc: VastDocument): string {
    if (!doc.ads || doc.ads.length === 0) {
        // Return a VAST with no ads
        return buildEmptyVast(doc.errorUrl);
    }

    const xmlDoc = create({ version: '1.0', encoding: 'UTF-8' });
    const vast = xmlDoc
        .ele('VAST')
        .att('version', '4.1')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:noNamespaceSchemaLocation', 'vast.xsd');

    // Add ads
    doc.ads.forEach((ad) => {
        buildAdElement(vast, ad);
    });

    // Add root-level error URL if provided and no ads
    if (doc.errorUrl && doc.ads.length === 0) {
        safeContent(vast.ele('Error'), doc.errorUrl);
    }

    return xmlDoc.end({
        prettyPrint: true,
        headless: false,
    });
}

/**
 * Build an individual Ad element from a BuiltAd
 */
function buildAdElement(vast: any, ad: BuiltAd): void {
    const adElement = vast.ele('Ad').att('id', ad.id || generateId());

    // Add sequence if this is part of a pod
    if (ad.sequence !== undefined) {
        adElement.att('sequence', ad.sequence);
    }

    // Add the InLine or Wrapper content
    if (ad.type === 'InLine' && ad.node.InLine) {
        buildInLineElement(adElement, ad.node.InLine);
    } else if (ad.type === 'Wrapper' && ad.node.Wrapper) {
        buildWrapperElement(adElement, ad.node.Wrapper);
    } else {
        throw new Error(`Invalid ad type: ${ad.type}`);
    }
}

/**
 * Build InLine element structure
 */
function buildInLineElement(adElement: any, inlineData: any): void {
    const inline = adElement.ele('InLine');

    if (inlineData['@id']) {
        inline.att('id', inlineData['@id']);
    }

    // Add required elements
    inline.ele('AdSystem').txt(inlineData.AdSystem || 'VAST4Builder');
    safeContent(inline.ele('AdTitle'), inlineData.AdTitle || '');

    // Add impressions
    if (Array.isArray(inlineData.Impression)) {
        inlineData.Impression.forEach((imp: string) => {
            safeContent(inline.ele('Impression'), imp);
        });
    } else if (inlineData.Impression) {
        safeContent(inline.ele('Impression'), inlineData.Impression);
    }

    // Add error URLs
    if (inlineData.Error) {
        if (Array.isArray(inlineData.Error)) {
            inlineData.Error.forEach((err: string) => {
                safeContent(inline.ele('Error'), err);
            });
        } else {
            safeContent(inline.ele('Error'), inlineData.Error);
        }
    }

    // Add creatives
    if (inlineData.Creatives?.Creative) {
        const creativesElement = inline.ele('Creatives');
        const creatives = Array.isArray(inlineData.Creatives.Creative)
            ? inlineData.Creatives.Creative
            : [inlineData.Creatives.Creative];

        creatives.forEach((creative: any) => {
            buildCreativeElement(creativesElement, creative);
        });
    }

    // Add extensions
    if (inlineData.Extensions?.Extension) {
        const extensionsElement = inline.ele('Extensions');
        buildExtensionElement(extensionsElement, inlineData.Extensions.Extension);
    }

    // Add ad verifications
    if (inlineData.AdVerifications?.Verification) {
        const adVerificationsElement = inline.ele('AdVerifications');
        buildAdVerificationsElement(adVerificationsElement, inlineData.AdVerifications.Verification);
    }
}

/**
 * Build Wrapper element structure
 */
function buildWrapperElement(adElement: any, wrapperData: any): void {
    const wrapper = adElement.ele('Wrapper');

    if (wrapperData['@id']) {
        wrapper.att('id', wrapperData['@id']);
    }

    // Add required elements
    wrapper.ele('AdSystem').txt(wrapperData.AdSystem || 'VAST4Builder');
    safeContent(wrapper.ele('VASTAdTagURI'), wrapperData.VASTAdTagURI);

    // Add impressions
    if (Array.isArray(wrapperData.Impression)) {
        wrapperData.Impression.forEach((imp: string) => {
            safeContent(wrapper.ele('Impression'), imp);
        });
    } else if (wrapperData.Impression) {
        safeContent(wrapper.ele('Impression'), wrapperData.Impression);
    }

    // Add error URLs
    if (wrapperData.Error) {
        if (Array.isArray(wrapperData.Error)) {
            wrapperData.Error.forEach((err: string) => {
                safeContent(wrapper.ele('Error'), err);
            });
        } else {
            safeContent(wrapper.ele('Error'), wrapperData.Error);
        }
    }

    // Add creatives (tracking shells only)
    if (wrapperData.Creatives?.Creative) {
        const creativesElement = wrapper.ele('Creatives');
        const creatives = Array.isArray(wrapperData.Creatives.Creative)
            ? wrapperData.Creatives.Creative
            : [wrapperData.Creatives.Creative];

        creatives.forEach((creative: any) => {
            buildCreativeElement(creativesElement, creative);
        });
    }

    // Add extensions
    if (wrapperData.Extensions?.Extension) {
        const extensionsElement = wrapper.ele('Extensions');
        buildExtensionElement(extensionsElement, wrapperData.Extensions.Extension);
    }

    // Add ad verifications
    if (wrapperData.AdVerifications?.Verification) {
        const adVerificationsElement = wrapper.ele('AdVerifications');
        buildAdVerificationsElement(adVerificationsElement, wrapperData.AdVerifications.Verification);
    }
}

/**
 * Build Creative element
 */
function buildCreativeElement(creativesElement: any, creative: any): void {
    const creativeElement = creativesElement.ele('Creative');

    if (creative['@id']) {
        creativeElement.att('id', creative['@id']);
    }

    // Linear creative
    if (creative.Linear) {
        buildLinearElement(creativeElement, creative.Linear);
    }

    // NonLinear creative
    if (creative.NonLinearAds) {
        buildNonLinearAdsElement(creativeElement, creative.NonLinearAds);
    }
}

/**
 * Build Linear element
 */
function buildLinearElement(creativeElement: any, linear: any): void {
    const linearElement = creativeElement.ele('Linear');

    if (linear['@skipoffset']) {
        linearElement.att('skipoffset', linear['@skipoffset']);
    }

    // Duration (required for InLine)
    if (linear.Duration) {
        linearElement.ele('Duration').txt(linear.Duration);
    }

    // VideoClicks
    if (linear.VideoClicks) {
        buildVideoClicksElement(linearElement, linear.VideoClicks);
    }

    // TrackingEvents
    if (linear.TrackingEvents?.Tracking) {
        buildTrackingEventsElement(linearElement, linear.TrackingEvents.Tracking);
    }

    // MediaFiles (not for Wrapper)
    if (linear.MediaFiles?.MediaFile) {
        buildMediaFilesElement(linearElement, linear.MediaFiles.MediaFile);
    }
}

/**
 * Build VideoClicks element
 */
function buildVideoClicksElement(linearElement: any, videoClicks: any): void {
    const videoClicksElement = linearElement.ele('VideoClicks');

    if (videoClicks.ClickThrough) {
        safeContent(videoClicksElement.ele('ClickThrough'), videoClicks.ClickThrough);
    }

    if (videoClicks.ClickTracking) {
        const clickTracking = Array.isArray(videoClicks.ClickTracking)
            ? videoClicks.ClickTracking
            : [videoClicks.ClickTracking];

        clickTracking.forEach((url: string) => {
            videoClicksElement.ele('ClickTracking').dat(url);
        });
    }

    if (videoClicks.CustomClick) {
        const customClicks = Array.isArray(videoClicks.CustomClick)
            ? videoClicks.CustomClick
            : [videoClicks.CustomClick];

        customClicks.forEach((url: string) => {
            videoClicksElement.ele('CustomClick').dat(url);
        });
    }
}

/**
 * Build TrackingEvents element
 */
function buildTrackingEventsElement(linearElement: any, tracking: any[]): void {
    const trackingEventsElement = linearElement.ele('TrackingEvents');

    tracking.forEach((track: any) => {
        const trackingElement = trackingEventsElement.ele('Tracking').att('event', track['@event']);

        if (track['@offset']) {
            trackingElement.att('offset', track['@offset']);
        }

        trackingElement.dat(track['#text']);
    });
}

/**
 * Build MediaFiles element
 */
function buildMediaFilesElement(linearElement: any, mediaFiles: any[]): void {
    const mediaFilesElement = linearElement.ele('MediaFiles');

    mediaFiles.forEach((media: any) => {
        const mediaFileElement = mediaFilesElement
            .ele('MediaFile')
            .att('delivery', media['@delivery'])
            .att('type', media['@type'])
            .att('width', media['@width'])
            .att('height', media['@height']);

        // Add optional attributes
        if (media['@bitrate']) mediaFileElement.att('bitrate', media['@bitrate']);
        if (media['@minBitrate']) mediaFileElement.att('minBitrate', media['@minBitrate']);
        if (media['@maxBitrate']) mediaFileElement.att('maxBitrate', media['@maxBitrate']);
        if (media['@scalable']) mediaFileElement.att('scalable', media['@scalable']);
        if (media['@maintainAspectRatio'])
            mediaFileElement.att('maintainAspectRatio', media['@maintainAspectRatio']);
        if (media['@codec']) mediaFileElement.att('codec', media['@codec']);

        safeContent(mediaFileElement, media['#text']);
    });
}

/**
 * Build NonLinearAds element
 */
function buildNonLinearAdsElement(creativeElement: any, nonLinearAds: any): void {
    const nonLinearAdsElement = creativeElement.ele('NonLinearAds');

    const nonLinears = Array.isArray(nonLinearAds.NonLinear)
        ? nonLinearAds.NonLinear
        : [nonLinearAds.NonLinear];

    nonLinears.forEach((nonLinear: any) => {
        const nonLinearElement = nonLinearAdsElement
            .ele('NonLinear')
            .att('width', nonLinear['@width'])
            .att('height', nonLinear['@height']);

        if (nonLinear['@minSuggestedDuration']) {
            nonLinearElement.att('minSuggestedDuration', nonLinear['@minSuggestedDuration']);
        }

        // Add resources
        if (nonLinear.StaticResource) {
            nonLinearElement
                .ele('StaticResource')
                .att('creativeType', nonLinear.StaticResource['@creativeType'])
                .dat(nonLinear.StaticResource['#text']);
        }

        if (nonLinear.IFrameResource) {
            nonLinearElement.ele('IFrameResource').dat(nonLinear.IFrameResource);
        }

        if (nonLinear.HTMLResource) {
            nonLinearElement.ele('HTMLResource').dat(nonLinear.HTMLResource);
        }

        // Add click tracking
        if (nonLinear.NonLinearClickThrough) {
            nonLinearElement.ele('NonLinearClickThrough').dat(nonLinear.NonLinearClickThrough);
        }

        if (nonLinear.NonLinearClickTracking) {
            const clickTracking = Array.isArray(nonLinear.NonLinearClickTracking)
                ? nonLinear.NonLinearClickTracking
                : [nonLinear.NonLinearClickTracking];

            clickTracking.forEach((url: string) => {
                nonLinearElement.ele('NonLinearClickTracking').dat(url);
            });
        }
    });
}

/**
 * Build Extension element
 */
function buildExtensionElement(extensionsElement: any, extension: any): void {
    const extensionElement = extensionsElement.ele('Extension');

    if (extension['@type']) {
        extensionElement.att('type', extension['@type']);
    }

    if (extension['#cdata']) {
        extensionElement.dat(extension['#cdata']);
    }
}

/**
 * Build AdVerifications element
 */
function buildAdVerificationsElement(adVerificationsElement: any, verifications: any): void {
    const verifs = Array.isArray(verifications) ? verifications : [verifications];

    verifs.forEach((verification: any) => {
        const verificationElement = adVerificationsElement.ele('Verification');

        if (verification['@vendor']) {
            verificationElement.att('vendor', verification['@vendor']);
        }

        if (verification.JavaScriptResource) {
            const jsResources = Array.isArray(verification.JavaScriptResource)
                ? verification.JavaScriptResource
                : [verification.JavaScriptResource];

            jsResources.forEach((res: any) => {
                const jsElement = verificationElement.ele('JavaScriptResource')
                    .att('apiFramework', res['@apiFramework']);

                if (res['@browserOptional'] !== undefined) {
                    jsElement.att('browserOptional', res['@browserOptional'].toString());
                }

                safeContent(jsElement, res['#text']);
            });
        }

        if (verification.ExecutableResource) {
            const exeResources = Array.isArray(verification.ExecutableResource)
                ? verification.ExecutableResource
                : [verification.ExecutableResource];

            exeResources.forEach((res: any) => {
                const exeElement = verificationElement.ele('ExecutableResource')
                    .att('apiFramework', res['@apiFramework'])
                    .att('type', res['@type']);

                safeContent(exeElement, res['#text']);
            });
        }

        if (verification.TrackingEvents?.Tracking) {
            buildTrackingEventsElement(verificationElement, verification.TrackingEvents.Tracking);
        }

        if (verification.VerificationParameters) {
            safeContent(verificationElement.ele('VerificationParameters'), verification.VerificationParameters);
        }
    });
}

/**
 * Build an empty VAST document for "No Ad" scenarios
 */
function buildEmptyVast(errorUrl?: string): string {
    const xmlDoc = create({ version: '1.0', encoding: 'UTF-8' });
    const vast = xmlDoc
        .ele('VAST')
        .att('version', '4.1')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:noNamespaceSchemaLocation', 'vast.xsd');

    if (errorUrl) {
        vast.ele('Error').dat(errorUrl);
    }

    return xmlDoc.end({
        prettyPrint: true,
        headless: false,
    });
}

function generateId(): string {
    return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
