import got from 'got';
import * as path from 'path';
import * as fs from 'fs';
// @ts-ignore
import { app } from 'electron';
import { IThemeEntry } from '../definitions';
// @ts-ignore
import { PluginManager } from 'live-plugin-manager';
// @ts-ignore
import DEFAULT_THEME from 'jsonresume-theme-flat';
export const DEFUALT_THEME_NAME = 'jsonresume-theme-flat';

const blacklistedThemes = require('./blacklisted-themes.json');

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/';
const NPM_SEARCH_QUERY = 'jsonresume-theme-';
const NPM_SEARCH_SIZE = 250;

const localThemesPath = path.resolve(app.getPath('appData'), app.getName(), 'themes');
const pluginManager = new PluginManager({
            pluginsPath: localThemesPath,
            staticDependencies: {
                fs: require('fs'),
                path: require('path'),
                util: require('util'),
                os: require('os'),
                events: require('events'),
                assert: require('assert'),
            }
        });


/**
 * For NPM API docs see https://api-docs.npms.io/
 */
export const getThemeList  = async () => {
    try {
        const response: Record<string, any> = await got(`${NPM_REGISTRY_URL}-/v1/search`,
            {
                searchParams: {
                    text: `${NPM_SEARCH_QUERY}-*`,
                    size: NPM_SEARCH_SIZE,
                },
            }).json();

        let localThemesList: string[] = [];
        if (fs.existsSync(localThemesPath)) {
            // update the localThemesList value
            localThemesList =  fs.readdirSync(localThemesPath, { withFileTypes: true })
                .filter(dir => dir.isDirectory() && dir.name.includes(NPM_SEARCH_QUERY) ).map(dir => dir.name);
        } else { // create the theme directory when not present
            fs.mkdirSync(localThemesPath);
        }

        // return mapped results or empty array
        const themeList = !!response && !!response.objects ?  response.objects.reduce((result: Array<any>, pkg: Record<string, any>) => {
            if (pkg.package.name.includes(NPM_SEARCH_QUERY) && !blacklistedThemes.includes(pkg.package.name)) {
                result.push( {
                    name: pkg.package.name,
                    description: pkg.package.description,
                    version: pkg.package.version,
                    downloadLink: `${NPM_REGISTRY_URL}${pkg.package.name}/-/${pkg.package.name}-${pkg.package.version}.tgz`,
                    present: pkg.package.name === DEFUALT_THEME_NAME || localThemesList.includes(pkg.package.name)  ? true : false,
                });
            }
            return result;
        }, []) : [];
        // return a resolved promise
        return Promise.resolve(themeList)
    } catch (err) {
        // in case of an error return a rejected Promise
        return Promise.reject(err);
    }
};

/**
 * This is the method responsible for the actual theme retrieval. We retrieve the theme - actual a NPM package - with
 * help of the 'live-plugin-manager'. The pluginManager.install call fetch the theme with all its dependencies from NPM.
 * @param theme {IThemeEntry} The theme which should be fetched from NPM - we use the name-property as identifier.
 */
export const fetchTheme = async (theme: IThemeEntry) => {
    try {
        await pluginManager.install(theme.name);
    } catch (err) {
        return Promise.reject(err)
    }
};

/**
 *
 */
export const getLocalTheme = async (theme: IThemeEntry) => {
    try {
        if (!!theme) {
            // Wee need to call the install method even for cached packages, so the require method works whenever we
            // switch to a new theme. See https://github.com/davideicardi/live-plugin-manager/issues/18
            await pluginManager.install(theme.name);
            return await pluginManager.require(theme.name);
        }
        // return default theme when no theme specified
        return DEFAULT_THEME;
    } catch (err) {
        return Promise.reject(err)
    }
};
