const fs = require('fs');

const { logInfo, logSuccess } = require('./log');
const { getResumeType, RESUME_TYPE_JSON, RESUME_TYPE_FRESH, RESUME_TYPE_UNKNOWN } = require('./validate');

// Parse the source JSON file
const parseJsonResumeFromSource = (sourcePath) => {
	// do some logging
	logInfo(`Parsing resume file from ${sourcePath}`);

	try {
		const resume = JSON.parse(fs.readFileSync(sourcePath));
		// do some validation
		switch (getResumeType(resume)) {
			case RESUME_TYPE_JSON:
				logSuccess('Succesfully parsed resume in JSON-Resume format.');
				break;
		case RESUME_TYPE_FRESH:
			logSuccess('Succesfully parsed resume in FRESH format.');
			break;
			case RESUME_TYPE_UNKNOWN:
			default:
				throw new Error(`Invalid or unknown resume format detected!`);
		}
		return resume;
	} catch (err) {
		throw new Error(`There was an problem when parsing ${sourcePath}. Reason: ${err}.`);
	}
};

module.exports = {
	parseJsonResumeFromSource,
};
