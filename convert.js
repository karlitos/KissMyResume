const converter = require('fresh-jrs-converter');
const { getResumeType, RESUME_TYPE_JSON, RESUME_TYPE_FRESH, RESUME_TYPE_UNKNOWN } = require('./validate');

const convertToJsonResume  = (resume) => {
	const resumeType = getResumeType(resume);
	if ( resumeType === RESUME_TYPE_JSON || resumeType === RESUME_TYPE_UNKNOWN ) {
		throw new Error('Cannot convert Json-resume or unsupported resume type to Json-resume!')
	}
	return converter.toJSR(resume);
};

const convertToFreshResume  = (resume) => {
	const resumeType = getResumeType(resume);
	if ( resumeType === RESUME_TYPE_FRESH || resumeType === RESUME_TYPE_UNKNOWN ) {
		throw new Error('Cannot convert FRESH resume or unsupported resume type to FRESH resume!')
	}
	return converter.toFRESH(resume);
};

module.exports = {
	convertToJsonResume,
	convertToFreshResume,
};
