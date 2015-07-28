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
		var success = function(response)
		{
			if (response.err)
			{
				info(response.err);
			}
			else
			{
				onSuccess(response);
			}
		};
		
		ajax("get", idObj, success, errorHandler.bailout);
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

var RemoteDoc = function(id, net)
{
	var generation = 0;
	
	var update = function(updateData, updateConflict) 
	{		
		var onConflict = function(conflictDoc) 
		{
			var data = conflictDoc.data;
			generation = conflictDoc.generation;
		
			updateConflict(data);			
		};
		
		generation++;
		
		net.update({
					"id": id,
					"generation": generation,
					"data": updateData
				},
				$.noop,
				onConflict);	
	};
	
	var read = function(onData)
	{
		net.read({"id": id}, function(doc)
		{
			generation = doc.generation;
			onData(doc.data);
		});
	};
	
	return {
		"read": read,
		"update": update,
		"isFirstGeneration": function() { return generation == 0; }
	};
};

// var DocProxy = function(id, net)
// {
	// var remoteDoc;
	
	// var get = function(callback)
	// {
		// if (!remoteDoc)
		// {
			// net.read({"id": window.location.pathname.substring(1)}, function(doc)
			// {
				// initialize(RemoteDoc(doc, net)); 			
			// });			
		// }
	// };
	
// };
