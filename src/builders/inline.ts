import { InlineAdOpts, BuiltAd, Creative } from '../types';
import { cdata } from '../utils';
import { buildLinearCreative } from './linear';
import { buildNonLinearCreative } from './nonlinear';
import { buildCompanionAds } from './companion';

/**
 * Build an InLine ad following VAST 4.1 spec
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

    // ─── VAST 4.1/4.2 metadata ───

    // AdServingId (VAST 4.1)
    if (opts.adServingId) {
        inlineAd.AdServingId = opts.adServingId;
    }

    // Description
    if (opts.description) {
        inlineAd.Description = cdata(opts.description);
    }

    // Advertiser
    if (opts.advertiser) {
        inlineAd.Advertiser = cdata(opts.advertiser);
    }

    // Category (VAST 4.1)
    if (opts.category && opts.category.length > 0) {
        inlineAd.Category = opts.category.map((cat) => {
            const c: any = { '#text': cat.value };
            if (cat.authority) c['@authority'] = cat.authority;
            return c;
        });
    }

    // Pricing
    if (opts.pricing) {
        inlineAd.Pricing = {
            '@model': opts.pricing.model,
            '@currency': opts.pricing.currency,
            '#text': opts.pricing.value,
        };
    }

    // Survey
    if (opts.survey && opts.survey.length > 0) {
        inlineAd.Survey = opts.survey.map((s) => {
            const sv: any = { '#text': cdata(s.url) };
            if (s.type) sv['@type'] = s.type;
            return sv;
        });
    }

    // Expires (VAST 4.1)
    if (opts.expires !== undefined) {
        inlineAd.Expires = opts.expires;
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

    // Add ViewableImpression
    if (opts.viewableImpression) {
        const vi: any = {};
        if (opts.viewableImpression.id) vi['@id'] = opts.viewableImpression.id;
        if (opts.viewableImpression.viewable && opts.viewableImpression.viewable.length > 0) {
            vi.Viewable = opts.viewableImpression.viewable.map((url) => cdata(url));
        }
        if (opts.viewableImpression.notViewable && opts.viewableImpression.notViewable.length > 0) {
            vi.NotViewable = opts.viewableImpression.notViewable.map((url) => cdata(url));
        }
        if (
            opts.viewableImpression.viewUndetermined &&
            opts.viewableImpression.viewUndetermined.length > 0
        ) {
            vi.ViewUndetermined = opts.viewableImpression.viewUndetermined.map((url) => cdata(url));
        }
        inlineAd.ViewableImpression = vi;
    }

    // Add AdVerifications
    if (opts.adVerifications && opts.adVerifications.length > 0) {
        inlineAd.AdVerifications = {
            Verification: opts.adVerifications.map((v) => {
                const verification: any = {};
                if (v.vendor) verification['@vendor'] = v.vendor;

                if (v.javaScriptResource) {
                    const js = Array.isArray(v.javaScriptResource)
                        ? v.javaScriptResource
                        : [v.javaScriptResource];
                    verification.JavaScriptResource = js.map((j) => {
                        const res: any = { '@apiFramework': j.apiFramework, '#text': cdata(j.url) };
                        if (j.browserOptional !== undefined)
                            res['@browserOptional'] = j.browserOptional;
                        return res;
                    });
                }

                if (v.executableResource) {
                    const ex = Array.isArray(v.executableResource)
                        ? v.executableResource
                        : [v.executableResource];
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

    // VAST 4.1 creative-level attributes
    if (creative.adId) creativeNode['@adId'] = creative.adId;
    if (creative.sequence !== undefined) creativeNode['@sequence'] = creative.sequence;
    if (creative.apiFramework) creativeNode['@apiFramework'] = creative.apiFramework;

    // UniversalAdId on Creative (VAST 4.1)
    if (creative.universalAdId) {
        creativeNode.UniversalAdId = {
            '@idRegistry': creative.universalAdId.idRegistry,
            '#text': creative.universalAdId.idValue,
        };
    }

    if (creative.linear) {
        const linearNode = buildLinearCreative(creative.linear);
        Object.assign(creativeNode, linearNode);
    } else if (creative.nonLinear) {
        const nonLinearNode = buildNonLinearCreative(creative.nonLinear);
        Object.assign(creativeNode, nonLinearNode);
    } else if (!creative.companionAds) {
        throw new Error('Creative must have linear, nonLinear, or companionAds content');
    }

    // CompanionAds (VAST 4.1)
    if (creative.companionAds) {
        creativeNode.CompanionAds = buildCompanionAds(creative.companionAds);
    }

    return creativeNode;
}

function generateId(): string {
    return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
