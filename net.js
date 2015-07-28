var JobQueue = function()
{
	var previous = new $.Deferred().resolve();
		
	var add = function(fn) 
	{
		var wrap = function()
		{
			var d = new $.Deferred();
			fn(function() {d.resolve();}, function() {d.reject(); previous = new $.Deferred().resolve(); });
			return d;
		};
		
		previous = previous.then(wrap, function() {});
	};		
	
	return {
		"add": add
	};
};

var DocState = function(doc)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	
	var q = JobQueue();
	
	var update = function(opts) 
	{
		var conflictCallback = opts.conflict;
		
		q.add(function(resolve, reject)
		{
			generation++;
			
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
						resolve();
					}
					else
					{
						// Invalidate any queue requests
						reject();
					}
				}
			});
		});
		
		q.add(sequenceAjax);
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
