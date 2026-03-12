export type URLString = string;

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
    | 'progress';

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
}

export interface LinearCreativeOpts {
    duration: string; // "HH:MM:SS"
    skipoffset?: string; // enables skippable
    tracking?: TrackingEvent[];
    clicks?: Clicks;
    mediaFiles: MediaFile[];
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
    // companions?: CompanionCreativeOpts;
}

export interface InlineAdOpts {
    id?: string | number;
    title: string;
    adSystem?: string;
    impressions: URLString[];
    errorUrls?: URLString[];
    creatives: Creative[];
    adVerifications?: AdVerificationOpts[];
    // Custom telemetry embedded into <Extensions>
    customTelemetryJson?: unknown;
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
    customTelemetryJson?: unknown;
}

export interface BuiltAd {
    type: 'InLine' | 'Wrapper';
    id?: string | number;
    sequence?: number;
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
