import {
    LinearCreativeOpts,
    TrackingEvent,
    Clicks,
    MediaFile,
    MezzanineFile,
    LinearCreativeNode,
} from '../types';
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

    const mediaFilesNode: any = {
        MediaFile: opts.mediaFiles.map(buildMediaFile),
    };

    // Mezzanine file (VAST 4.1 — source quality for ad stitching)
    if (opts.mezzanine) {
        mediaFilesNode.Mezzanine = buildMezzanineFile(opts.mezzanine);
    }

    // InteractiveCreativeFile (VAST 4.1 — SIMID/VPAID)
    if (opts.interactiveCreativeFiles && opts.interactiveCreativeFiles.length > 0) {
        mediaFilesNode.InteractiveCreativeFile = opts.interactiveCreativeFiles.map((icf) => {
            const node: any = { '#text': cdata(icf.url) };
            if (icf.type) node['@type'] = icf.type;
            if (icf.apiFramework) node['@apiFramework'] = icf.apiFramework;
            if (icf.variableDuration !== undefined)
                node['@variableDuration'] = icf.variableDuration;
            return node;
        });
    }

    // ClosedCaptionFiles (VAST 4.1)
    if (opts.closedCaptionFiles && opts.closedCaptionFiles.length > 0) {
        mediaFilesNode.ClosedCaptionFiles = {
            ClosedCaptionFile: opts.closedCaptionFiles.map((ccf) => {
                const node: any = { '#text': cdata(ccf.url) };
                if (ccf.type) node['@type'] = ccf.type;
                if (ccf.language) node['@language'] = ccf.language;
                return node;
            }),
        };
    }

    const linear: any = {
        Duration: opts.duration,
        MediaFiles: mediaFilesNode,
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

    if (media.id) mediaFile['@id'] = media.id;
    if (media.bitrate !== undefined) mediaFile['@bitrate'] = media.bitrate;
    if (media.minBitrate !== undefined) mediaFile['@minBitrate'] = media.minBitrate;
    if (media.maxBitrate !== undefined) mediaFile['@maxBitrate'] = media.maxBitrate;
    if (media.scalable !== undefined) mediaFile['@scalable'] = media.scalable;
    if (media.maintainAspectRatio !== undefined)
        mediaFile['@maintainAspectRatio'] = media.maintainAspectRatio;
    if (media.codec) mediaFile['@codec'] = media.codec;
    if (media.mediaType) mediaFile['@mediaType'] = media.mediaType;

    return mediaFile;
}

function buildMezzanineFile(mez: MezzanineFile) {
    const node: any = {
        '@delivery': mez.delivery || 'progressive',
        '@type': mez.type,
        '@width': mez.width,
        '@height': mez.height,
        '#text': cdata(mez.url),
    };
    if (mez.codec) node['@codec'] = mez.codec;
    if (mez.fileSize !== undefined) node['@fileSize'] = mez.fileSize;
    return node;
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
