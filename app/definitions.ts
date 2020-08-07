// Fixes the typescript errors cause by having the api property on the window object
declare global {
    interface Window {
        api: Record<string, any>;
    }
}

// The enum keys and values has to be same, otherwise the reverse lookup and the 'in' operator won't work
export enum VALID_INVOKE_CHANNELS {
    'open-cv' = 'open-cv'
}

export interface CvDataReturnVal {
    success: boolean;
    data: null | Record<string, any>;
}
