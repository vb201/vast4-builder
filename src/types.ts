export type URLString = string;

// ─── VAST 4.1/4.2 Ad-level metadata ───────────────────────────────────

export interface CategoryOpts {
    /** Category taxonomy value (e.g., "IAB3-1") */
    value: string;
    /** Taxonomy authority URI (e.g., "https://iabtechlab.com/standards/content-taxonomy/") */
    authority?: string;
}

export interface UniversalAdIdOpts {
    /** Unique creative identifier value */
    idValue: string;
    /** Registry for the ID (e.g., "Ad-ID", "DCM", "clearcast.co.uk") */
    idRegistry: string;
}

export interface PricingOpts {
    /** Price value as string (e.g., "25.00") */
    value: string;
    /** Pricing model: CPM, CPC, CPE, CPV */
    model: 'CPM' | 'CPC' | 'CPE' | 'CPV';
    /** ISO 4217 currency code (e.g., "USD") */
    currency: string;
}

export interface SurveyOpts {
    /** Survey/research tracking URL */
    url: URLString;
    /** MIME type of the survey resource */
    type?: string;
}

// ─── Companion Ads (VAST 4.1) ──────────────────────────────────────────

export interface CompanionAd {
    width: number;
    height: number;
    /** Unique identifier for the companion */
    id?: string;
    /** Pixel width for asset substitution */
    assetWidth?: number;
    /** Pixel height for asset substitution */
    assetHeight?: number;
    /** Pixel width of expanding companion */
    expandedWidth?: number;
    /** Pixel height of expanding companion */
    expandedHeight?: number;
    /** API framework (e.g., "VPAID", "SIMID") */
    apiFramework?: string;
    /** Ad slot ID for serving companion with ad */
    adSlotId?: string;
    /** Rendering mode: default, end-card, concurrent */
    renderingMode?: 'default' | 'end-card' | 'concurrent';
    /** Resource: only one of static/iframe/html should be set */
    staticResource?: { url: URLString; creativeType: string };
    iframeResource?: URLString;
    htmlResource?: string;
    /** Click-through and tracking */
    companionClickThrough?: URLString;
    companionClickTracking?: URLString[];
    /** Alt text for static resource */
    altText?: string;
    /** Tracking events for companion display */
    trackingEvents?: TrackingEvent[];
}

export interface CompanionAdsOpts {
    /** When to display: all, any, none */
    required?: 'all' | 'any' | 'none';
    companions: CompanionAd[];
}

// ─── Interactive Creative File (VAST 4.1 — SIMID/VPAID) ───────────────

export interface InteractiveCreativeFileOpts {
    /** Interactive creative URL */
    url: URLString;
    /** MIME type (e.g., "text/html") */
    type?: string;
    /** API framework: "SIMID" or "VPAID" */
    apiFramework?: string;
    /** Variable duration flag */
    variableDuration?: boolean;
}

// ─── Closed Caption Files (VAST 4.1) ──────────────────────────────────

export interface ClosedCaptionFileOpts {
    url: URLString;
    /** MIME type (e.g., "text/vtt", "application/ttml+xml") */
    type?: string;
    /** BCP-47 language code (e.g., "en", "es") */
    language?: string;
}

// ─── Ad Verification ──────────────────────────────────────────────────

export interface JavaScriptResourceOpts {
    url: URLString;
    apiFramework: string;
    browserOptional?: boolean;
}

export interface ExecutableResourceOpts {
    url: URLString;
    apiFramework: string;
    type: string;
}

export interface AdVerificationOpts {
    vendor?: string;
    javaScriptResource?: JavaScriptResourceOpts | JavaScriptResourceOpts[];
    executableResource?: ExecutableResourceOpts | ExecutableResourceOpts[];
    verificationParameters?: string;
    trackingEvents?: TrackingEvent[];
}

// ─── Tracking Events ──────────────────────────────────────────────────

export type TrackingEventName =
    | 'start'
    | 'firstQuartile'
    | 'midpoint'
    | 'thirdQuartile'
    | 'complete'
    | 'mute'
    | 'unmute'
    | 'pause'
    | 'rewind'
    | 'resume'
    | 'fullscreen'
    | 'exitFullscreen'
    | 'expand'
    | 'collapse'
    | 'acceptInvitation'
    | 'close'
    | 'creativeView'
    | 'skip'
    | 'progress'
    // VAST 4.1+ events
    | 'loaded'
    | 'playerExpand'
    | 'playerCollapse'
    | 'otherAdInteraction'
    | 'acceptInvitationLinear'
    | 'notUsed';

export interface TrackingEvent {
    event: TrackingEventName | (string & {});
    url: URLString;
    /** For event="progress": "HH:MM:SS(.mmm)" or "n%" */
    offset?: string;
}

export interface Clicks {
    clickThrough?: URLString;
    clickTracking?: URLString[];
    customClicks?: URLString[];
}

export interface MediaFile {
    url: URLString;
    type: string; // MIME type (e.g., video/mp4)
    width: number;
    height: number;
    delivery?: 'progressive' | 'streaming';
    bitrate?: number;
    minBitrate?: number;
    maxBitrate?: number;
    scalable?: boolean;
    maintainAspectRatio?: boolean;
    codec?: string;
    /** VAST 4.1: unique ID for this media file */
    id?: string;
    /** VAST 4.2: media type for ad stitching (e.g., "video/mp4") */
    mediaType?: string;
}

