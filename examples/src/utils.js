"use strict";
/**
 * Utility functions for VAST 4.1 XML generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cdata = cdata;
exports.canUseCDATA = canUseCDATA;
exports.safeContent = safeContent;
exports.toClockTime = toClockTime;
exports.withIABQuartiles = withIABQuartiles;
exports.isValidProgressOffset = isValidProgressOffset;
exports.isValidMimeType = isValidMimeType;
exports.isValidUrl = isValidUrl;
exports.isValidDuration = isValidDuration;
/**
 * Marker function to indicate content should be CDATA
 * Handles special cases where content contains ]]> sequences
 */
function cdata(content) {
    // If content contains ]]>, we can't use CDATA - fall back to text escaping
    if (content.includes(']]>')) {
        return content;
    }
    return content;
}
/**
 * Safe CDATA wrapper that handles content with ]]> sequences
 * Returns true if content can be safely wrapped in CDATA
 */
function canUseCDATA(content) {
    return !content.includes(']]>');
}
/**
 * Helper to safely add content as CDATA or text depending on content
 */
function safeContent(element, content) {
    if (canUseCDATA(content)) {
        element.dat(content);
    }
    else {
        element.txt(content);
    }
}
/**
 * Converts seconds to HH:MM:SS format
 */
function toClockTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
/**
 * Generates standard IAB quartile tracking events
 */
function withIABQuartiles(baseUrl) {
    return [
        { event: 'start', url: `${baseUrl}/start` },
        { event: 'firstQuartile', url: `${baseUrl}/q1` },
        { event: 'midpoint', url: `${baseUrl}/q2` },
        { event: 'thirdQuartile', url: `${baseUrl}/q3` },
        { event: 'complete', url: `${baseUrl}/complete` },
    ];
}
/**
 * Validates progress offset format (HH:MM:SS or percentage)
 */
function isValidProgressOffset(offset) {
    // Check percentage format: exactly n% (not n%% or other invalid formats)
    const percentRegex = /^\d+(\.\d+)?%$/;
    if (percentRegex.test(offset)) {
        const num = parseFloat(offset.slice(0, -1));
        return !isNaN(num) && num >= 0 && num <= 100;
    }
    // Check time format: HH:MM:SS or HH:MM:SS.mmm
    const timeRegex = /^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/;
    return timeRegex.test(offset);
}
/**
 * Validates MIME type format
 */
function isValidMimeType(mimeType) {
    const mimeRegex = /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/;
    return mimeRegex.test(mimeType);
}
/**
 * Type guard for checking if value is a valid URL string
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Type guard for checking if value is a valid duration string
 */
function isValidDuration(duration) {
    const durationRegex = /^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/;
    return durationRegex.test(duration);
}
