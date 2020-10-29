// Fixes the typescript errors cause by having the api property on the window object
declare global {
    interface Window {
        api: Record<string, any>;
    }
}

// The enum keys and values has to be same, otherwise the reverse lookup and the 'in' operator won't work
export enum VALID_INVOKE_CHANNELS {
    'open-cv' = 'open-cv',
    'process-cv' = 'process-cv',
    'save-cv' = 'save-cv',
    'get-theme-list' = 'get-theme-list',
    'fetch-theme' = 'fetch-theme',
    'uninstall-theme' = 'uninstall-theme',
}

export interface INotification {
    type: 'success' | 'info' | 'warning' | 'danger';
    text: string;
}

export interface IThemeEntry {
    name: string ,
    description: string,
    version: string,
    downloadLink: string,
    present: boolean,
}
