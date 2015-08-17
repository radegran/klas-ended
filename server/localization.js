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
	"AddPersonsFirst": {
		"en": "First add some persons",
		"sv": "Lägg först till några personer"
	},
	"AddPersonsHere": {
		"en": "Add persons here",
		"sv": "Lägg till personer här"
	},
	"AddPaymentsHere": {
		"en": "Add payments here",
		"sv": "Lägg till betalningar här"
	},
	"PreviousPayments": {
		"en": "Previous payments",
		"sv": "Tidigare betalningar"
	},
	"Paid": {
		"en": "Paid",
		"sv": "Betalat"
	},
	"ShouldPaid": {
		"en": "Should paid",
		"sv": "Borde betalat"
	},
	"DescribePayment": {
		"en": "Describe the payment",
		"sv": "Beskriv betalningen"
	},
	"WhoAffected": {
		"en": "Who are affected?",
		"sv": "Vilka berörs av betalningen?"
	},
	"HowMuchPeoplePaid": {
		"en": "How much have people paid?",
		"sv": "Hur mycket har folk betalat?"
	},
	"HowMuchPeopleShouldPaid": {
		"en": "How much should people have paid?",
		"sv": "Hur mycket borde folk betalat?"
	},
	"Summary": {
		"en": "Summary",
		"sv": "Sammanfattning"
	},
	"Remove": {
		"en": "Remove",
		"sv": "Ta bort"
	},
	"MakeEven": {
		"en": "How to make even",
		"sv": "Bli kvitt såhär"
	},
	"Name": {
		"en": "Name",
		"sv": "Namn"
	},
	"Help": {
		"en": "Help",
		"sv": "Hjälp"
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
	"ThankYou": {
		"en": "Thank you!",
		"sv": "Tack!"
	},
	"SubmitFeedback": {
		"en": "Submit feedback",
		"sv": "Skicka kommentar"
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
	"HelpHeader1": {
		"en": "How do I remove an expense or a person?",
		"sv": "Hur tar jag bort en utgift eller en person?"
	},
	"HelpText1": {
		"en": "Erase the expense description or the name.",
		"sv": "Sudda ut utgiftsbeskrivning eller namnet."
	},
	"HelpHeader2": {
		"en": "If a person is not affected by an expense?",
		"sv": "Om en person inte berörs av en utgift?"
	},
	"HelpText2": {
		"en": "Erase the number in that cell.",
		"sv": "Sudda ut siffran i den cellen."
	},
	"HelpHeader3": {
		"en": "How do I save?",
		"sv": "Hur sparar jag?"
	},
	"HelpText3": {
		"en": "All changes are saved automatically. Just copy the link in the address bar, it takes you or others to this page.",
		"sv": "Allt sparas automatiskt. Kopiera bara länken i adressfältet, den tar dig eller andra till just den här sidan."
	},
	"HelpHeader4": {
		"en": "What if I don't have an internet connection?",
		"sv": "Om jag inte har något internet?"
	},
	"HelpText4": {
		"en": "You can add an expense in offline mode, it's saved onto your phone/computer. When you get online everything is synchronized in the cloud.",
		"sv": "I offlineläge kan du lägga till nya utgifter som sparas på din telefon/dator. När du går online synkas allt och blir synligt för omvärlden."
	},
	"HelpHeader5": {
		"en": "Is there an app to download?",
		"sv": "Finns någon app att ladda hem?"
	},
	"HelpText5": {
		"en": "Open this page on your phone and add it to the home screen.",
		"sv": "Öppna sidan på telefonen och lägg till den på hemskärmen."
	},
	"ExampleEmail": {
		"en": "mail@domain.com",
		"sv": "mail@domän.com"
	},
	"StartData": {
		"en": {
			"title": "Enter a title here",
			"names": [],
			"payments": []
		},
		"sv": {
			"title": "Skriv en titel här",
			"names": [],
			"payments": []
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
