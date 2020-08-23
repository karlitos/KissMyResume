import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {INotification, IThemeEntry, VALID_INVOKE_CHANNELS} from "../../definitions";

export const useThemeList = (): [INotification, IThemeEntry[], Dispatch<SetStateAction<any>>] =>  {
    const [themeList, setThemeList] = useState([]);
    let err: INotification = null;

    useEffect(() => {
        const fetchThemeList = async () => {
            try {
                // set result as theme list
                setThemeList( await window.api.invoke(VALID_INVOKE_CHANNELS['get-theme-list']));
            } catch (e) {
                // pass the exception message as a warning-type notification
                err = { type: 'warning', text: e.message }

            }
        };
        // calling async functions in useEffect prevents warnings, see: https://www.robinwieruch.de/react-hooks-fetch-data
        fetchThemeList();
    }, []);

    return [err, themeList, setThemeList];
};
