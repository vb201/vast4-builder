import { CompanionAdsOpts, CompanionAd, TrackingEvent } from '../types';
import { cdata } from '../utils';

/**
 * Build CompanionAds node following VAST 4.1 spec
 */
export function buildCompanionAds(opts: CompanionAdsOpts) {
    const companionAds: any = {};

    if (opts.required) {
        companionAds['@required'] = opts.required;
    }

    companionAds.Companion = opts.companions.map(buildCompanion);
    return companionAds;
}

function buildCompanion(companion: CompanionAd) {
    const node: any = {
        '@width': companion.width,
        '@height': companion.height,
    };

    if (companion.id) node['@id'] = companion.id;
    if (companion.assetWidth) node['@assetWidth'] = companion.assetWidth;
    if (companion.assetHeight) node['@assetHeight'] = companion.assetHeight;
    if (companion.expandedWidth) node['@expandedWidth'] = companion.expandedWidth;
    if (companion.expandedHeight) node['@expandedHeight'] = companion.expandedHeight;
    if (companion.apiFramework) node['@apiFramework'] = companion.apiFramework;
    if (companion.adSlotId) node['@adSlotId'] = companion.adSlotId;
    if (companion.renderingMode) node['@renderingMode'] = companion.renderingMode;

    // Resource (only one should be set)
    if (companion.staticResource) {
        node.StaticResource = {
            '@creativeType': companion.staticResource.creativeType,
            '#text': cdata(companion.staticResource.url),
        };
    } else if (companion.iframeResource) {
        node.IFrameResource = cdata(companion.iframeResource);
    } else if (companion.htmlResource) {
        node.HTMLResource = cdata(companion.htmlResource);
    }

    // Tracking events
    if (companion.trackingEvents && companion.trackingEvents.length > 0) {
        node.TrackingEvents = {
            Tracking: companion.trackingEvents.map((t: TrackingEvent) => {
                const track: any = { '@event': t.event, '#text': cdata(t.url) };
                if (t.offset) track['@offset'] = t.offset;
                return track;
            }),
        };
    }

    // Click
    if (companion.companionClickThrough) {
        node.CompanionClickThrough = cdata(companion.companionClickThrough);
    }

    if (companion.companionClickTracking && companion.companionClickTracking.length > 0) {
        node.CompanionClickTracking = companion.companionClickTracking.map((url) => cdata(url));
    }

    if (companion.altText) {
        node.AltText = companion.altText;
    }

    return node;
}
