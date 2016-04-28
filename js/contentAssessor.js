var Assessor = require( "./assessor.js" );

var fleschReadingEase = require( "./assessments/fleschReadingEaseAssessment.js" );
var paragraphTooLong = require( "./assessments/paragraphTooLongAssessment.js" );
var paragraphTooShort = require( "./assessments/paragraphTooShortAssessment.js" );
var sentenceLengthInText = require( "./assessments/sentenceLengthInTextAssessment.js" );
var sentenceLengthInDescription = require( "./assessments/sentenceLengthInDescriptionAssessment.js" );
var subHeadingLength = require( "./assessments/getSubheadingLengthAssessment.js" );
var subheadingPresence = require( "./assessments/subheadingPresenceAssessment.js" );

/**
 * Creates the Assessor
 *
 * @param {object} i18n The i18n object used for translations.
 * @constructor
 */
var ContentAssessor = function( i18n ) {
	Assessor.call( this, i18n );
	this._assessments = {
		fleschReadingEase:           fleschReadingEase,
		paragraphTooLong:            paragraphTooLong,
		paragraphTooShort:           paragraphTooShort,
		subHeadingLength:            subHeadingLength,
		subheadingPresence:          subheadingPresence,
		sentenceLengthInText:        sentenceLengthInText,
		sentenceLengthInDescription: sentenceLengthInDescription
	};
};

module.exports = ContentAssessor;

require( "util" ).inherits( module.exports, Assessor );