/** VAST 4.1: Mezzanine (source quality) media file for ad stitching */
export interface MezzanineFile {
    url: URLString;
    type: string; // MIME type
    width: number;
    height: number;
    delivery?: 'progressive';
    codec?: string;
    /** VAST 4.1: file size in bytes */
    fileSize?: number;
}

export interface LinearCreativeOpts {
    duration: string; // "HH:MM:SS"
    skipoffset?: string; // enables skippable
    tracking?: TrackingEvent[];
    clicks?: Clicks;
    mediaFiles: MediaFile[];
    /** VAST 4.1: Mezzanine source file for ad stitching */
    mezzanine?: MezzanineFile;
    /** VAST 4.1: Interactive creative files (SIMID/VPAID) */
    interactiveCreativeFiles?: InteractiveCreativeFileOpts[];
    /** VAST 4.1: Closed caption / subtitle files */
    closedCaptionFiles?: ClosedCaptionFileOpts[];
}

export interface NonLinearUnit {
    width: number;
    height: number;
    minSuggestedDuration?: string;
    staticResource?: URLString;
    iframeResource?: URLString;
    htmlResource?: string;
    nonLinearClickThrough?: URLString;
    nonLinearClickTracking?: URLString[];
}

export interface NonLinearCreativeOpts {
    units: NonLinearUnit[];
}

export interface Creative {
    linear?: LinearCreativeOpts;
    nonLinear?: NonLinearCreativeOpts;
    companionAds?: CompanionAdsOpts;
    /** VAST 4.1: ad-level creative ID from ad server */
    adId?: string;
    /** Sequence number for ordering within Creatives */
    sequence?: number;
    /** API framework (e.g., "VPAID", "SIMID", "OMID") */
    apiFramework?: string;
    /** VAST 4.1: Universal Ad ID on creative level */
    universalAdId?: UniversalAdIdOpts;
}

export interface ViewableImpressionOpts {
    id?: string;
    viewable?: URLString[];
    notViewable?: URLString[];
    viewUndetermined?: URLString[];
}

export interface InlineAdOpts {
    id?: string | number;
    title: string;
    adSystem?: string;
    impressions: URLString[];
    errorUrls?: URLString[];
    creatives: Creative[];
    adVerifications?: AdVerificationOpts[];
    viewableImpression?: ViewableImpressionOpts;
    // Custom telemetry embedded into <Extensions>
    customTelemetryJson?: unknown;
    // ─── VAST 4.1/4.2 metadata ───
    /** Ad description text */
    description?: string;
    /** Advertiser name */
    advertiser?: string;
    /** Ad category taxonomy values */
    category?: CategoryOpts[];
    /** Pricing info for auction/billing */
    pricing?: PricingOpts;
    /** Survey/research tracking URLs */
    survey?: SurveyOpts[];
    /** VAST 4.1: Ad serving chain ID */
    adServingId?: string;
    /** VAST 4.1: Cache expiry in seconds */
    expires?: number;
}

export interface WrapperAdOpts {
    id?: string | number;
    adSystem?: string;
    impressions: URLString[];
    errorUrls?: URLString[];
    vastAdTagURI: URLString;
    tracking?: TrackingEvent[];
    clicks?: Clicks;
    adVerifications?: AdVerificationOpts[];
    viewableImpression?: ViewableImpressionOpts;
    customTelemetryJson?: unknown;
    // ─── VAST 4.1/4.2 wrapper metadata ───
    /** VAST 4.1: Blocked ad categories to communicate upstream */
    blockedAdCategories?: CategoryOpts[];
    /** VAST 4.1: Follow additional wrappers allowed (default: unset) */
    followAdditionalWrappers?: boolean;
    /** VAST 4.1: Allow multiple ads in response */
    allowMultipleAds?: boolean;
    /** VAST 4.1: Fallback index for waterfall */
    fallbackOnNoAd?: boolean;
}

export interface BuiltAd {
    type: 'InLine' | 'Wrapper';
    id?: string | number;
    sequence?: number;
    /** VAST 4.1: conditional ad — player may skip if not supported */
    conditionalAd?: boolean;
    node: any; // XML node structure
}

export interface VastOpts {
    ads: BuiltAd[];
    errorUrl?: URLString;
}

export interface Vast4Json {
    VAST: {
        '@version': string;
        Ad?: any[];
        Error?: string;
    };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

// Node structure types for XML building
export interface LinearCreativeNode {
    Linear: {
        '@skipoffset'?: string;
        Duration: string;
        VideoClicks?: {
            ClickThrough?: string;
            ClickTracking?: string[];
            CustomClick?: string[];
        };
        TrackingEvents?: {
            Tracking: Array<{
                '@event': string;
                '@offset'?: string;
                '#text': string;
            }>;
        };
        MediaFiles: {
            MediaFile: Array<{
                '@delivery': string;
                '@type': string;
                '@width': number;
                '@height': number;
                '@bitrate'?: number;
                '@minBitrate'?: number;
                '@maxBitrate'?: number;
                '@scalable'?: boolean;
                '@maintainAspectRatio'?: boolean;
                '@codec'?: string;
                '#text': string;
            }>;
        };
    };
}

export interface NonLinearCreativeNode {
    NonLinearAds: {
        NonLinear: Array<{
            '@width': number;
            '@height': number;
            '@minSuggestedDuration'?: string;
            StaticResource?: {
                '@creativeType': string;
                '#text': string;
            };
            IFrameResource?: string;
            HTMLResource?: string;
            NonLinearClickThrough?: string;
            NonLinearClickTracking?: string[];
        }>;
    };
}
