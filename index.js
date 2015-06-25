$(document).ready(function() 
{
	var welcomeText = function(text) { return $("<span/>").css("display", "block").text(text); };
	
	var $welcome = $("<div/>").addClass("welcome").append(
		welcomeText("Dela lika").css({"font-size": "2.1em", "margin-bottom": "0.5em"}),
		welcomeText("Det ska va riktigt lätt att dela upp utgifter."),
		welcomeText("Och det blir inte lättare än så här."),
		welcomeText("Prova först själv här nere, klicka sen på"),
		welcomeText("gröna knappen och börja dela lika på riktigt!")
	);
	var $table = $("<table>");
	var $header = $("<div/>");
	
	addToCenter($welcome);
	addToCenter($header);
	addToCenter($table);

	var data = {
		"title": "",
		"names": ["Klas", "Göran", "Berit"],
		"payments": [
			{"text": "Berit köper pizza till allihop", "values": [0, 0, 210]},
			{"text": "Göran köper öl till sig själv och Berit", "values": [null, 140, 0]},
			{"text": "Överföring från Klas till Göran", "values": [100, -100, null]}
		]
	};

	var t;
	var model = Model(data, function(newdata) { t.update(newdata); });

	t = Table($header, $table, model);
	t.update(data);
	
	var buttonCss = function(color) {
		var css = {
			"margin-top": "15px",
			"padding": "10px",
			"cursor": "pointer"
		};
		
		if (color) css["background-color"] = color;
		return css;
	};
	
	// "Ok, I get it!"
	var $iGetIt = $("<div/>")
		.css(buttonCss("lightgreen"))
		.text("Okej, jag fattar!");
	
	$iGetIt.on("click", function()
	{
		$.ajax({
			type: "POST",
			url: "/create",
			data: JSON.stringify({}),
			contentType: "application/json",
			success: function(d) 
			{ 
				window.location.href = "/" + d.url; 
			}
		});
	});
	
	// Read more ...
	var $readMore = $("<div/>")
		.css(buttonCss())
		.addClass("yellow")
		.text("Hur gör man ..?");
	
	$readMore.one("click", function()
	{
		$(this).css("cursor", "");
	
		var info = function(whatText, howText) 
		{ 
			var $div = $("<div/>").css({
				"margin": "10px 0 5px 15px", 
				"padding": "3px"
			});
			
			$div.append(
				$("<div/>").text(whatText),
			    $("<div/>").text(howText).css({"color": "gray", "margin": "5px 0 0 5px"}));
			
			return $div;
		};
		
		$(this).append(
			$("<div/>").append(
				info("Ny kompis", "Klicka plusknappen uppe till höger"),
				info("Ny betalning", "Klicka plusknappen nere till vänster"),
				info("Ta bort", "Sudda all text för kompis/betalning"),
				info("Någon står utanför en betalning", "Sudda siffran i rutan"),
				info("Gör en överföring på 100 kr", "Skriv 100 på den som ger och -100 på den som får")
			)
		)
	});
	
	addToCenter([$("<br/>"), $("<br/>"), $iGetIt]);
	addToCenter($readMore);
	
});