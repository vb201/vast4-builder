"use strict";
/**
 * Main VAST 4.1 XML Builder
 * Combines ads into a complete VAST document
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildVast = buildVast;
const xmlbuilder2_1 = require("xmlbuilder2");
const utils_1 = require("../utils");
/**
 * Build a complete VAST 4.1 XML document
 */
function buildVast(doc) {
    if (!doc.ads || doc.ads.length === 0) {
        // Return a VAST with no ads
        return buildEmptyVast(doc.errorUrl);
    }
    const xmlDoc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' });
    const vast = xmlDoc
        .ele('VAST')
        .att('version', '3.0')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:noNamespaceSchemaLocation', 'vast.xsd');
    // Add ads
    doc.ads.forEach(ad => {
        buildAdElement(vast, ad);
    });
    // Add root-level error URL if provided and no ads
    if (doc.errorUrl && doc.ads.length === 0) {
        (0, utils_1.safeContent)(vast.ele('Error'), doc.errorUrl);
    }
    return xmlDoc.end({
        prettyPrint: true,
        headless: false
    });
}
/**
 * Build an individual Ad element from a BuiltAd
 */
function buildAdElement(vast, ad) {
    const adElement = vast.ele('Ad').att('id', ad.id || generateId());
    // Add sequence if this is part of a pod
    if (ad.sequence !== undefined) {
        adElement.att('sequence', ad.sequence);
    }
    // Add the InLine or Wrapper content
    if (ad.type === 'InLine' && ad.node.InLine) {
        buildInLineElement(adElement, ad.node.InLine);
    }
    else if (ad.type === 'Wrapper' && ad.node.Wrapper) {
        buildWrapperElement(adElement, ad.node.Wrapper);
    }
    else {
        throw new Error(`Invalid ad type: ${ad.type}`);
    }
}
/**
 * Build InLine element structure
 */
function buildInLineElement(adElement, inlineData) {
    const inline = adElement.ele('InLine');
    if (inlineData['@id']) {
        inline.att('id', inlineData['@id']);
    }
    // Add required elements
    inline.ele('AdSystem').txt(inlineData.AdSystem || 'VAST4Builder');
    (0, utils_1.safeContent)(inline.ele('AdTitle'), inlineData.AdTitle || '');
    // Add impressions
    if (Array.isArray(inlineData.Impression)) {
        inlineData.Impression.forEach((imp) => {
            (0, utils_1.safeContent)(inline.ele('Impression'), imp);
        });
    }
    else if (inlineData.Impression) {
        (0, utils_1.safeContent)(inline.ele('Impression'), inlineData.Impression);
    }
    // Add error URLs
    if (inlineData.Error) {
        if (Array.isArray(inlineData.Error)) {
            inlineData.Error.forEach((err) => {
                (0, utils_1.safeContent)(inline.ele('Error'), err);
            });
        }
        else {
            (0, utils_1.safeContent)(inline.ele('Error'), inlineData.Error);
        }
    }
    // Add creatives
    if (inlineData.Creatives?.Creative) {
        const creativesElement = inline.ele('Creatives');
        const creatives = Array.isArray(inlineData.Creatives.Creative)
            ? inlineData.Creatives.Creative
            : [inlineData.Creatives.Creative];
        creatives.forEach((creative) => {
            buildCreativeElement(creativesElement, creative);
        });
    }
    // Add extensions
    if (inlineData.Extensions?.Extension) {
        const extensionsElement = inline.ele('Extensions');
        buildExtensionElement(extensionsElement, inlineData.Extensions.Extension);
    }
}
/**
 * Build Wrapper element structure
 */
function buildWrapperElement(adElement, wrapperData) {
    const wrapper = adElement.ele('Wrapper');
    if (wrapperData['@id']) {
        wrapper.att('id', wrapperData['@id']);
    }
    // Add required elements
    wrapper.ele('AdSystem').txt(wrapperData.AdSystem || 'VAST4Builder');
    (0, utils_1.safeContent)(wrapper.ele('VASTAdTagURI'), wrapperData.VASTAdTagURI);
    // Add impressions
    if (Array.isArray(wrapperData.Impression)) {
        wrapperData.Impression.forEach((imp) => {
            (0, utils_1.safeContent)(wrapper.ele('Impression'), imp);
        });
    }
    else if (wrapperData.Impression) {
        (0, utils_1.safeContent)(wrapper.ele('Impression'), wrapperData.Impression);
    }
    // Add error URLs
    if (wrapperData.Error) {
        if (Array.isArray(wrapperData.Error)) {
            wrapperData.Error.forEach((err) => {
                (0, utils_1.safeContent)(wrapper.ele('Error'), err);
            });
        }
        else {
            (0, utils_1.safeContent)(wrapper.ele('Error'), wrapperData.Error);
        }
    }
    // Add creatives (tracking shells only)
    if (wrapperData.Creatives?.Creative) {
        const creativesElement = wrapper.ele('Creatives');
        const creatives = Array.isArray(wrapperData.Creatives.Creative)
            ? wrapperData.Creatives.Creative
            : [wrapperData.Creatives.Creative];
        creatives.forEach((creative) => {
            buildCreativeElement(creativesElement, creative);
        });
    }
    // Add extensions
    if (wrapperData.Extensions?.Extension) {
        const extensionsElement = wrapper.ele('Extensions');
        buildExtensionElement(extensionsElement, wrapperData.Extensions.Extension);
    }
}
/**
 * Build Creative element
 */
