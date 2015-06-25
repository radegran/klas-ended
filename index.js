$(document).ready(function() 
{
	var $table = $("<table>").addClass("center");
	var $header = $("<div/>").addClass("center header");
	var $container = $("<div/>").css("position", "relative");
	
	$(document.body).append($container.append($header, $table));

	var data = {
		"title": "Exempel på balansräkning (klicka Okej för att kunna spara)",
		"names": ["Klas", "Göran", "Berit"],
		"payments": [
			{"text": "Överföring från Klas till Göran", "values": [100, -100, null]},
			{"text": "Berit köper pizza till allihop", "values": [0, 0, 210]},
			{"text": "Göran köper öl till sig själv och Berit", "values": [null, 140, 0]}				
		]
	};

	var t;
	var model = Model(data, function(newdata) { t.update(newdata); });

	t = Table($header, $table, model);
	t.update(data);
	
	var buttonCss = function(color) {
		return {
			"margin-top": "15px",
			"padding": "10px",
			"background-color": color,
			"cursor": "hand"
		}
	};
	
	// "Ok, I get it!"
	var $iGetIt = $("<div/>").css(buttonCss("lightgreen")).text("Okej, jag fattar!");
	
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
	var $readMore = $("<div/>").css(buttonCss("#f0f0f0")).text("Hur gör man ..?");
	
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
	
	$container.append($("<br/>"), $iGetIt.addClass("center"), $readMore.addClass("center"));
	
});