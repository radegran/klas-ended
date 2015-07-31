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
		"setOnline": function(isOnline) 
		{ 
			if (obj.isOnline != isOnline)
			{
				obj.isOnline = isOnline; 
				$.each(listeners, function(i, l) { l(isOnline); }); 				
			}
		},
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
				//errorHandler.info(L.SomeoneMadeAChangeTryAgain);
				
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
	
	var exists = function(key)
	{
		return supported() && storage[key] !== undefined;
	};

	var update = function(key, data)
	{	
		if (supported())
		{
			storage[key] = JSON.stringify(data);
		}
	};
	
	var read = function(key)
	{
		if (!exists(key))
		{
			throw "local doc does not exist!";
		}
		
		return JSON.parse(storage[key]);
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
	var onData;
	
	var onDataInternal = function(data)
	{
		if (onData)
		{
			onData(data);
		}
	};
	
	var update = $.noop;
	
	var read = function() 
	{
		log("Read...");
		
		if (!lastServerData && localDoc.exists("mine"))
		{
			lastServerData = localDoc.read("mine");
			onDataInternal(lastServerData);
		}
		
		if (networkStatus.isOnline)
		{	
			var onRemoteDocData = function(data)
			{
				logData(data, "Read onData");
				if (lastServerData)
				{
					var localDiff = DataDiff(lastServerData, localDoc.read("mine"));
					var anyLocalChanges = !localDiff.isEmpty();
					
					if (anyLocalChanges)
					{
						if (DataDiff(lastServerData, data).rebaseable())
						{
							logData(lastServerData, "Merge base ");
							logData(data, "Merge their");
							logData(localDoc.read("mine"), "Merge mine ");
							// Merge
							//     base: lastServerData
							//   theirs: data
							//     mine: localDoc.read("mine")	
							data = localDiff.applyTo(data);
							update(data);
						}
						else
						{
							// Cannot merge
							errorHandler.info("Internal Error: Could not merge local changes!");
						}
					}
				}

				if (JSON.stringify(data) != JSON.stringify(lastServerData))
				{
					lastServerData = data;
					localDoc.update("mine", data);
					onDataInternal(data);					
				}
			};
			
			var onRemoteDocError = function(err)
			{
				log("Read onError!")
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
	
	update = function(data)
	{
		logData(data, "Update...");
		
		var onOffline = function()
		{		
			log("Update offline!");
			if (DataDiff(lastServerData, data).accepted())
			{
				localDoc.update("mine", data);
			}
			else
			{
				errorHandler.info(L.OfflineMode);
				onDataInternal(localDoc.read("mine"));		
			}
		};
		
		var onSuccess = function()
		{
			logData(data, "Update success")
			lastServerData = data;
			localDoc.update("mine", data);
		};
		
		var updateConflictInternal = function(conflictData)
		{
			logData(conflictData, "Update conflict!");
			
			var serverDiff = DataDiff(lastServerData, conflictData);
			var localDiff = DataDiff(lastServerData, data);
				
			if (serverDiff.rebaseable() && localDiff.accepted())
			{
				var mergeData = localDiff.applyTo(conflictData);
				update(mergeData);
				onDataInternal(mergeData);
			}
			else
			{
				errorHandler.info(L.SomeoneMadeAChangeTryAgain);
				
				lastServerData = conflictData;
				localDoc.update("mine", conflictData);
				onDataInternal(conflictData);				
			}
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
	
	var setOnData = function(f)
	{
		if (onData)
		{
			errorHandler.fatal("Internal error: Must not set multiple onData handlers.")
		}
		
		onData = f;
	};
	
	return {
		"read": read,
		"update": update,
		"onData": setOnData,
		"isFirstGeneration": function() { return remoteDoc.isFirstGeneration(); }
	}
};