import { WrapperAdOpts, BuiltAd, TrackingEvent, Clicks } from '../types';
import { cdata } from '../utils';

/**
 * Build a Wrapper ad following VAST 4.1 spec
 * Enforces wrapper-mode constraints: no media files, only tracking shells
 */
export function buildWrapperAd(opts: WrapperAdOpts): BuiltAd {
    if (!opts.vastAdTagURI) {
        throw new Error('Wrapper ad requires vastAdTagURI');
    }

    if (!opts.impressions || opts.impressions.length === 0) {
        throw new Error('Wrapper ad requires at least one impression URL');
    }

    const wrapperAd: any = {
        '@id': opts.id || generateId(),
        AdSystem: opts.adSystem || 'VAST4Builder',
        VASTAdTagURI: cdata(opts.vastAdTagURI),
        Impression: opts.impressions.map((url) => cdata(url)),
    };

    // Add error URLs if provided
    if (opts.errorUrls && opts.errorUrls.length > 0) {
        wrapperAd.Error = opts.errorUrls.map((url) => cdata(url));
    }

    // Add tracking creative shells if provided
    if (opts.tracking || opts.clicks) {
        wrapperAd.Creatives = {
            Creative: [buildWrapperTrackingShell(opts.tracking, opts.clicks)],
        };
    }

    // Add custom telemetry as Extensions
    if (opts.customTelemetryJson) {
        wrapperAd.Extensions = {
            Extension: {
                '@type': 'telemetry',
                '#cdata': JSON.stringify(opts.customTelemetryJson, null, 2),
            },
        };
    }

    // Add AdVerifications
    if (opts.adVerifications && opts.adVerifications.length > 0) {
        wrapperAd.AdVerifications = {
            Verification: opts.adVerifications.map((v) => {
                const verification: any = {};
                if (v.vendor) verification['@vendor'] = v.vendor;

                if (v.javaScriptResource) {
                    const js = Array.isArray(v.javaScriptResource) ? v.javaScriptResource : [v.javaScriptResource];
                    verification.JavaScriptResource = js.map((j) => {
                        const res: any = { '@apiFramework': j.apiFramework, '#text': cdata(j.url) };
                        if (j.browserOptional !== undefined) res['@browserOptional'] = j.browserOptional;
                        return res;
                    });
                }

                if (v.executableResource) {
                    const ex = Array.isArray(v.executableResource) ? v.executableResource : [v.executableResource];
                    verification.ExecutableResource = ex.map((e) => ({
                        '@apiFramework': e.apiFramework,
                        '@type': e.type,
                        '#text': cdata(e.url),
                    }));
                }

                if (v.trackingEvents && v.trackingEvents.length > 0) {
                    verification.TrackingEvents = {
                        Tracking: v.trackingEvents.map((t) => {
                            const track: any = { '@event': t.event, '#text': cdata(t.url) };
                            if (t.offset) track['@offset'] = t.offset;
                            return track;
                        }),
                    };
                }

                if (v.verificationParameters) {
                    verification.VerificationParameters = cdata(v.verificationParameters);
                }

                return verification;
            }),
        };
    }

    return {
        type: 'Wrapper',
        id: opts.id || generateId(),
        node: { Wrapper: wrapperAd },
    };
}

/**
 * Build a tracking shell creative for wrapper ads
 * VAST 4.1 constraint: Wrapper creatives contain only tracking, no media
 */
function buildWrapperTrackingShell(tracking?: TrackingEvent[], clicks?: Clicks) {
    const creative: any = {
        '@id': 'wrapper-tracking-shell',
    };

    // For wrapper ads, we create a Linear shell with only VideoClicks and TrackingEvents
    const linearShell: any = {};

    if (clicks) {
        linearShell.VideoClicks = buildVideoClicks(clicks);
    }

    if (tracking && tracking.length > 0) {
        linearShell.TrackingEvents = {
            Tracking: tracking.map(buildTrackingEvent),
        };
    }

    // Only add Linear if we have content
    if (Object.keys(linearShell).length > 0) {
        creative.Linear = linearShell;
    }

    return creative;
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

function generateId(): string {
    return `wrapper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
