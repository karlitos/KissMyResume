const fs = require('fs');

const { logInfo, logSuccess } = require('../log');
const { getResumeType, RESUME_TYPE_JSON, RESUME_TYPE_FRESH, RESUME_TYPE_UNKNOWN } = require('./validate');

/**
 * Parse the source JSON file and do some type checking
 * @param sourcePath {string} Source path to the resume to be parsed
 * @param logging {boolean} Whether the method should do any logging or not
 * @returns {{resume: Object, type: (string|*)}} Returns an object containing the parsed resume and its type
 */
const parseResumeFromSource = (sourcePath, logging = true) => {
	// do some logging
	if (logging) logInfo(`Parsing resume file from ${sourcePath}`);

	try {
		const resume = JSON.parse(fs.readFileSync(sourcePath));
		return parseResume(resume, logging)
	} catch (err) {
		throw new Error(`There was an problem when loading ${sourcePath}. Reason: ${err}.`);
	}
};

/**
 * Parse resume data from an object
 * @param resume {Object} The resume data as a object
 * @param logging {boolean} Whether the method should do any logging or not
 * @returns {{resume: Object, type: (string|*)}} Returns an object containing the parsed resume and its type
 */
const parseResume = (resume, logging = true) => {
	try {
		// 	// Do some validation
	const type = getResumeType(resume);
	switch (type) {
		case RESUME_TYPE_JSON:
			if (logging) logSuccess('Succesfully parsed resume in JSON-Resume format.');
			break;
		case RESUME_TYPE_FRESH:
			if (logging) logSuccess('Succesfully parsed resume in FRESH format.');
			break;
		case RESUME_TYPE_UNKNOWN:
		default:
			throw new Error(`Invalid or unknown resume format detected!`);
	}
	return { resume, type, };
	} catch (err) {
		throw new Error(`There was an problem when parsing ${resume}. Reason: ${err}.`);
	}
};

module.exports = {
	parseResumeFromSource,
	parseResume,
};
