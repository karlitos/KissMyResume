const converter = require('fresh-jrs-converter');

const convertToJsonResume  = (resume) => {
	return converter.toFRESH(resume);
};

const convertToFreshResume  = (resume) => {
	converter.toJRS(resume);
};
