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

var NetworkStatus = function()
{
	return {
		"isOnline": false
	};
}

var Net = function(jobQueue, errorHandler, networkStatus)
{
	var ajax = function(url, data, onSuccess, onError)
	{
		$.ajax({
			type: "POST",
			url: "/" + url,
			data: JSON.stringify(data),
			contentType: "application/json",
			success: function(o) { networkStatus.isOnline = true; onSuccess(o); },
			error: function(o) { networkStatus.isOnline = false; onError(o); }
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

	var update = function(doc, onSuccess, onConflict, onError)
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
			errorHandler.info("Offline mode!");
			reject();			
			onError(err);
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
	var generation;
	
	var update = function(updateData, onConflict, onError) 
	{	
		if (!generation)
		{
			// Can not update if nothing has been read.
		}
	
		var onConflictInternal = function(conflictDoc) 
		{
			var data = conflictDoc.data;
			generation = conflictDoc.generation;
		
			onConflict(data);			
		};
		
		generation++;
		
		net.update({
					"id": id,
					"generation": generation,
					"data": updateData
				},
				$.noop,
				onConflictInternal,
				onError);	
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

var LocalDoc = function()
{	
	var supported = function()
	{
		return window.localStorage !== undefined;
	};
	
	var exists = function()
	{
		return supported() && window.localStorage.data !== undefined;
	};

	var update = function(data)
	{
		if (supported())
		{
			window.localStorage.data = JSON.stringify(data);
		}
	};
	
	var read = function()
	{
		if (!exists())
		{
			throw "local doc does not exist!";
		}
		
		return JSON.parse(window.localStorage.data);
	};
	
	return {
		"update": update,
		"read": read,
		"exists": exists
	};
};

var DocProxy = function(localDoc, remoteDoc, networkStatus)
{
	var lastReadData;
	
	var read = function(onData) 
	{
		if (localDoc.exists())
		{
			lastReadData = localDoc.read();
			onData(lastReadData);
		}
		
		remoteDoc.read(function(data) 
		{
			lastReadData = data;
			localDoc.update(data);
			onData(data);
		});
	};
	
	var update = function(data, updateConflict)
	{
		var rollback = function()
		{
			info("Offline mode!");
			updateConflict(lastReadData);			
		};
		
		if (networkStatus.isOnline)
		{
			localDoc.update(data);
			remoteDoc.update(data, updateConflict, rollback);			
		}
		else
		{
			rollback();
		}
	};
	
	return {
		"read": read,
		"update": update,
		"isFirstGeneration": function() { return remoteDoc.isFirstGeneration(); }
	}
};
