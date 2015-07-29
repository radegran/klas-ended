var initialize = function(remoteDoc)
{	
	var $table = $("<table>");
	var $header = $("<div/>").addClass("header");
	var $messageContainer = $("<div/>").addClass("messagecontainer");
	
	$(document.body).append(
		$("<div/>").addClass("root").append(
			$messageContainer,
			$header,
			$table));

	var startupInfo;
	var table;

	var model = Model(function(newdata) 
	{ 
		table.update(newdata);
		
		if (startupInfo)
		{
			startupInfo.hide();
			startupInfo = null;
		}
		
		var conflictCallback = function(theirdata)
		{
			model.reset(theirdata);
			table.update(theirdata);
		};
	
		remoteDoc.update(newdata, conflictCallback);
	});
	
	table = Table($header, $table, model);
		
	remoteDoc.read(function(data) 
	{
		model.reset(data);
		table.update(data);
		
		// First time? Show info...
		if (remoteDoc.isFirstGeneration())
		{			
			startupInfo = info(L.AllChangesAreSaved, 9999999999);
		}		
	});
};

$(document).ready(function() 
{	
	var errorHandler = {"fatal": bailout, "info": info};
	var networkStatus = NetworkStatus();
	var net = Net(JobQueue(), 
				  errorHandler, 
				  networkStatus);
	var id = window.location.pathname.substring(1);

	var docProxy = DocProxy(LocalDoc(window.localStorage), 
							RemoteDoc(id, net), 
							networkStatus,
							errorHandler);
	initialize(docProxy); 			
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
	$(document).ajaxStart(function()
	{
		if (networkStatus.isOnline)
		{
			ajaxTimer = setTimeout(function() {
				messageObj = showMessage(L.Saving);
			}, 2000);			
		}
	});
	
	$(document).ajaxStop(function()
	{
		clearTimeout(ajaxTimer);
		messageObj.hide();
	});
	
});