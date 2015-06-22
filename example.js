var DocState = function(doc)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	
	var update = function(opts) 
	{
		var conflictCallback = opts.conflict;
		
		generation++;
		
		// TODO: Wait for any on-going ajax call
		$.ajax({
			type: "POST",
			url: "/update",
			data: JSON.stringify({
				"id": id,
				"generation": generation,
				"data": opts.data
			}),
			contentType: "application/json",
			success: function(updatereply) 
			{ 
				if (updatereply.err)
				{
					alert(updatereply.err)
				}
				else if (updatereply.ok)
				{
					// All good...
				}
				else
				{
					data = updatereply.data;
					generation = updatereply.generation;
					conflictCallback(data);
				}
			}
		});
	};
	
	return {
		"data": function() { return data; },
		"update": update,
		"generation": function() { return generation; }
	};
};

var initialize = function(docState)
{	
	var $table = $("<table>").addClass("center");
	var $container = $("<div/>").css("position", "relative");
	$(document.body).prepend($container.append($table));

	var t;
	var model = Model(docState.data(), function(newdata) 
	{ 
		t.update(newdata);

		docState.update({
			"data": newdata,
			"conflict": function(theirdata) 
			{
				// Conflict!
				t.update(theirdata);
			}
		});
	});

	t = Table($table, model);
	t.update(docState.data());
	
	if (docState.generation() == 0)
	{			
		$(document.body).append(
			$("<div/>")
			.css({			
				"margin-top": "15px",
				"padding": "10px",
				"background-color": "#FFE869"})
			.text("Kopiera länken när du är klar. Alla ändringas sparas.")
			.delay(2000)
			.fadeOut('slow')
			.addClass("center")
			);
	}
};

$(document).ready(function() 
{
	// Get initial data
	$.ajax({
	  type: "POST",
	  url: "/get",
	  data: JSON.stringify({"id": window.location.pathname.substring(1)}),
	  contentType: "application/json",
	  success: function(doc) { initialize(DocState(doc)); }
	});
});