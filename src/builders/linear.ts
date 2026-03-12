import { LinearCreativeOpts, TrackingEvent, Clicks, MediaFile, LinearCreativeNode } from '../types';
import { cdata } from '../utils';

/**
 * Build a Linear creative following VAST 4.1 spec
 */
export function buildLinearCreative(opts: LinearCreativeOpts): LinearCreativeNode {
    if (!opts.duration) {
        throw new Error('Linear creative requires duration');
    }

    if (!opts.mediaFiles || opts.mediaFiles.length === 0) {
        throw new Error('Linear creative requires at least one media file');
    }

    const linear: any = {
        Duration: opts.duration,
        MediaFiles: {
            MediaFile: opts.mediaFiles.map(buildMediaFile),
        },
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
            Tracking: opts.tracking.map(buildTrackingEvent),
        };
    }

    return { Linear: linear };
}

function buildMediaFile(media: MediaFile) {
    const mediaFile: any = {
        '@delivery': media.delivery || 'progressive',
        '@type': media.type,
        '@width': media.width,
        '@height': media.height,
        '#text': cdata(media.url),
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

function buildVideoClicks(clicks: Clicks) {
    const videoClicks: any = {};

    if (clicks.clickThrough) {
        videoClicks.ClickThrough = cdata(clicks.clickThrough);
    }

    if (clicks.clickTracking && clicks.clickTracking.length > 0) {
        videoClicks.ClickTracking = clicks.clickTracking.map((url) => cdata(url));
    }

    if (clicks.customClicks && clicks.customClicks.length > 0) {
        videoClicks.CustomClick = clicks.customClicks.map((url) => cdata(url));
    }

    return videoClicks;
}

function buildTrackingEvent(event: TrackingEvent) {
    const tracking: any = {
        '@event': event.event,
        '#text': cdata(event.url),
    };

    if (event.offset) {
        tracking['@offset'] = event.offset;
    }

    return tracking;
}
