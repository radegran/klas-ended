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
		
	remoteDoc.read(function(data) 
	{
		var startupInfo;
		var table;
	
		var model = Model(data, function(newdata) 
		{ 
			if (startupInfo)
			{
				startupInfo.hide();
				startupInfo = null;
			}
			
			table.update(newdata);

			var conflictCallback = function(theirdata)
			{
				model.reset(theirdata);
			};
		
			remoteDoc.update(newdata, conflictCallback);
		});
		
		table = Table($header, $table, model);
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
	var net = Net(JobQueue(), {"fatal": bailout, "info": info});
	var id = window.location.pathname.substring(1);

	initialize(RemoteDoc(id, net)); 			
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
	$(document).ajaxStart(function()
	{
		ajaxTimer = setTimeout(function() {
			messageObj = showMessage(L.Saving);
		}, 2000);
	});
	
	$(document).ajaxStop(function()
	{
		clearTimeout(ajaxTimer);
		messageObj.hide();
	});
	
});