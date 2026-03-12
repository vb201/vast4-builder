"use strict";
/**
 * Linear Creative Builder for VAST 4.1
 * Handles Linear ads with media files, tracking, and clicks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLinearCreative = buildLinearCreative;
const utils_1 = require("../utils");
/**
 * Build a Linear creative following VAST 4.1 spec
 */
function buildLinearCreative(opts) {
    if (!opts.duration) {
        throw new Error('Linear creative requires duration');
    }
    if (!opts.mediaFiles || opts.mediaFiles.length === 0) {
        throw new Error('Linear creative requires at least one media file');
    }
    const linear = {
        Duration: opts.duration,
        MediaFiles: {
            MediaFile: opts.mediaFiles.map(buildMediaFile)
        }
    };
    // Add skipoffset if provided (enables skippable)
    if (opts.skipoffset) {
        linear['@skipoffset'] = opts.skipoffset;
    }
    // Add VideoClicks if provided
    if (opts.clicks) {
        linear.VideoClicks = buildVideoClicks(opts.clicks);
    }
    // Add TrackingEvents if provided
    if (opts.tracking && opts.tracking.length > 0) {
        linear.TrackingEvents = {
            Tracking: opts.tracking.map(buildTrackingEvent)
        };
    }
    return { Linear: linear };
}
function buildMediaFile(media) {
    const mediaFile = {
        '@delivery': media.delivery || 'progressive',
        '@type': media.type,
        '@width': media.width,
        '@height': media.height,
        '#text': (0, utils_1.cdata)(media.url)
    };
    if (media.bitrate !== undefined) {
        mediaFile['@bitrate'] = media.bitrate;
    }
    if (media.minBitrate !== undefined) {
        mediaFile['@minBitrate'] = media.minBitrate;
    }
    if (media.maxBitrate !== undefined) {
        mediaFile['@maxBitrate'] = media.maxBitrate;
    }
    if (media.scalable !== undefined) {
        mediaFile['@scalable'] = media.scalable;
    }
    if (media.maintainAspectRatio !== undefined) {
        mediaFile['@maintainAspectRatio'] = media.maintainAspectRatio;
    }
    if (media.codec) {
        mediaFile['@codec'] = media.codec;
    }
    return mediaFile;
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
