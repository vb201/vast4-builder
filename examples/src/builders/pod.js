"use strict";
/**
 * Ad Pod Builder for VAST 4.1
 * Handles sequential ad playback (pre-roll, mid-roll, post-roll)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdPod = buildAdPod;
exports.validatePodStructure = validatePodStructure;
/**
 * Build an Ad Pod by adding sequence numbers to ads
 * Pod = a set of Linear ads played sequentially
 */
function buildAdPod(ads) {
    if (!ads || ads.length === 0) {
        throw new Error('Ad Pod requires at least one ad');
    }
    return ads.map((ad, index) => {
        // Clone the ad and add sequence attribute
        const podAd = {
            ...ad,
            sequence: index + 1
        };
        // Add sequence attribute to the XML node
        if (ad.type === 'InLine' && ad.node.InLine) {
            podAd.node = {
                InLine: {
                    ...ad.node.InLine,
                    '@sequence': index + 1
                }
            };
        }
        else if (ad.type === 'Wrapper' && ad.node.Wrapper) {
            podAd.node = {
                Wrapper: {
                    ...ad.node.Wrapper,
                    '@sequence': index + 1
                }
            };
        }
        return podAd;
    });
}
/**
 * Validate that the last ad in a pod can have both Linear and NonLinear creatives
 * According to VAST 4.1 spec, the last ad in a pod may include a NonLinear creative
 */
function validatePodStructure(ads) {
    const errors = [];
    if (ads.length === 0) {
        errors.push('Pod cannot be empty');
        return { valid: false, errors };
    }
    // Validate that all ads except potentially the last one are Linear
    for (let i = 0; i < ads.length - 1; i++) {
        const ad = ads[i];
        if (!hasLinearCreative(ad)) {
            errors.push(`Ad at position ${i + 1} must be Linear (only the last ad in a pod may be NonLinear)`);
        }
    }
    return { valid: errors.length === 0, errors };
}
/**
 * Check if an ad has a Linear creative
 */
function hasLinearCreative(ad) {
    if (ad.type === 'InLine' && ad.node.InLine?.Creatives?.Creative) {
        const creatives = Array.isArray(ad.node.InLine.Creatives.Creative)
            ? ad.node.InLine.Creatives.Creative
            : [ad.node.InLine.Creatives.Creative];
        return creatives.some((creative) => creative.Linear);
    }
    if (ad.type === 'Wrapper' && ad.node.Wrapper?.Creatives?.Creative) {
        const creatives = Array.isArray(ad.node.Wrapper.Creatives.Creative)
            ? ad.node.Wrapper.Creatives.Creative
            : [ad.node.Wrapper.Creatives.Creative];
        return creatives.some((creative) => creative.Linear);
    }
    return false;
}