function buildCreativeElement(creativesElement, creative) {
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
function buildLinearElement(creativeElement, linear) {
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
function buildVideoClicksElement(linearElement, videoClicks) {
    const videoClicksElement = linearElement.ele('VideoClicks');
    if (videoClicks.ClickThrough) {
        (0, utils_1.safeContent)(videoClicksElement.ele('ClickThrough'), videoClicks.ClickThrough);
    }
    if (videoClicks.ClickTracking) {
        const clickTracking = Array.isArray(videoClicks.ClickTracking)
            ? videoClicks.ClickTracking
            : [videoClicks.ClickTracking];
        clickTracking.forEach((url) => {
            videoClicksElement.ele('ClickTracking').dat(url);
        });
    }
    if (videoClicks.CustomClick) {
        const customClicks = Array.isArray(videoClicks.CustomClick)
            ? videoClicks.CustomClick
            : [videoClicks.CustomClick];
        customClicks.forEach((url) => {
            videoClicksElement.ele('CustomClick').dat(url);
        });
    }
}
/**
 * Build TrackingEvents element
 */
function buildTrackingEventsElement(linearElement, tracking) {
    const trackingEventsElement = linearElement.ele('TrackingEvents');
    tracking.forEach((track) => {
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
function buildMediaFilesElement(linearElement, mediaFiles) {
    const mediaFilesElement = linearElement.ele('MediaFiles');
    mediaFiles.forEach((media) => {
        const mediaFileElement = mediaFilesElement.ele('MediaFile')
            .att('delivery', media['@delivery'])
            .att('type', media['@type'])
            .att('width', media['@width'])
            .att('height', media['@height']);
        // Add optional attributes
        if (media['@bitrate'])
            mediaFileElement.att('bitrate', media['@bitrate']);
        if (media['@minBitrate'])
            mediaFileElement.att('minBitrate', media['@minBitrate']);
        if (media['@maxBitrate'])
            mediaFileElement.att('maxBitrate', media['@maxBitrate']);
        if (media['@scalable'])
            mediaFileElement.att('scalable', media['@scalable']);
        if (media['@maintainAspectRatio'])
            mediaFileElement.att('maintainAspectRatio', media['@maintainAspectRatio']);
        if (media['@codec'])
            mediaFileElement.att('codec', media['@codec']);
        (0, utils_1.safeContent)(mediaFileElement, media['#text']);
    });
}
/**
 * Build NonLinearAds element
 */
function buildNonLinearAdsElement(creativeElement, nonLinearAds) {
    const nonLinearAdsElement = creativeElement.ele('NonLinearAds');
    const nonLinears = Array.isArray(nonLinearAds.NonLinear)
        ? nonLinearAds.NonLinear
        : [nonLinearAds.NonLinear];
    nonLinears.forEach((nonLinear) => {
        const nonLinearElement = nonLinearAdsElement.ele('NonLinear')
            .att('width', nonLinear['@width'])
            .att('height', nonLinear['@height']);
        if (nonLinear['@minSuggestedDuration']) {
            nonLinearElement.att('minSuggestedDuration', nonLinear['@minSuggestedDuration']);
        }
        // Add resources
        if (nonLinear.StaticResource) {
            nonLinearElement.ele('StaticResource')
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
            clickTracking.forEach((url) => {
                nonLinearElement.ele('NonLinearClickTracking').dat(url);
            });
        }
    });
}
/**
 * Build Extension element
 */
function buildExtensionElement(extensionsElement, extension) {
    const extensionElement = extensionsElement.ele('Extension');
    if (extension['@type']) {
        extensionElement.att('type', extension['@type']);
    }
    if (extension['#cdata']) {
        extensionElement.dat(extension['#cdata']);
    }
}
/**
 * Build an empty VAST document for "No Ad" scenarios
 */
function buildEmptyVast(errorUrl) {
    const xmlDoc = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' });
    const vast = xmlDoc
        .ele('VAST')
        .att('version', '3.0')
        .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
        .att('xsi:noNamespaceSchemaLocation', 'vast.xsd');
    if (errorUrl) {
        vast.ele('Error').dat(errorUrl);
    }
    return xmlDoc.end({
        prettyPrint: true,
        headless: false
    });
}
function generateId() {
    return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
