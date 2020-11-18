import passiveVoice from "../../src/researches/getPassiveVoice.js";
import Paper from "../../src/values/Paper.js";

describe( "detecting passive voice in sentences", function() {
	it( "returns active voice (present)", function() {
		var paper = new Paper( "Yalmát eszem.", { locale: "hu_HU" } );
		expect( passiveVoice( paper ).passives.length ).toBe( 0 );
	} );

	it( "returns passive voice (infinitive)", function() {
		// Passive: Be van fejezve.
		var paper = new Paper( "Una manzana be van fejezve.", { locale: "hu_HU" } );
		expect( passiveVoice( paper ).passives.length ).toBe( 1 );
	} );
} );
