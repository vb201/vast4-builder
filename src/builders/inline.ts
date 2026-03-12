import { InlineAdOpts, BuiltAd, Creative } from '../types';
import { cdata } from '../utils';
import { buildLinearCreative } from './linear';
import { buildNonLinearCreative } from './nonlinear';

/**
 * Build an InLine ad following VAST 3.0 spec
 */
export function buildInlineAd(opts: InlineAdOpts): BuiltAd {
    if (!opts.title) {
        throw new Error('InLine ad requires title');
    }

    if (!opts.impressions || opts.impressions.length === 0) {
        throw new Error('InLine ad requires at least one impression URL');
    }

    if (!opts.creatives || opts.creatives.length === 0) {
        throw new Error('InLine ad requires at least one creative');
    }

    const inlineAd: any = {
        '@id': opts.id || generateId(),
        AdSystem: opts.adSystem || 'VAST4Builder',
        AdTitle: cdata(opts.title),
        Impression: opts.impressions.map((url) => cdata(url)),
        Creatives: {
            Creative: opts.creatives.map((creative, index) => buildCreative(creative, index)),
        },
    };

    // Add error URLs if provided
    if (opts.errorUrls && opts.errorUrls.length > 0) {
        inlineAd.Error = opts.errorUrls.map((url) => cdata(url));
    }

    // Add custom telemetry as Extensions
    if (opts.customTelemetryJson) {
        inlineAd.Extensions = {
            Extension: {
                '@type': 'telemetry',
                '#cdata': JSON.stringify(opts.customTelemetryJson, null, 2),
            },
        };
    }

    // Add AdVerifications
    if (opts.adVerifications && opts.adVerifications.length > 0) {
        inlineAd.AdVerifications = {
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
        type: 'InLine',
        id: opts.id || generateId(),
        node: { InLine: inlineAd },
    };
}

function buildCreative(creative: Creative, index: number) {
    const creativeNode: any = {
        '@id': `creative-${index + 1}`,
    };

    if (creative.linear) {
        const linearNode = buildLinearCreative(creative.linear);
        Object.assign(creativeNode, linearNode);
    } else if (creative.nonLinear) {
        const nonLinearNode = buildNonLinearCreative(creative.nonLinear);
        Object.assign(creativeNode, nonLinearNode);
    } else {
        throw new Error('Creative must have either linear or nonLinear content');
    }

    return creativeNode;
}

function generateId(): string {
    return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
