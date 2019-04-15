const jsonResumeValidator = require('resume-schema');
const freshResumeValidator = require('fresh-resume-validator');

const RESUME_TYPE_JSON = 'jrs';
const RESUME_TYPE_FRESH = 'fresh';
const RESUME_TYPE_UNKNOWN = 'unk';

const getResumeType = (resume) => {
	if (resume.meta && resume.meta.format) { //&& resume.meta.format.substr(0, 5).toUpperCase() == 'FRESH'
		return RESUME_TYPE_FRESH;
	} else if (resume.basics) {
		return RESUME_TYPE_JSON;
	} else {
		return RESUME_TYPE_UNKNOWN;
	}
};

const isValidJsonResume = (resume) => {
	return jsonResumeValidator.validate(resume);
};

const isValidFreshResume = (resume) => {
	const result = freshResumeValidator.isValid(resume);

	console.log('result', result);

	return result;
	/*
	if (freshResumeValidator.isValid(resume)) {
		return true
	} else {
		console.log(freshResumeValidator.lastError);
		return false;
	}
	*/
};

const isValidResume = (resume) => {
	if (getResumeType(resume) === RESUME_TYPE_UNKNOWN) {
		return false;
	}

	return isValidJsonResume(resume) || isValidFreshResume(resume);
};


module.exports = {
	RESUME_TYPE_JSON,
	RESUME_TYPE_FRESH,
	RESUME_TYPE_UNKNOWN,
	getResumeType,
	isValidJsonResume,
	isValidFreshResume,
	isValidResume
};
