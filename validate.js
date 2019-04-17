const jsonResumeSchema = require('./schemes/json-resume-schema_0.0.0');
const freshResumeSchema = require('./schemes/fresh-resume-schema_1.0.0-beta');
const ZSchema = require('z-schema');
const { logInfo, logSuccess, logError } = require('./log');

// TODO: consider normalizing error messages from Z-Schema
// https://github.com/dschenkelman/z-schema-errors

const RESUME_TYPE_JSON = 'jrs';
const RESUME_TYPE_FRESH = 'fresh';
const RESUME_TYPE_UNKNOWN = 'unk';

const validator = new ZSchema({ breakOnFirstError: false	});

const getResumeType = (resume) => {
	if (resume.meta && resume.meta.format) { //&& resume.meta.format.substr(0, 5).toUpperCase() == 'FRESH'
		return RESUME_TYPE_FRESH;
	} else if (resume.basics) {
		return RESUME_TYPE_JSON;
	} else {
		return RESUME_TYPE_UNKNOWN;
	}
};

const validateJsonResume = (resume) => {
	const valid = validator.validate(resume, jsonResumeSchema);
	if (!valid) {
		logInfo('--- Your resume contains errors ---');
		for (const validationError of validator.getLastErrors()) {
			logError(`#    ${validationError.message} in ${validationError.path}`);
		}
	} else {
		logSuccess('Valid resume in Json-resume format.')
	}

};


const validateFreshResume = (resume) => {
	const valid = validator.validate(resume, freshResumeSchema);
	if (!valid) {
		logInfo('--- Your resume contains errors ---');
		for (const validationError of validator.getLastErrors()) {
			logError(`#    ${validationError.message} in ${validationError.path}`);
		}
	} else {
		logSuccess('Valid resume in FRESH format.')
	}
};


module.exports = {
	RESUME_TYPE_JSON,
	RESUME_TYPE_FRESH,
	RESUME_TYPE_UNKNOWN,
	getResumeType,
	validateResume: (resume, type) => {
			if (type === RESUME_TYPE_JSON) {
				validateJsonResume(resume);
			} else if (type === RESUME_TYPE_FRESH) {
				validateFreshResume(resume)
			} else {
				throw new Error('Unsupported resume type!')
			}
	},
};
