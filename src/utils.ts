import { TrackingEvent } from './types';

/**
 * Marker function to indicate content should be CDATA
 * Handles special cases where content contains ]]> sequences
 */
export function cdata(content: string): string {
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
export function canUseCDATA(content: string): boolean {
    return !content.includes(']]>');
}

/**
 * Helper to safely add content as CDATA or text depending on content
 */
export function safeContent(element: any, content: string): void {
    if (canUseCDATA(content)) {
        element.dat(content);
    } else {
        element.txt(content);
    }
}

/**
 * Converts seconds to HH:MM:SS format
 */
export function toClockTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
}

/**
 * Generates standard IAB quartile tracking events
 */
export function withIABQuartiles(baseUrl: string): TrackingEvent[] {
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
export function isValidProgressOffset(offset: string): boolean {
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
export function isValidMimeType(mimeType: string): boolean {
    const mimeRegex = /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.]*$/;
    return mimeRegex.test(mimeType);
}

/**
 * Type guard for checking if value is a valid URL string
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Type guard for checking if value is a valid duration string
 */
export function isValidDuration(duration: string): boolean {
    const durationRegex = /^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/;
    return durationRegex.test(duration);
}
