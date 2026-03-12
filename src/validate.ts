import { ValidationResult, InlineAdOpts, WrapperAdOpts, MediaFile, TrackingEvent } from './types';
import { isValidUrl, isValidDuration, isValidProgressOffset, isValidMimeType } from './utils';

/**
 * Validate VAST XML or parsed object
 */
export function validateVast(input: string | object): ValidationResult {
    const errors: string[] = [];

    // TODO: Basic structure validation would go here
    // TODO: Implement full VAST schema validation for the input
    void input; // Acknowledge parameter is intended for future use

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate InlineAd options
 */
export function validateInlineAd(opts: InlineAdOpts): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!opts.title?.trim()) {
        errors.push('InlineAd: title is required');
    }

    if (!opts.impressions?.length) {
        errors.push('InlineAd: at least one impression URL is required');
    }

    if (!opts.creatives?.length) {
        errors.push('InlineAd: at least one creative is required');
    }

    // Validate impression URLs
    opts.impressions?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`InlineAd: impression[${index}] is not a valid URL`);
        }
    });

    // Validate error URLs
    opts.errorUrls?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`InlineAd: errorUrl[${index}] is not a valid URL`);
        }
    });

    // Validate creatives
    opts.creatives?.forEach((creative, index) => {
        if (creative.linear) {
            const linearErrors = validateLinearCreative(creative.linear);
            linearErrors.errors.forEach((error) => {
                errors.push(`InlineAd: creative[${index}].linear: ${error}`);
            });
        }

        if (creative.nonLinear) {
            const nonLinearErrors = validateNonLinearCreative(creative.nonLinear);
            nonLinearErrors.errors.forEach((error) => {
                errors.push(`InlineAd: creative[${index}].nonLinear: ${error}`);
            });
        }

        if (!creative.linear && !creative.nonLinear) {
            errors.push(
                `InlineAd: creative[${index}] must have either linear or nonLinear content`
            );
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate WrapperAd options
 */
export function validateWrapperAd(opts: WrapperAdOpts): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!opts.impressions?.length) {
        errors.push('WrapperAd: at least one impression URL is required');
    }

    if (!opts.vastAdTagURI?.trim()) {
        errors.push('WrapperAd: vastAdTagURI is required');
    }

    // Validate URLs
    if (opts.vastAdTagURI && !isValidUrl(opts.vastAdTagURI)) {
        errors.push('WrapperAd: vastAdTagURI is not a valid URL');
    }

    opts.impressions?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`WrapperAd: impression[${index}] is not a valid URL`);
        }
    });

    opts.errorUrls?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`WrapperAd: errorUrl[${index}] is not a valid URL`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate LinearCreative options
 */
export function validateLinearCreative(opts: any): ValidationResult {
    const errors: string[] = [];

    // Required fields
    if (!opts.duration) {
        errors.push('duration is required');
    } else if (!isValidDuration(opts.duration)) {
        errors.push('duration must be in HH:MM:SS format');
    }

    if (!opts.mediaFiles?.length) {
        errors.push('at least one media file is required');
    }

    // Validate media files
    opts.mediaFiles?.forEach((mediaFile: MediaFile, index: number) => {
        const mediaErrors = validateMediaFile(mediaFile);
        mediaErrors.errors.forEach((error) => {
            errors.push(`mediaFile[${index}]: ${error}`);
        });
    });

    // Validate tracking events
    opts.tracking?.forEach((event: TrackingEvent, index: number) => {
        const trackingErrors = validateTrackingEvent(event);
        trackingErrors.errors.forEach((error) => {
            errors.push(`tracking[${index}]: ${error}`);
        });
    });

    // Validate skipoffset if provided
    if (opts.skipoffset && !isValidDuration(opts.skipoffset)) {
        errors.push('skipoffset must be in HH:MM:SS format');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate NonLinearCreative options
 */
export function validateNonLinearCreative(opts: any): ValidationResult {
    const errors: string[] = [];

    if (!opts.units?.length) {
        errors.push('at least one non-linear unit is required');
    }

    opts.units?.forEach((unit: any, index: number) => {
        if (typeof unit.width !== 'number' || unit.width <= 0) {
            errors.push(`unit[${index}]: width must be a positive number`);
        }

        if (typeof unit.height !== 'number' || unit.height <= 0) {
            errors.push(`unit[${index}]: height must be a positive number`);
        }

        // Must have at least one resource
        if (!unit.staticResource && !unit.iframeResource && !unit.htmlResource) {
            errors.push(
                `unit[${index}]: must have at least one resource (static, iframe, or html)`
            );
        }

        // Validate URLs
        if (unit.staticResource && !isValidUrl(unit.staticResource)) {
            errors.push(`unit[${index}]: staticResource is not a valid URL`);
        }

        if (unit.iframeResource && !isValidUrl(unit.iframeResource)) {
            errors.push(`unit[${index}]: iframeResource is not a valid URL`);
        }

        if (unit.nonLinearClickThrough && !isValidUrl(unit.nonLinearClickThrough)) {
            errors.push(`unit[${index}]: nonLinearClickThrough is not a valid URL`);
        }

        if (unit.minSuggestedDuration && !isValidDuration(unit.minSuggestedDuration)) {
            errors.push(`unit[${index}]: minSuggestedDuration must be in HH:MM:SS format`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate MediaFile
 */
export function validateMediaFile(mediaFile: MediaFile): ValidationResult {
    const errors: string[] = [];

    if (!mediaFile.url?.trim()) {
        errors.push('url is required');
    } else if (!isValidUrl(mediaFile.url)) {
        errors.push('url is not valid');
    }

    if (!mediaFile.type?.trim()) {
        errors.push('type (MIME) is required');
    } else if (!isValidMimeType(mediaFile.type)) {
        errors.push('type is not a valid MIME type');
    }

    if (typeof mediaFile.width !== 'number' || mediaFile.width <= 0) {
        errors.push('width must be a positive number');
    }

    if (typeof mediaFile.height !== 'number' || mediaFile.height <= 0) {
        errors.push('height must be a positive number');
    }

    if (mediaFile.delivery && !['progressive', 'streaming'].includes(mediaFile.delivery)) {
        errors.push('delivery must be either "progressive" or "streaming"');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate TrackingEvent
 */
export function validateTrackingEvent(event: TrackingEvent): ValidationResult {
    const errors: string[] = [];

    if (!event.event?.trim()) {
        errors.push('event type is required');
    }

    if (!event.url?.trim()) {
        errors.push('url is required');
    } else if (!isValidUrl(event.url)) {
        errors.push('url is not valid');
    }

    if (event.offset && !isValidProgressOffset(event.offset)) {
        errors.push('offset must be in HH:MM:SS format or percentage (n%)');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
