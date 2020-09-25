import React,  { useState, useRef, Fragment, ChangeEvent } from 'react';
import Form, {IChangeEvent, ISubmitEvent} from '@rjsf/core';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json'
import JSON_RESUME_SCHEMA from '../../../../schemes/json-resume-schema_0.0.0.json'
import { VALID_INVOKE_CHANNELS, INotification, IThemeEntry } from '../../../definitions'
import styles from './App.css'
import { useThemeList } from '../../hooks/useThemeList';

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
    const [selectedThemeIndex, setSelectedThemeIndex] = useState(null);
    const [selectedFormatsForExport, setSelectedFormatsForExport] = useState({
       pdf: true,
       png: false,
       html: false,
       docx: false,
    } as Record<string, any>);
    const [fetchingThemeInProgress, setFetchingThemeInProgress] = useState(false);
    const [processingThemeInProgress, setProcessingThemeInProgress] = useState(false);
    const [exportCvAfterProcessing, setExportCvAfterProcessing] = useState(false);
    const [saveCvDataInProgress, setSaveCvDataInProgress] = useState(false);
    // The ref to the Form component
    const cvForm = useRef<Form<{}>>(null);

    // Logging helper
    const log = (type: any) => console.log.bind(console, type);

    /**
     * Handler for loading CV data. Uses the defined API invoke call on the open-cv chanel. Returns JSON data which is
     * then manually validated against the current schema of the Form.
     */
    const handleOpenCvButtonClick = () => {
        window.api.invoke(VALID_INVOKE_CHANNELS['open-cv']).then((result: null | Record<string, any>) => {
            if (result) {
                const { errorSchema, errors } = cvForm.current.validate(result, schema, [metaSchemaDraft04]);
                if (errors && errors.length) {
                    setNotifications([...notifications, {type: 'warning', text: `${errors.length} validations errors found in the loaded data.`}])
                }
                setCvData(result);
            }
        }).catch((err: PromiseRejectionEvent) => {
            // display a warning ...TBD
            setNotifications([...notifications, {type: 'danger', text: `Opening of CV data failed: ${err}`}])
        })
    };

    /**
     * Form-data-change handler making react-jsonschema-form controlled component.
     * @param changeEvent {IChangeEvent} The rjsf-form change event
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
     * Checkbox change-handler updating the state of the selected output formats
     * @param evt {HTMLInputElement} The change event of the checkbox
     */
    const handleFormatsForExportChange = (evt: ChangeEvent<HTMLInputElement>) => {
        // ignore the setter in case of undefined or other monkey business
        if (typeof selectedFormatsForExport[evt.target.name] === "boolean") {
            const newSelectedFormatsForExportState = { ...selectedFormatsForExport, [evt.target.name]: evt.target.checked };
            // Do not allow unselecting all formats
            if (Object.keys(newSelectedFormatsForExportState).every((k) => !newSelectedFormatsForExportState[k])) {
                setNotifications([...notifications, {type: 'warning', text: 'At least one format must be selected for export!'}]);
                return;
            }
            setSelectedFormatsForExport({...selectedFormatsForExport, [evt.target.name]: evt.target.checked})
        }
    };

    /**
     * Click-handler for the Export-cv-button which triggers the CV export.
     */
    const handleExportCvButtonClick = () => {
        // set the export-after-processing flag to true
        setExportCvAfterProcessing(true);
        cvForm.current.submit();
    };

    /**
     * Click-handler for the Save-cv-data-button which triggers the cv data save invocation.
     */
    const handleSaveCvDataClick  = () => {
        setSaveCvDataInProgress(true);
        window.api.invoke(VALID_INVOKE_CHANNELS['save-cv'], cvData).then(() => {
            // TODO: notification
        }) .catch((err: PromiseRejectionEvent) => {
            // display a warning ...TBD
            setNotifications([...notifications, {type: 'danger', text: `Saving of CV data failed: ${err}`}])
        }).finally(() => {
            // set the state of fetching-state-in-progress to false
            setSaveCvDataInProgress(false);
        });
    };

    /**
     * Theme-list-change handler
     */
    const handleSelectThemeChange = (themeIndex: number) => {
        if (fetchingThemeInProgress) {
            return
        }
        // update state
        setSelectedThemeIndex(themeIndex);
        const selectedTheme = themeList[themeIndex];
        // download the theme if not present yet
        if (!selectedTheme.present) {
            // set the state of fetching-state-in-progress to true
            setFetchingThemeInProgress(true);
            window.api.invoke(VALID_INVOKE_CHANNELS['fetch-theme'], selectedTheme)
            .then(() => {
                themeList[themeIndex]['present'] = true;
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
     *
     */
    const createLabelForThemeSelector = () => {
        if (selectedThemeIndex === null) {
            return  'Select theme, default: jsonresume-theme-flat - A theme for JSON Resume';
        }
        const theme = themeList[selectedThemeIndex];
        // Note the explicit unicode white-space characters after the emoji characters*/}
        return `${theme.present ? '✅ ' : '📥 '} ${theme.name} ${theme.description ? '- ' : '' }${theme.description}`
    };

    /**
     * The submit-event handler.
     */
    const handleFormSubmit = (submitEvent: ISubmitEvent<any>) => {
        const selectedTheme = themeList[selectedThemeIndex];
        // set the state of processing-state-in-progress to true
        setProcessingThemeInProgress(true);
        window.api.invoke(VALID_INVOKE_CHANNELS['process-cv'], submitEvent.formData, selectedTheme, selectedFormatsForExport, exportCvAfterProcessing )
        .then((markup: string) => {
            // TODO: success notification
        }).catch((err: PromiseRejectionEvent) => {
            // display a warning notification
            setNotifications([...notifications, {type: 'danger', text: `Processing of CV data failed: ${err}`}])
        }).finally(() => {
            // set the state of fetching-state-in-progress to false
            setProcessingThemeInProgress(false);
            // set the export-after-processing flag to false
            setExportCvAfterProcessing(false);
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
                    <button className='btn btn-success pull-right'
                            onClick={handleExportCvButtonClick}
                            disabled={fetchingThemeInProgress || processingThemeInProgress}>
                        Export CV
                    </button>
                    <div className="btn-group pull-right" role="group">
                        <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown"
                                aria-haspopup="true" aria-expanded="false">
                            Select output formats
                            <span className="caret"></span>
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" name="pdf" onChange={handleFormatsForExportChange}
                                                  checked={selectedFormatsForExport['pdf']}/>
                                        Document PDF
                                    </label>
                                </div>
                            </li>
                            <li>
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" name="png" onChange={handleFormatsForExportChange}
                                               checked={selectedFormatsForExport['png']}/>
                                        Image PNG
                                    </label>
                                </div>
                            </li>
                            <li>
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" name="html" onChange={handleFormatsForExportChange}
                                               checked={selectedFormatsForExport['html']}/>
                                        Website HTML
                                    </label>
                                </div>
                            </li>
                            <li>
                                <div className="checkbox">
                                    <label>
                                        <input type="checkbox" name="docx" onChange={handleFormatsForExportChange}
                                               checked={selectedFormatsForExport['docx']}/>
                                        Word DOCX
                                    </label>
                                </div>
                            </li>
                        </ul>
                    </div>
                    <button className='btn pull-right'
                            onClick={handleSaveCvDataClick}
                            disabled={saveCvDataInProgress}>
                        Save CV data
                    </button>
                </div>
                <div className="btn-group full-width" role="group">
                    <button type="button" className={`btn btn-default btn-block dropdown-toggle force-text-left
                            ${fetchingThemeInProgress ? 'running-stripes' : ''}`}  data-toggle="dropdown"
                            disabled={fetchingThemeInProgress} aria-haspopup="true" aria-expanded="false">
                        {createLabelForThemeSelector()}
                        <span className="caret caret-right"></span>
                    </button>
                    <ul className={`${styles['theme-list-container']} dropdown-menu`}>
                        {
                            themeList.map((theme: IThemeEntry, index: number) =>
                                // Note the explicit unicode white-space characters after the emoji characters
                                <li className={styles['theme-list-entry']}  key={index} onClick={handleSelectThemeChange.bind(this, index)}>
                                    {theme.present ? '✅ ' : '📥 '} {theme.name} {theme.description ? '- ' : '' }{theme.description}
                                </li>
                            )
                        }
                    </ul>
                </div>
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
