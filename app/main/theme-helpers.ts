import got from 'got';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { IThemeEntry } from '../definitions';
import { promisify } from 'util';
import { pipeline } from 'stream';
// @ts-ignore
import tar from 'tar';

export const DEFUALT_THEME_NAME = 'jsonresume-theme-flat';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/';
const NPM_SEARCH_QUERY = 'jsonresume-theme';
const NPM_SEARCH_SIZE = 250;

const promisifiedPipeline = promisify(pipeline);
const localThemesPath = path.resolve(app.getPath('appData'), app.getName(), 'themes');

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
            if (pkg.package.name.includes(NPM_SEARCH_QUERY)) {
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
 *
 * @param theme
 */
export const fetchTheme = async (theme: IThemeEntry) => {
    try {
        const themePath =  path.resolve(localThemesPath,theme.name);

        if (fs.existsSync(themePath)) {
            // remove the content of the directory when present
            fs.rmdirSync(themePath, { recursive: true })
        }
        // create the theme directory
        fs.mkdirSync(themePath);

        await promisifiedPipeline(
            got.stream(theme.downloadLink),
            tar.extract({ cwd: themePath, strip: 1})
        );
    } catch (err) {
        return Promise.reject(err)
    }
};
