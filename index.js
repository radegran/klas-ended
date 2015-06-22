$(document).ready(function() 
{
	var $table = $("<table>");
	var $center = $("<center/>");
	$(document.body).append($center.append($table));

	var data = {
		"names": ["Klas", "Göran", "Berit"],
		"payments": [
			{"text": "Överföring från Klas till Göran", "values": [100, -100, null]},
			{"text": "Berit köper pizza till allihop", "values": [0, 0, 210]},
			{"text": "Göran köper öl till sig själv och Berit", "values": [null, 140, 0]}				
		]
	};

	var t;
	var model = Model(data, function(newdata) { t.update(newdata); });

	t = Table($table, model);
	t.update(data);
	
	// "Ok, I get it!"
	var $iGetIt = $("<div/>").css({
		"margin-top": "30px",
		"padding": "10px",
		"background-color": "lightgreen",
		"display": "inline-block",
		"cursor": "hand"
	}).text("Okej, jag fattar!");
	
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
	
	$center.append($iGetIt);
	
});