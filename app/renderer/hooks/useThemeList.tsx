import { useState, useEffect } from 'react';
import ky from 'ky';

const NPM_REGISTRY_URL = 'https://registry.npmjs.org/';
const NPM_SEARCH_QUERY = 'jsonresume-theme';
const NPM_SEARCH_SIZE = 250;

export const useThemeList = (): any[] =>  {
    const [themeList, setThemeList] = useState([]);

    useEffect(() => {
        const fetchThemeList = async () => {
            try {
                const response: Record<string, any> = await ky(`${NPM_REGISTRY_URL}-/v1/search`,
                    {
                        searchParams: {
                            text: `${NPM_SEARCH_QUERY}-*`,
                            size: NPM_SEARCH_SIZE,
                        },
                    }).json();

                // return mapped results or empty array
                const mappedResults = !!response && !!response.objects ?  response.objects.reduce((result: Array<any>, pkg: Record<string, any>) => {
                    if (pkg.package.name.includes(NPM_SEARCH_QUERY)) {
                        result.push( {
                            name: pkg.package.name,
                            description: pkg.package.description,
                            version: pkg.package.version,
                            downloadLink: `${NPM_REGISTRY_URL}${pkg.package.name}/-/${pkg.package.name}-${pkg.package.version}.tgz`
                        });
                    }
                    return result;
                }, []) : [];
                // set theme list as result
                setThemeList(mappedResults)
            } catch (error) {
                // Send an error to the renderer - TBD
                console.log(error);
            }
        };
        // calling async functions in useEffect prevents warnings, see: https://www.robinwieruch.de/react-hooks-fetch-data
        fetchThemeList();
    }, []);

    return themeList;
};
