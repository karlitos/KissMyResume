import React,  { useState, useRef, Fragment } from 'react';
import 'bootstrap3/dist/css/bootstrap.min.css';
import Form from '@rjsf/core';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json'
import Ajv from 'ajv';
import JSON_RESUME_SCHEMA from '../schemes/json-resume-schema_0.0.0.json'
import { VALID_INVOKE_CHANNELS, CvDataReturnVal } from './definitions'

// read https://github.com/async-library/react-async
export default function App()
{
    const [schema , setSchema] = useState(JSON_RESUME_SCHEMA as Record<string, any>);
    const [cvData, setCvData] = useState({});
    const log = (type: any) => console.log.bind(console, type);
    const cvForm = useRef<Form<{}>>(null);

    // const ajv = new Ajv();
    // const validate = ajv.compile(schema);

    const handleOpenCvButtonClick = () => {
        window.api.invoke(VALID_INVOKE_CHANNELS['open-cv'], {foo: 'bar'}).then((result: CvDataReturnVal) => {
            if (result.success) {
                // console.log('New Form Data', result.data);
                setCvData(result.data);
            }
        }).catch((err: PromiseRejectionEvent) => {
            // display a warning ...TBD
            // console.error('REJECTION', err);
        });
    };

    // Make react-jsonschema-form controlled component
    const handleFormDataChange = (formData: Record<string, any>) => {
        // setCvData(formData);
    };

    const handleSaveCvButtonClick = () => {
        console.log(cvData);
        cvForm.current.submit();
    };

    return <div>
        <button className='btn btn-info' onClick={handleOpenCvButtonClick}>Open CV</button>
        <button className='btn btn-info' onClick={handleSaveCvButtonClick}>Save CV</button>
		<Form schema={schema}
              formData={cvData}
              additionalMetaSchemas={[metaSchemaDraft04]}
              onChange={handleFormDataChange}
              onSubmit={log("submitted")}
              onError={log("errors")}
              ref={cvForm}>
            {/*workaround to hide the submit button, see https://github.com/rjsf-team/react-jsonschema-form/issues/705*/}
            <Fragment />
        </Form>
    </div>
}
