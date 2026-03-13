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

    // VAST 4.1: conditional ad
    if (ad.conditionalAd !== undefined) {
        adElement.att('conditionalAd', ad.conditionalAd.toString());
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

    // AdServingId (VAST 4.1)
    if (inlineData.AdServingId) {
        inline.ele('AdServingId').txt(inlineData.AdServingId);
    }

    // Description
    if (inlineData.Description) {
        safeContent(inline.ele('Description'), inlineData.Description);
    }

    // Advertiser
    if (inlineData.Advertiser) {
        safeContent(inline.ele('Advertiser'), inlineData.Advertiser);
    }

    // Category (VAST 4.1)
    if (inlineData.Category) {
        const categories = Array.isArray(inlineData.Category)
            ? inlineData.Category
            : [inlineData.Category];
        categories.forEach((cat: any) => {
            const catElement = inline.ele('Category');
            if (cat['@authority']) catElement.att('authority', cat['@authority']);
            catElement.txt(cat['#text'] || cat);
        });
    }

    // Add impressions
    if (Array.isArray(inlineData.Impression)) {
        inlineData.Impression.forEach((imp: string) => {
            safeContent(inline.ele('Impression'), imp);
        });
    } else if (inlineData.Impression) {
        safeContent(inline.ele('Impression'), inlineData.Impression);
    }

    // Pricing
    if (inlineData.Pricing) {
        const pricingEl = inline.ele('Pricing');
        if (inlineData.Pricing['@model']) pricingEl.att('model', inlineData.Pricing['@model']);
        if (inlineData.Pricing['@currency'])
            pricingEl.att('currency', inlineData.Pricing['@currency']);
        pricingEl.txt(inlineData.Pricing['#text'] || '');
    }

    // Survey
    if (inlineData.Survey) {
        const surveys = Array.isArray(inlineData.Survey) ? inlineData.Survey : [inlineData.Survey];
        surveys.forEach((s: any) => {
            const surveyEl = inline.ele('Survey');
            if (s['@type']) surveyEl.att('type', s['@type']);
            safeContent(surveyEl, s['#text'] || s);
        });
    }

    // Expires (VAST 4.1)
    if (inlineData.Expires !== undefined) {
        inline.ele('Expires').txt(String(inlineData.Expires));
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

    // ViewableImpression (VAST 4.1)
    if (inlineData.ViewableImpression) {
        buildViewableImpressionElement(inline, inlineData.ViewableImpression);
    }

    // Add extensions
    if (inlineData.Extensions?.Extension) {
        const extensionsElement = inline.ele('Extensions');
        buildExtensionElement(extensionsElement, inlineData.Extensions.Extension);
    }

    // Add ad verifications
    if (inlineData.AdVerifications?.Verification) {
        const adVerificationsElement = inline.ele('AdVerifications');
        buildAdVerificationsElement(
            adVerificationsElement,
            inlineData.AdVerifications.Verification,
        );
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

    // VAST 4.1 wrapper attributes
    if (wrapperData['@followAdditionalWrappers'] !== undefined) {
        wrapper.att(
            'followAdditionalWrappers',
            wrapperData['@followAdditionalWrappers'].toString(),
        );
    }
    if (wrapperData['@allowMultipleAds'] !== undefined) {
        wrapper.att('allowMultipleAds', wrapperData['@allowMultipleAds'].toString());
    }
    if (wrapperData['@fallbackOnNoAd'] !== undefined) {
        wrapper.att('fallbackOnNoAd', wrapperData['@fallbackOnNoAd'].toString());
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

    // BlockedAdCategories (VAST 4.1)
    if (wrapperData.BlockedAdCategories) {
        const blocked = Array.isArray(wrapperData.BlockedAdCategories)
            ? wrapperData.BlockedAdCategories
            : [wrapperData.BlockedAdCategories];
        blocked.forEach((cat: any) => {
            const catEl = wrapper.ele('BlockedAdCategories');
            if (cat['@authority']) catEl.att('authority', cat['@authority']);
            catEl.txt(cat['#text'] || cat);
        });
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

    // ViewableImpression (VAST 4.1)
    if (wrapperData.ViewableImpression) {
        buildViewableImpressionElement(wrapper, wrapperData.ViewableImpression);
    }

    // Add extensions
    if (wrapperData.Extensions?.Extension) {
        const extensionsElement = wrapper.ele('Extensions');
        buildExtensionElement(extensionsElement, wrapperData.Extensions.Extension);
    }

    // Add ad verifications
    if (wrapperData.AdVerifications?.Verification) {
        const adVerificationsElement = wrapper.ele('AdVerifications');
        buildAdVerificationsElement(
            adVerificationsElement,
            wrapperData.AdVerifications.Verification,
        );
    }
}

/**
 * Build Creative element
 */
function buildCreativeElement(creativesElement: any, creative: any): void {
    const creativeElement = creativesElement.ele('Creative');

    if (creative['@id']) creativeElement.att('id', creative['@id']);
    if (creative['@adId']) creativeElement.att('adId', creative['@adId']);
    if (creative['@sequence'] !== undefined) creativeElement.att('sequence', creative['@sequence']);
    if (creative['@apiFramework']) creativeElement.att('apiFramework', creative['@apiFramework']);

    // UniversalAdId (VAST 4.1)
    if (creative.UniversalAdId) {
        const uaid = creativeElement.ele('UniversalAdId');
        if (creative.UniversalAdId['@idRegistry']) {
            uaid.att('idRegistry', creative.UniversalAdId['@idRegistry']);
        }
        uaid.txt(creative.UniversalAdId['#text'] || '');
    }

    // Linear creative
    if (creative.Linear) {
        buildLinearElement(creativeElement, creative.Linear);
    }

    // NonLinear creative
    if (creative.NonLinearAds) {
        buildNonLinearAdsElement(creativeElement, creative.NonLinearAds);
    }

    // CompanionAds (VAST 4.1)
    if (creative.CompanionAds) {
        buildCompanionAdsElement(creativeElement, creative.CompanionAds);
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

    // MediaFiles (not for Wrapper) — includes Mezzanine, InteractiveCreativeFile, ClosedCaptionFiles
    if (linear.MediaFiles) {
        buildMediaFilesContainer(linearElement, linear.MediaFiles);
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
 * Build MediaFiles container element (VAST 4.1)
 * Contains MediaFile[], Mezzanine?, InteractiveCreativeFile[], ClosedCaptionFiles?
 */
function buildMediaFilesContainer(linearElement: any, mediaFilesData: any): void {
    const mediaFilesElement = linearElement.ele('MediaFiles');

    // Standard MediaFile entries
    if (mediaFilesData.MediaFile) {
        const files = Array.isArray(mediaFilesData.MediaFile)
            ? mediaFilesData.MediaFile
            : [mediaFilesData.MediaFile];
        files.forEach((media: any) => {
            const mediaFileElement = mediaFilesElement
                .ele('MediaFile')
                .att('delivery', media['@delivery'])
                .att('type', media['@type'])
                .att('width', media['@width'])
                .att('height', media['@height']);

            if (media['@id']) mediaFileElement.att('id', media['@id']);
            if (media['@bitrate']) mediaFileElement.att('bitrate', media['@bitrate']);
            if (media['@minBitrate']) mediaFileElement.att('minBitrate', media['@minBitrate']);
            if (media['@maxBitrate']) mediaFileElement.att('maxBitrate', media['@maxBitrate']);
            if (media['@scalable']) mediaFileElement.att('scalable', media['@scalable']);
            if (media['@maintainAspectRatio'])
                mediaFileElement.att('maintainAspectRatio', media['@maintainAspectRatio']);
            if (media['@codec']) mediaFileElement.att('codec', media['@codec']);
            if (media['@mediaType']) mediaFileElement.att('mediaType', media['@mediaType']);

            safeContent(mediaFileElement, media['#text']);
        });
    }

    // Mezzanine (VAST 4.1 — source-quality file for ad stitching)
    if (mediaFilesData.Mezzanine) {
        const mez = mediaFilesData.Mezzanine;
        const mezEl = mediaFilesElement
            .ele('Mezzanine')
            .att('delivery', mez['@delivery'] || 'progressive')
            .att('type', mez['@type'])
            .att('width', mez['@width'])
            .att('height', mez['@height']);
        if (mez['@codec']) mezEl.att('codec', mez['@codec']);
        if (mez['@fileSize'] !== undefined) mezEl.att('fileSize', mez['@fileSize']);
        safeContent(mezEl, mez['#text']);
    }

    // InteractiveCreativeFile (VAST 4.1 — SIMID/VPAID)
    if (mediaFilesData.InteractiveCreativeFile) {
        const icfs = Array.isArray(mediaFilesData.InteractiveCreativeFile)
            ? mediaFilesData.InteractiveCreativeFile
            : [mediaFilesData.InteractiveCreativeFile];
        icfs.forEach((icf: any) => {
            const icfEl = mediaFilesElement.ele('InteractiveCreativeFile');
            if (icf['@type']) icfEl.att('type', icf['@type']);
            if (icf['@apiFramework']) icfEl.att('apiFramework', icf['@apiFramework']);
            if (icf['@variableDuration'] !== undefined)
                icfEl.att('variableDuration', icf['@variableDuration'].toString());
            safeContent(icfEl, icf['#text']);
        });
    }

    // ClosedCaptionFiles (VAST 4.1)
    if (mediaFilesData.ClosedCaptionFiles?.ClosedCaptionFile) {
        const ccfContainer = mediaFilesElement.ele('ClosedCaptionFiles');
        const ccfs = Array.isArray(mediaFilesData.ClosedCaptionFiles.ClosedCaptionFile)
            ? mediaFilesData.ClosedCaptionFiles.ClosedCaptionFile
            : [mediaFilesData.ClosedCaptionFiles.ClosedCaptionFile];
        ccfs.forEach((ccf: any) => {
            const ccfEl = ccfContainer.ele('ClosedCaptionFile');
            if (ccf['@type']) ccfEl.att('type', ccf['@type']);
            if (ccf['@language']) ccfEl.att('language', ccf['@language']);
            safeContent(ccfEl, ccf['#text']);
        });
    }
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
                const jsElement = verificationElement
                    .ele('JavaScriptResource')
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
                const exeElement = verificationElement
                    .ele('ExecutableResource')
                    .att('apiFramework', res['@apiFramework'])
                    .att('type', res['@type']);

                safeContent(exeElement, res['#text']);
            });
        }

        if (verification.TrackingEvents?.Tracking) {
            buildTrackingEventsElement(verificationElement, verification.TrackingEvents.Tracking);
        }

        if (verification.VerificationParameters) {
            safeContent(
                verificationElement.ele('VerificationParameters'),
                verification.VerificationParameters,
            );
        }
    });
}

/**
 * Build ViewableImpression element (VAST 4.1)
 */
function buildViewableImpressionElement(parent: any, vi: any): void {
    const viElement = parent.ele('ViewableImpression');
    if (vi['@id']) viElement.att('id', vi['@id']);

    if (vi.Viewable) {
        const viewables = Array.isArray(vi.Viewable) ? vi.Viewable : [vi.Viewable];
        viewables.forEach((url: string) => {
            safeContent(viElement.ele('Viewable'), url);
        });
    }

    if (vi.NotViewable) {
        const notViewables = Array.isArray(vi.NotViewable) ? vi.NotViewable : [vi.NotViewable];
        notViewables.forEach((url: string) => {
            safeContent(viElement.ele('NotViewable'), url);
        });
    }

    if (vi.ViewUndetermined) {
        const undetermined = Array.isArray(vi.ViewUndetermined)
            ? vi.ViewUndetermined
            : [vi.ViewUndetermined];
        undetermined.forEach((url: string) => {
            safeContent(viElement.ele('ViewUndetermined'), url);
        });
    }
}

/**
 * Build CompanionAds element (VAST 4.1)
 */
function buildCompanionAdsElement(creativeElement: any, companionAdsData: any): void {
    const companionAdsElement = creativeElement.ele('CompanionAds');
    if (companionAdsData['@required']) {
        companionAdsElement.att('required', companionAdsData['@required']);
    }

    const companions = Array.isArray(companionAdsData.Companion)
        ? companionAdsData.Companion
        : [companionAdsData.Companion];

    companions.forEach((comp: any) => {
        const compElement = companionAdsElement
            .ele('Companion')
            .att('width', comp['@width'])
            .att('height', comp['@height']);

        if (comp['@id']) compElement.att('id', comp['@id']);
        if (comp['@assetWidth']) compElement.att('assetWidth', comp['@assetWidth']);
        if (comp['@assetHeight']) compElement.att('assetHeight', comp['@assetHeight']);
        if (comp['@expandedWidth']) compElement.att('expandedWidth', comp['@expandedWidth']);
        if (comp['@expandedHeight']) compElement.att('expandedHeight', comp['@expandedHeight']);
        if (comp['@apiFramework']) compElement.att('apiFramework', comp['@apiFramework']);
        if (comp['@adSlotId']) compElement.att('adSlotId', comp['@adSlotId']);
        if (comp['@renderingMode']) compElement.att('renderingMode', comp['@renderingMode']);

        // Resource
        if (comp.StaticResource) {
            const sr = compElement.ele('StaticResource');
            if (comp.StaticResource['@creativeType'])
                sr.att('creativeType', comp.StaticResource['@creativeType']);
            safeContent(sr, comp.StaticResource['#text']);
        }
        if (comp.IFrameResource) {
            safeContent(compElement.ele('IFrameResource'), comp.IFrameResource);
        }
        if (comp.HTMLResource) {
            safeContent(compElement.ele('HTMLResource'), comp.HTMLResource);
        }

        // Tracking events
        if (comp.TrackingEvents?.Tracking) {
            buildTrackingEventsElement(compElement, comp.TrackingEvents.Tracking);
        }

        // Clicks
        if (comp.CompanionClickThrough) {
            safeContent(compElement.ele('CompanionClickThrough'), comp.CompanionClickThrough);
        }
        if (comp.CompanionClickTracking) {
            const ccts = Array.isArray(comp.CompanionClickTracking)
                ? comp.CompanionClickTracking
                : [comp.CompanionClickTracking];
            ccts.forEach((url: string) => {
                safeContent(compElement.ele('CompanionClickTracking'), url);
            });
        }

        if (comp.AltText) {
            compElement.ele('AltText').txt(comp.AltText);
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
