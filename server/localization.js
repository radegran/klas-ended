var Strings =
{
	"NoDocumentFound": {
		"en": "Could not find the document.",
		"sv": "Kunde inte hitta dokumentet."
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
		"en": "How much did stuff really cost?",
		"sv": "Hur mycket kostade folks grejer?"
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
		"sv": "Skriv namn här"
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
		"en": "All changes are saved to the link in the address bar.",
		"sv": "Alla ändringar sparas till länken i adressfältet."
	},
	"Saving": {
		"en": "Saving ...",
		"sv": "Sparar ..."
	},
	"ThankYou": {
		"en": "Thank you",
		"sv": "Tack"
	},
	"SubmitFeedback": {
		"en": "Submit feedback",
		"sv": "Skicka kommentar"
	},
	"CouldNotCreateDocument": {
		"en": "Could not create the document!",
		"sv": "Kunde inte skapa dokumentet!"
	},
	"Welcome1": {
		"en": "Click on the button to get started with your own payment list.",
		"sv": "Klicka på knappen för att komma igång med en egen betalningslista."
	},
	"Welcome2": {
		"en": "Then, don't forget to copy the link in the address bar or add the page to your mobile's home screen to get back.",
		"sv": "Glöm inte att sedan kopiera länken eller lägg till sidan på mobilens hemskärm för att återkomma."
	},
	"OfflineMode": {
		"en": "Offline mode - You can add new payments.",
		"sv": "Offlineläge - Du kan lägga till nya betalningar."
	},
	"OnlineMode": {
		"en": "Online!",
		"sv": "Online!"
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
		"en": "your.name@domain.com",
		"sv": "din.mail@domän.com"
	},
	"CommentSample": {
		"en": "Enter questions or comments here and we'll get back to you.",
		"sv": "Skriv frågor eller kommentarer här så återkommer vi snarast."
	},
	"CopyUrlInfo": {
		"en": "Share this link with friends",
		"sv": "Dela den här länken med dina vänner"
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
