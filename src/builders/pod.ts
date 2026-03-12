import { BuiltAd } from '../types';

/**
 * Build an Ad Pod by adding sequence numbers to ads
 * Pod = a set of Linear ads played sequentially
 */
export function buildAdPod(ads: BuiltAd[]): BuiltAd[] {
    if (!ads || ads.length === 0) {
        throw new Error('Ad Pod requires at least one ad');
    }

    return ads.map((ad, index) => {
        // Clone the ad and add sequence attribute
        const podAd: BuiltAd = {
            ...ad,
            sequence: index + 1,
        };

        // Add sequence attribute to the XML node
        if (ad.type === 'InLine' && ad.node.InLine) {
            podAd.node = {
                InLine: {
                    ...ad.node.InLine,
                    '@sequence': index + 1,
                },
            };
        } else if (ad.type === 'Wrapper' && ad.node.Wrapper) {
            podAd.node = {
                Wrapper: {
                    ...ad.node.Wrapper,
                    '@sequence': index + 1,
                },
            };
        }

        return podAd;
    });
}

/**
 * Validate that the last ad in a pod can have both Linear and NonLinear creatives
 * According to VAST 4.1 spec, the last ad in a pod may include a NonLinear creative
 */
export function validatePodStructure(ads: BuiltAd[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (ads.length === 0) {
        errors.push('Pod cannot be empty');
        return { valid: false, errors };
    }

    // Validate that all ads except potentially the last one are Linear
    for (let i = 0; i < ads.length - 1; i++) {
        const ad = ads[i];
        if (!hasLinearCreative(ad)) {
            errors.push(
                `Ad at position ${
                    i + 1
                } must be Linear (only the last ad in a pod may be NonLinear)`
            );
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Check if an ad has a Linear creative
 */
function hasLinearCreative(ad: BuiltAd): boolean {
    if (ad.type === 'InLine' && ad.node.InLine?.Creatives?.Creative) {
        const creatives = Array.isArray(ad.node.InLine.Creatives.Creative)
            ? ad.node.InLine.Creatives.Creative
            : [ad.node.InLine.Creatives.Creative];

        return creatives.some((creative: any) => creative.Linear);
    }

    if (ad.type === 'Wrapper' && ad.node.Wrapper?.Creatives?.Creative) {
        const creatives = Array.isArray(ad.node.Wrapper.Creatives.Creative)
            ? ad.node.Wrapper.Creatives.Creative
            : [ad.node.Wrapper.Creatives.Creative];

        return creatives.some((creative: any) => creative.Linear);
    }

    return false;
}
