var DocState = function(doc)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	
	return {
		"data": function() { return data; },
		"update": function(opts) 
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
		}
	};
};

var initialize = function(docState)
{	
	var $table = $("<table>");
	var $center = $("<center/>");
	$(document.body).append($center.append($table));

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