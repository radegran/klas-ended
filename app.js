var initialize = function(remoteDoc)
{	
	var $table = $("<table>");
	var $header = $("<div/>").addClass("header");
	
	$(document.body).append(
		$("<div/>").addClass("root").append(
			$("<div/>").addClass("messagecontainer")
		));
		
	$(document.body).append($("<div/>").css({
		"display": "inline-block",
		"min-width": "100%"
	}).append([
		$header,
		$table
	]));
	
	var startupInfo;
	var t;
	
	remoteDoc.read(function(data) 
	{
		var model = Model(data, function(newdata) 
		{ 
			if (startupInfo)
			{
				startupInfo.hide();
				startupInfo = null;
			}
			
			t.update(newdata);

			var conflictCallback = function(theirdata)
			{
				model.reset(theirdata);
			};
		
			remoteDoc.update(newdata, conflictCallback);
		});
		
		t = Table($header, $table, model);
		t.update(data);

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