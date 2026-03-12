"use strict";
/**
 * Wrapper Ad Builder for VAST 4.1
 * Builds Wrapper ads with tracking shells only (no media files)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWrapperAd = buildWrapperAd;
const utils_1 = require("../utils");
/**
 * Build a Wrapper ad following VAST 4.1 spec
 * Enforces wrapper-mode constraints: no media files, only tracking shells
 */
function buildWrapperAd(opts) {
    if (!opts.vastAdTagURI) {
        throw new Error('Wrapper ad requires vastAdTagURI');
    }
    if (!opts.impressions || opts.impressions.length === 0) {
        throw new Error('Wrapper ad requires at least one impression URL');
    }
    const wrapperAd = {
        '@id': opts.id || generateId(),
        AdSystem: opts.adSystem || 'VAST4Builder',
        VASTAdTagURI: (0, utils_1.cdata)(opts.vastAdTagURI),
        Impression: opts.impressions.map(url => (0, utils_1.cdata)(url))
    };
    // Add error URLs if provided
    if (opts.errorUrls && opts.errorUrls.length > 0) {
        wrapperAd.Error = opts.errorUrls.map(url => (0, utils_1.cdata)(url));
    }
    // Add tracking creative shells if provided
    if (opts.tracking || opts.clicks) {
        wrapperAd.Creatives = {
            Creative: [buildWrapperTrackingShell(opts.tracking, opts.clicks)]
        };
    }
    // Add custom telemetry as Extensions
    if (opts.customTelemetryJson) {
        wrapperAd.Extensions = {
            Extension: {
                '@type': 'telemetry',
                '#cdata': JSON.stringify(opts.customTelemetryJson, null, 2)
            }
        };
    }
    return {
        type: 'Wrapper',
        id: opts.id || generateId(),
        node: { Wrapper: wrapperAd }
    };
}
/**
 * Build a tracking shell creative for wrapper ads
 * VAST 4.1 constraint: Wrapper creatives contain only tracking, no media
 */
function buildWrapperTrackingShell(tracking, clicks) {
    const creative = {
        '@id': 'wrapper-tracking-shell'
    };
    // For wrapper ads, we create a Linear shell with only VideoClicks and TrackingEvents
    const linearShell = {};
    if (clicks) {
        linearShell.VideoClicks = buildVideoClicks(clicks);
    }
    if (tracking && tracking.length > 0) {
        linearShell.TrackingEvents = {
            Tracking: tracking.map(buildTrackingEvent)
        };
    }
    // Only add Linear if we have content
    if (Object.keys(linearShell).length > 0) {
        creative.Linear = linearShell;
    }
    return creative;
}
function buildVideoClicks(clicks) {
    const videoClicks = {};
    if (clicks.clickThrough) {
        videoClicks.ClickThrough = (0, utils_1.cdata)(clicks.clickThrough);
    }
    if (clicks.clickTracking && clicks.clickTracking.length > 0) {
        videoClicks.ClickTracking = clicks.clickTracking.map(url => (0, utils_1.cdata)(url));
    }
    if (clicks.customClicks && clicks.customClicks.length > 0) {
        videoClicks.CustomClick = clicks.customClicks.map(url => (0, utils_1.cdata)(url));
    }
    return videoClicks;
}
function buildTrackingEvent(event) {
    const tracking = {
        '@event': event.event,
        '#text': (0, utils_1.cdata)(event.url)
    };
    if (event.offset) {
        tracking['@offset'] = event.offset;
    }
    return tracking;
}
function generateId() {
    return `wrapper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
