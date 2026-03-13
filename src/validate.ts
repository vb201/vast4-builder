import {
    ValidationResult,
    InlineAdOpts,
    WrapperAdOpts,
    MediaFile,
    TrackingEvent,
    AdVerificationOpts,
    ViewableImpressionOpts,
    CompanionAdsOpts,
    MezzanineFile,
} from './types';
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

        if (creative.companionAds) {
            const companionErrors = validateCompanionAds(creative.companionAds);
            companionErrors.errors.forEach((error) => {
                errors.push(`InlineAd: creative[${index}].companionAds: ${error}`);
            });
        }

        if (!creative.linear && !creative.nonLinear && !creative.companionAds) {
            errors.push(
                `InlineAd: creative[${index}] must have linear, nonLinear, or companionAds content`,
            );
        }

        // Validate UniversalAdId
        if (creative.universalAdId) {
            if (!creative.universalAdId.idValue?.trim()) {
                errors.push(`InlineAd: creative[${index}].universalAdId.idValue is required`);
            }
            if (!creative.universalAdId.idRegistry?.trim()) {
                errors.push(`InlineAd: creative[${index}].universalAdId.idRegistry is required`);
            }
        }
    });

    // Validate AdVerifications (VAST 4.1)
    if (opts.adVerifications) {
        opts.adVerifications.forEach((v, index) => {
            const vErrors = validateAdVerification(v);
            vErrors.errors.forEach((error) => {
                errors.push(`InlineAd: adVerification[${index}]: ${error}`);
            });
        });
    }

    // Validate ViewableImpression (VAST 4.1)
    if (opts.viewableImpression) {
        const viErrors = validateViewableImpression(opts.viewableImpression);
        viErrors.errors.forEach((error) => {
            errors.push(`InlineAd: viewableImpression: ${error}`);
        });
    }

    // Validate Category
    opts.category?.forEach((cat, index) => {
        if (!cat.value?.trim()) {
            errors.push(`InlineAd: category[${index}].value is required`);
        }
    });

    // Validate Pricing
    if (opts.pricing) {
        if (!opts.pricing.value?.trim()) {
            errors.push('InlineAd: pricing.value is required');
        }
        if (!['CPM', 'CPC', 'CPE', 'CPV'].includes(opts.pricing.model)) {
            errors.push('InlineAd: pricing.model must be CPM, CPC, CPE, or CPV');
        }
        if (!opts.pricing.currency?.trim()) {
            errors.push('InlineAd: pricing.currency is required');
        }
    }

    // Validate Survey URLs
    opts.survey?.forEach((s, index) => {
        if (!isValidUrl(s.url)) {
            errors.push(`InlineAd: survey[${index}].url is not a valid URL`);
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

    // Validate AdVerifications (VAST 4.1)
    if (opts.adVerifications) {
        opts.adVerifications.forEach((v, index) => {
            const vErrors = validateAdVerification(v);
            vErrors.errors.forEach((error) => {
                errors.push(`WrapperAd: adVerification[${index}]: ${error}`);
            });
        });
    }

    // Validate ViewableImpression (VAST 4.1)
    if (opts.viewableImpression) {
        const viErrors = validateViewableImpression(opts.viewableImpression);
        viErrors.errors.forEach((error) => {
            errors.push(`WrapperAd: viewableImpression: ${error}`);
        });
    }

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
                `unit[${index}]: must have at least one resource (static, iframe, or html)`,
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

/**
 * Validate AdVerification options (VAST 4.1)
 */
export function validateAdVerification(opts: AdVerificationOpts): ValidationResult {
    const errors: string[] = [];

    // Must have at least one resource
    if (!opts.javaScriptResource && !opts.executableResource) {
        errors.push('at least one JavaScriptResource or ExecutableResource is required');
    }

    // Validate JS resources
    if (opts.javaScriptResource) {
        const jsResources = Array.isArray(opts.javaScriptResource)
            ? opts.javaScriptResource
            : [opts.javaScriptResource];
        jsResources.forEach((js, index) => {
            if (!isValidUrl(js.url)) {
                errors.push(`javaScriptResource[${index}].url is not a valid URL`);
            }
            if (!js.apiFramework?.trim()) {
                errors.push(`javaScriptResource[${index}].apiFramework is required`);
            }
        });
    }

    // Validate executable resources
    if (opts.executableResource) {
        const exeResources = Array.isArray(opts.executableResource)
            ? opts.executableResource
            : [opts.executableResource];
        exeResources.forEach((exe, index) => {
            if (!isValidUrl(exe.url)) {
                errors.push(`executableResource[${index}].url is not a valid URL`);
            }
            if (!exe.apiFramework?.trim()) {
                errors.push(`executableResource[${index}].apiFramework is required`);
            }
            if (!exe.type?.trim()) {
                errors.push(`executableResource[${index}].type is required`);
            }
        });
    }

    // Validate tracking events
    opts.trackingEvents?.forEach((event, index) => {
        const eventErrors = validateTrackingEvent(event);
        eventErrors.errors.forEach((error) => {
            errors.push(`trackingEvent[${index}]: ${error}`);
        });
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate ViewableImpression options (VAST 4.1)
 */
export function validateViewableImpression(opts: ViewableImpressionOpts): ValidationResult {
    const errors: string[] = [];

    // At least one URL should be present
    const hasUrls =
        (opts.viewable?.length || 0) +
        (opts.notViewable?.length || 0) +
        (opts.viewUndetermined?.length || 0);
    if (hasUrls === 0) {
        errors.push('at least one viewable, notViewable, or viewUndetermined URL is required');
    }

    opts.viewable?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`viewable[${index}] is not a valid URL`);
        }
    });

    opts.notViewable?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`notViewable[${index}] is not a valid URL`);
        }
    });

    opts.viewUndetermined?.forEach((url, index) => {
        if (!isValidUrl(url)) {
            errors.push(`viewUndetermined[${index}] is not a valid URL`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate CompanionAds options (VAST 4.1)
 */
export function validateCompanionAds(opts: CompanionAdsOpts): ValidationResult {
    const errors: string[] = [];

    if (!opts.companions?.length) {
        errors.push('at least one companion is required');
    }

    opts.companions?.forEach((comp, index) => {
        if (typeof comp.width !== 'number' || comp.width <= 0) {
            errors.push(`companion[${index}]: width must be a positive number`);
        }
        if (typeof comp.height !== 'number' || comp.height <= 0) {
            errors.push(`companion[${index}]: height must be a positive number`);
        }

        // Must have at least one resource
        if (!comp.staticResource && !comp.iframeResource && !comp.htmlResource) {
            errors.push(
                `companion[${index}]: must have at least one resource (static, iframe, or html)`,
            );
        }

        if (comp.staticResource?.url && !isValidUrl(comp.staticResource.url)) {
            errors.push(`companion[${index}]: staticResource.url is not a valid URL`);
        }

        if (comp.iframeResource && !isValidUrl(comp.iframeResource)) {
            errors.push(`companion[${index}]: iframeResource is not a valid URL`);
        }

        if (comp.companionClickThrough && !isValidUrl(comp.companionClickThrough)) {
            errors.push(`companion[${index}]: companionClickThrough is not a valid URL`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Validate MezzanineFile options (VAST 4.1)
 */
export function validateMezzanineFile(opts: MezzanineFile): ValidationResult {
    const errors: string[] = [];

    if (!opts.url?.trim()) {
        errors.push('url is required');
    } else if (!isValidUrl(opts.url)) {
        errors.push('url is not valid');
    }

    if (!opts.type?.trim()) {
        errors.push('type (MIME) is required');
    }

    if (typeof opts.width !== 'number' || opts.width <= 0) {
        errors.push('width must be a positive number');
    }

    if (typeof opts.height !== 'number' || opts.height <= 0) {
        errors.push('height must be a positive number');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}
