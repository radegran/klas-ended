var Strings =
{
	"NoDocumentFound": {
		"en": "Could not find any document for this address.",
		"sv": "Kunde inte hitta något dokument för den här adressen."
	},
	"UnknownErrorReloadPage": {
		"en": "Ooops! An error has occurred... Reloading the page soon!",
		"sv": "Ooops! Ett fel har inträffat... Laddar strax om sidan!"
	},
	"ShouldGive": {
		"en": "should give",
		"sv": "ska ge"
	},
	"To": {
		"en": "to",
		"sv": "till"
	},
	"SomeoneMadeAChangeTryAgain": {
		"en": "Someone has made a change, please try again.",
		"sv": "Någon har gjort en ändring, försök igen."
	},
	"AllChangesAreSaved": {
		"en": "All changes are saved to the link in the address bar!",
		"sv": "Alla ändringar sparas till länken i adressfältet!"
	},
	"Saving": {
		"en": "Saving ...",
		"sv": "Sparar ..."
	},
	"CouldNotCreateDocument": {
		"en": "Could not create the document!",
		"sv": "Kunde inte skapa dokumentet!"
	},
	"OfflineMode": {
		"en": "Offline mode!",
		"sv": "Offlineläge!"
	},
	"OnlineMode": {
		"en": "Back online!",
		"sv": "Online igen!"
	},
	"StartData": {
		"en": {
			"title": "Type a title here",
			"names": ["Claude", "Gary", "Betty"],
			"payments": [
				{"text": "Example 1 - Betty buys pizza for everyone", "values": [0, 0, 30]},
				{"text": "Example 2 - Gary buys drinks for himself and Betty", "values": [null, 29, 0]},
				{"text": "Example 3 - Claude gives 40 to Gary", "values": [40, -40, null]}
			]
		},
		"sv": {
			"title": "Skriv en titel här",
			"names": ["Klas", "Göran", "Berit"],
			"payments": [
				{"text": "Exempel 1 - Berit köper pizza till allihop", "values": [0, 0, 210]},
				{"text": "Exempel 2 - Göran köper öl till sig själv och Berit", "values": [null, 140, 0]},
				{"text": "Exempel 3 - Klas ger 100 kr till Göran", "values": [100, -100, null]}
			]
		},
	}
};

var getLang = function(ereq)
{
	return (ereq.acceptsLanguage("sv") || ereq.acceptsLanguage("sv-SE") || ereq.acceptsLanguage("sv-se")) ? "sv" : "en";
};

var getTranslator = function(expressRequest)
{
	var lang = getLang(expressRequest);
	
	return function(key)
	{
		var strings = Strings[key];
		
		if (!strings)
		{
			var err = "[OOPS:" + key + "]";
			console.log(err);
			return err;
		}
		
		var text = strings[lang] || strings["en"];
		
		if (text === undefined)
		{
			var err = "[OOPS:" + lang + ":" + key + "]";
			console.log(err);
			return err;			
		}
		
		return text;
	};
};

var allStrings = function(expressRequest)
{
	var lang = getLang(expressRequest);
	
	var all = {};
	
	for (key in Strings)
	{
		if (Strings.hasOwnProperty(key))
		{
			all[key] = Strings[key][lang];
		}
	}
	
	return all;
};

module.exports.getTranslator = getTranslator;
module.exports.allStrings = allStrings;
