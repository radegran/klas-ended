var Strings =
{
	"NoDocumentFound": {
		"en": "Could not find any document for this address.",
		"sv": "Kunde inte hitta något dokument för den här adressen."
	}
};

var getTranslator = function(expressRequest)
{
	var lang = (expressRequest.acceptsLanguage("sv") || expressRequest.acceptsLanguage("sv-SE")) ? "sv" : "en";
	
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

module.exports.getTranslator = getTranslator;
