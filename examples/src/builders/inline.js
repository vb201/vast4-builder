"use strict";
/**
 * Inline Ad Builder for VAST 4.1
 * Builds complete InLine ads with creatives and tracking
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInlineAd = buildInlineAd;
const utils_1 = require("../utils");
const linear_1 = require("./linear");
const nonlinear_1 = require("./nonlinear");
/**
 * Build an InLine ad following VAST 4.1 spec
 */
function buildInlineAd(opts) {
    if (!opts.title) {
        throw new Error('InLine ad requires title');
    }
    if (!opts.impressions || opts.impressions.length === 0) {
        throw new Error('InLine ad requires at least one impression URL');
    }
    if (!opts.creatives || opts.creatives.length === 0) {
        throw new Error('InLine ad requires at least one creative');
    }
    const inlineAd = {
        '@id': opts.id || generateId(),
        AdSystem: opts.adSystem || 'VAST4Builder',
        AdTitle: (0, utils_1.cdata)(opts.title),
        Impression: opts.impressions.map(url => (0, utils_1.cdata)(url)),
        Creatives: {
            Creative: opts.creatives.map((creative, index) => buildCreative(creative, index))
        }
    };
    // Add error URLs if provided
    if (opts.errorUrls && opts.errorUrls.length > 0) {
        inlineAd.Error = opts.errorUrls.map(url => (0, utils_1.cdata)(url));
    }
    // Add custom telemetry as Extensions
    if (opts.customTelemetryJson) {
        inlineAd.Extensions = {
            Extension: {
                '@type': 'telemetry',
                '#cdata': JSON.stringify(opts.customTelemetryJson, null, 2)
            }
        };
    }
    return {
        type: 'InLine',
        id: opts.id || generateId(),
        node: { InLine: inlineAd }
    };
}
function buildCreative(creative, index) {
    const creativeNode = {
        '@id': `creative-${index + 1}`
    };
    if (creative.linear) {
        const linearNode = (0, linear_1.buildLinearCreative)(creative.linear);
        Object.assign(creativeNode, linearNode);
    }
    else if (creative.nonLinear) {
        const nonLinearNode = (0, nonlinear_1.buildNonLinearCreative)(creative.nonLinear);
        Object.assign(creativeNode, nonLinearNode);
    }
    else {
        throw new Error('Creative must have either linear or nonLinear content');
    }
    return creativeNode;
}
function generateId() {
    return `ad-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
