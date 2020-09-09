import React,  { useState, useRef, Fragment, ChangeEvent } from 'react';
import Form, {IChangeEvent, ISubmitEvent} from '@rjsf/core';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json'
import JSON_RESUME_SCHEMA from '../../../../schemes/json-resume-schema_0.0.0.json'
import {VALID_INVOKE_CHANNELS, ICvDataReturnVal, INotification, IThemeEntry} from '../../../definitions'
import styles from './App.css'
import { useThemeList } from "../../hooks/useThemeList";

// read https://github.com/async-library/react-async
export default function App()
{
    /**
     * State - Hooks
     */
    const [schema , setSchema] = useState(JSON_RESUME_SCHEMA as Record<string, any>);
    const [cvData, setCvData] = useState({});
    const [notifications, setNotifications] = useState<Array<INotification>>([]);
    const [themeListFetchingError, themeList, setThemeList] = useThemeList();
    // Add the error when theme-list fetching failed to the notifications
    if (themeListFetchingError) {
        setNotifications([...notifications, themeListFetchingError])
    }
    const [fetchingThemeInProgress, setFetchingThemeInProgress] = useState(false);
    const [processingThemeInProgress, setProcessingThemeInProgress] = useState(false);
    const [exportCvAfterProcessing, setExportCvAfterProcessing] = useState(false);
    // The ref to the Form component
    const cvForm = useRef<Form<{}>>(null);
    const themeSelector = useRef<HTMLSelectElement>(null);

    // Logging helper
    const log = (type: any) => console.log.bind(console, type);

    /**
     * Handler for loading CV data. Uses the defined API invoke call on the open-cv chanel. Returns JSON data which is
     * then manually validated against the current schema of the Form.
     */
    const handleOpenCvButtonClick = () => {
        window.api.invoke(VALID_INVOKE_CHANNELS['open-cv']).then((result: ICvDataReturnVal) => {
            if (result.success) {
                const { errorSchema, errors } = cvForm.current.validate(result.data, schema, [metaSchemaDraft04]);
                if (errors && errors.length) {
                    setNotifications([...notifications, {type: 'warning', text: `${errors.length} validations errors found in the loaded data.`}])
                }
                setCvData(result.data);
            }
        }).catch((err: PromiseRejectionEvent) => {
            // display a warning ...TBD
            setNotifications([...notifications, {type: 'danger', text: `Opening of CV data failed: ${err}`}])
        });
    };

    /**
     * Form-data-change handler making react-jsonschema-form controlled component.
     */
    const handleFormDataChange = (changeEvent: IChangeEvent) => {
        setCvData(changeEvent.formData);
    };

    /**
     * Click-handler for the Process-cv-button which triggers the form-submit function programmatically.
     */
    const handleProcessCvButtonClick = () => {
        cvForm.current.submit();
    };

    /**
     * Click-handler for the Export-cv-button which triggers the .
     */
    const handleExportCvButtonClick = () => {
        // set the export-after-processing flag to true
        setExportCvAfterProcessing(true);
        cvForm.current.submit();
    };

    /**
     * Theme-list-change handler
     */
    const handleSelectThemeChange = (evt: ChangeEvent<HTMLSelectElement>) => {
        if (fetchingThemeInProgress) {
            return
        }
        const selectedThemeIndex = parseInt(evt.target.value);
        const selectedTheme = themeList[selectedThemeIndex];
        // download the theme if not present yet
        if (!selectedTheme.present) {
            // set the state of fetching-state-in-progress to true
            setFetchingThemeInProgress(true);
            window.api.invoke(VALID_INVOKE_CHANNELS['fetch-theme'], selectedTheme)
            .then(() => {
                themeList[selectedThemeIndex]['present'] = true;
                // update the theme list
                setThemeList([...themeList]);
            }).catch((err: PromiseRejectionEvent) => {
                // display a warning notification
                setNotifications([...notifications, {type: 'danger', text: `Fetching of theme ${selectedTheme.name} failed: ${err}`}])
            }).finally(() => {
                // set the state of fetching-state-in-progress to false
                setFetchingThemeInProgress(false);
            });
        }
    };

    /**
     * The submit-event handler.
     */
    const handleFormSubmit = (submitEvent: ISubmitEvent<any>) => {
        const selectedTheme = themeList[parseInt(themeSelector.current.value)];
        // set the state of processing-state-in-progress to true
        setProcessingThemeInProgress(true);
        window.api.invoke(VALID_INVOKE_CHANNELS['process-cv'], submitEvent.formData, selectedTheme, exportCvAfterProcessing )
        .then((markup: string) => {
            console.log(markup)
        }).catch((err: PromiseRejectionEvent) => {
            // display a warning notification
            setNotifications([...notifications, {type: 'danger', text: `Processing of CV data failed: ${err}`}])
        }).finally(() => {
            // set the state of fetching-state-in-progress to false
            setProcessingThemeInProgress(false);
            // set the export-after-processing flag to true
            setExportCvAfterProcessing(true);
        });
    };

    return <div className="container-fluid ">
        <div className="row">
            <div className="col-md-8 col-md-push-4 xs-pb-15">
                <span className="glyphicon glyphicon-info-sign float-left xs-pr-5 xs-pt-5" />
                <div className={styles['notification-area']}>
                    {
                        notifications.map((notification: INotification, index: number) =>
                            <div className={`alert alert-slim alert-${notification.type}`} role="alert" key={index}>{notification.text}</div>
                        )
                    }
                </div>
            </div>
            <div className="col-md-4 col-md-pull-8 xs-pb-15">
                <div className="btn-toolbar xs-pb-15" role="toolbar" aria-label="Upper toolbar with buttons">
                    <button className='btn btn-primary' onClick={handleOpenCvButtonClick}>
                        Open CV
                    </button>
                    <button className='btn btn-primary'
                            onClick={handleProcessCvButtonClick}
                            disabled={fetchingThemeInProgress || processingThemeInProgress}>
                        Process CV
                    </button>
                    <button className='btn btn-success'
                            onClick={handleExportCvButtonClick}
                            disabled={fetchingThemeInProgress || processingThemeInProgress}>
                        Export CV
                    </button>
                </div>
                <select className="form-control"
                        defaultValue={'DEFAULT'}
                        disabled={fetchingThemeInProgress}
                        onChange={handleSelectThemeChange}
                        ref={themeSelector}>
                    <option key='0' value="DEFAULT" disabled>Select theme, default: jsonresume-theme-flat - A theme for JSON Resume</option>
                    {
                        themeList.map((theme: IThemeEntry, index: number) =>
                            // Note the explicit unicode white-space characters after the emoji characters
                            <option key={index+1} value={index}>{theme.present ? '✅ ' : '📥 '} {theme.name} - {theme.description}</option>
                        )
                    }
                </select>
            </div>
        </div>
		<Form schema={schema}
              formData={cvData}
              additionalMetaSchemas={[metaSchemaDraft04]}
              onChange={handleFormDataChange}
              onSubmit={handleFormSubmit}
              onError={log("errors")}
              ref={cvForm}>
            {/*workaround to hide the submit button, see https://github.com/rjsf-team/react-jsonschema-form/issues/705*/}
            <Fragment />
        </Form>
    </div>
}
