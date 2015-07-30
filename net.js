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
	var listeners = [];
	
	var obj = {
		"isOnline": true,
		"setOnline": function(isOnline) { obj.isOnline = isOnline; $.each(listeners, function(i, l) { l(isOnline); }); },
		"onChanged": function(listener) { listeners.push(listener); }
	};
	
	return obj;
}

var Net = function(jobQueue, errorHandler, networkStatus)
{
	var pingTimer = null;
	
	var ajax = function(url, data, onSuccess, onError)
	{
		$.ajax({
			type: "POST",
			url: "/" + url,
			data: JSON.stringify(data),
			contentType: "application/json",
			success: function(o) { networkStatus.setOnline(true); onSuccess(o); },
			error: function(o) 
			{ 
				if (networkStatus.isOnline)
				{	
					errorHandler.info(L.OfflineMode);
					networkStatus.setOnline(false);  
				}
				
				window.clearTimeout(pingTimer);
				pingTimer = window.setTimeout(function() { ajax("ping", {}, function() { info(L.OnlineMode); }, $.noop); }, 3000);
									
				onError(o); 
			}
		});		
	};
	
	var create = function(onSuccess) 
	{
		ajax("create", {}, function(response) { onSuccess(response.url); }, $.noop);
	};
	
	var read = function(idObj, onSuccess, onError)
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
		
		ajax("get", idObj, success, onError);
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
			resolve();			
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
	
	var update = function(updateData, onSuccess, onConflict, onError) 
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
				onSuccess,
				onConflictInternal,
				onError);	
	};
	
	var read = function(onData, onError)
	{
		net.read({"id": id}, function(doc)
		{
			generation = doc.generation;
			onData(doc.data);
		}, onError);
	};
	
	return {
		"read": read,
		"update": update,
		"isFirstGeneration": function() { return generation == 0; }
	};
};

var LocalDoc = function(storage)
{	
	var supported = function()
	{
		return storage !== undefined;
	};
	
	var exists = function()
	{
		return supported() && storage.data !== undefined;
	};

	var update = function(data)
	{
		if (supported())
		{
			storage.data = JSON.stringify(data);
		}
	};
	
	var read = function()
	{
		if (!exists())
		{
			throw "local doc does not exist!";
		}
		
		return JSON.parse(storage.data);
	};
	
	return {
		"update": update,
		"read": read,
		"exists": exists
	};
};

var DocProxy = function(localDoc, remoteDoc, networkStatus, errorHandler)
{
	var lastServerData;
	
	var read = function(onData) 
	{
		if (localDoc.exists())
		{
			lastServerData = localDoc.read();
			onData(lastServerData);
		}
		
		if (networkStatus.isOnline)
		{	
			var onRemoteDocData = function(data)
			{
				if (JSON.stringify(data) != JSON.stringify(lastServerData))
				{
					lastServerData = data;
					localDoc.update(data);
					onData(data);					
				}
			};
			
			var onRemoteDocError = function(err)
			{
				if (!lastServerData)
				{
					errorHandler.fatal("Oooops!");
				}
			};
	
			remoteDoc.read(onRemoteDocData, onRemoteDocError);
		}
		
		if (!lastServerData && !networkStatus.online)
		{
			errorHandler.fatal("Ooooops!");
		}
	};
	
	var update = function(data, updateConflict)
	{
		var onOffline = function()
		{			
			if (LocalDiff(lastServerData, data).accepted())
			{
				localDoc.update(data);
			}
			else
			{
				errorHandler.info(L.OfflineMode);
				updateConflict(localDoc.read());		
			}
		};
		
		var onSuccess = function()
		{
			lastServerData = data;
			localDoc.update(data);
		};
		
		var updateConflictInternal = function(conflictData)
		{
			lastServerData = conflictData;
			localDoc.update(conflictData);
			updateConflict(conflictData);
		};

		if (networkStatus.isOnline)
		{
			remoteDoc.update(data, onSuccess, updateConflictInternal, onOffline);			
		}
		else
		{
			onOffline();
		}
	};
	
	return {
		"anyLocalChanges": function() { return !LocalDiff(lastServerData, localDoc.read()).isEmpty(); },
		"read": read,
		"update": update,
		"isFirstGeneration": function() { return remoteDoc.isFirstGeneration(); }
	}
};