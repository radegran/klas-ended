var DocState = function(doc)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	
	var Queue = function () 
	{
		var previous = new $.Deferred().resolve();
		
		return function (fn) 
		{
			previous = previous.then(fn, function() {});
		};
	};
	
	var q = Queue();
	
	var update = function(opts) 
	{
		var conflictCallback = opts.conflict;
		
		var sequenceAjax = function()
		{
			generation++;
			
			var d = new $.Deferred();
			var returnedOk = false;
			
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
						bailout(updatereply.err)
					}
					else if (updatereply.ok)
					{
						// All good...
						returnedOk = true;
					}
					else
					{
						info(L.SomeoneMadeAChangeTryAgain);
						data = updatereply.data;
						generation = updatereply.generation;
						conflictCallback(data);
					}
				},
				error: function() 
				{
					bailout();
				},
				complete: function()
				{
					if (returnedOk)
					{
						d.resolve();
					}
					else
					{
						// Invalidate any queue requests
						d.reject();
						// Make a fresh queue
						q = Queue();
					}
				}
			});
			
			return d;
		};
		
		q(sequenceAjax);
	};
	
	return {
		"data": function() { return data; },
		"update": update,
		"generation": function() { return generation; }
	};
};

var createNewApp = function() 
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
};
