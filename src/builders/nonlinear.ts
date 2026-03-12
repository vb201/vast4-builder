import { NonLinearCreativeOpts, NonLinearUnit, NonLinearCreativeNode } from '../types';
import { cdata } from '../utils';

/**
 * Build a NonLinear creative following VAST 4.1 spec
 */
export function buildNonLinearCreative(opts: NonLinearCreativeOpts): NonLinearCreativeNode {
    if (!opts.units || opts.units.length === 0) {
        throw new Error('NonLinear creative requires at least one unit');
    }

    return {
        NonLinearAds: {
            NonLinear: opts.units.map(buildNonLinearUnit),
        },
    };
}

function buildNonLinearUnit(unit: NonLinearUnit) {
    const nonLinear: any = {
        '@width': unit.width,
        '@height': unit.height,
    };

    if (unit.minSuggestedDuration) {
        nonLinear['@minSuggestedDuration'] = unit.minSuggestedDuration;
    }

    // Add resource (only one type should be provided)
    if (unit.staticResource) {
        nonLinear.StaticResource = {
            '@creativeType': inferMimeType(unit.staticResource),
            '#text': cdata(unit.staticResource),
        };
    } else if (unit.iframeResource) {
        nonLinear.IFrameResource = cdata(unit.iframeResource);
    } else if (unit.htmlResource) {
        nonLinear.HTMLResource = cdata(unit.htmlResource);
    }

    // Add click tracking
    if (unit.nonLinearClickThrough) {
        nonLinear.NonLinearClickThrough = cdata(unit.nonLinearClickThrough);
    }

    if (unit.nonLinearClickTracking && unit.nonLinearClickTracking.length > 0) {
        nonLinear.NonLinearClickTracking = unit.nonLinearClickTracking.map((url) => cdata(url));
    }

    return nonLinear;
}

/**
 * Infer MIME type from static resource URL
 */
function inferMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'svg':
            return 'image/svg+xml';
        case 'webp':
            return 'image/webp';
        case 'swf':
            return 'application/x-shockwave-flash';
        default:
            return 'image/jpeg'; // Default fallback
    }
}
