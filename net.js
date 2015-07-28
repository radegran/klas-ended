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

var Net = function(jobQueue, errorHandler)
{
	var ajax = function(url, data, onSuccess, onError)
	{
		$.ajax({
			type: "POST",
			url: "/" + url,
			data: JSON.stringify(data),
			contentType: "application/json",
			success: onSuccess,
			error: onError
		});		
	};
	
	var create = function(onSuccess) 
	{
		ajax("create", {}, function(response) { onSuccess(response.url); }, $.noop);
	};
	
	var read = function(idObj, onSuccess)
	{
		ajax("get", idObj, onSuccess, errorHandler.bailout);
	};

	var update = function(doc, onSuccess, onConflict)
	{
		var resolve;
		var reject;
		
		var success = function(response)
		{
			if (response.err)
			{
				errorHandler.fatal(response.err);
				reject();
			}
			else if (response.ok)
			{
				// All good...
				resolve();
				onSuccess();
			}
			else
			{
				errorHandler.info(L.SomeoneMadeAChangeTryAgain);
				
				var serverDoc = {
					"data": response.data,
					"generation": response.generation,
					"id": response.id
				};
				
				onConflict(serverDoc);
				reject();
			}
		};
		
		var error = function(err)
		{
			errorHandler.fatal();
			reject();			
		};
		
		// Add to queue
		jobQueue.add(function(resolveJob, rejectJob)
		{
			resolve = resolveJob;
			reject = rejectJob;
			
			ajax("update", doc, success, error);
		});
	};
	
	return {
		"create": create,
		"update": update,
		"read": read
	};
};

var RemoteDoc = function(doc, net)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	var update = function(updateData, updateConflict) 
	{	
		if (JSON.stringify(data) === JSON.stringify(updateData))
		{
			// No need to update
			return;
		}
	
		var onSuccess = function() {};
		
		var onConflict = function(conflictDoc) 
		{
			data = conflictDoc.data;
			generation = conflictDoc.generation;
		
			updateConflict(data);			
		};
		
		generation++;
		data = updateData;
		
		net.update({
					"id": id,
					"generation": generation,
					"data": updateData
				},
				onSuccess,
				onConflict);	
	};
	
	return {
		"data": function() { return data; },
		"update": update,
		"generation": function() { return generation; }
	};
};
