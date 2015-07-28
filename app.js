var initialize = function(remoteDoc)
{	
	var $table = $("<table>");
	var $header = $("<div/>").addClass("header");
	var startupInfo;
	var t;
	
	var model = Model(remoteDoc.data(), function(newdata) 
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
	t.update(remoteDoc.data());

	$(document.body).append($("<div/>").css({
		"display": "inline-block",
		"min-width": "100%"
	}).append([
		$header,
		$table
	]));
	
	// First time? Show info...
	if (remoteDoc.generation() == 0)
	{			
		startupInfo = info(L.AllChangesAreSaved, 9999999999);
	}	
};

$(document).ready(function() 
{	
	$(document.body).append(
		$("<div/>").addClass("root").append(
			$("<div/>").addClass("messagecontainer")
		));
	
	var net = Net(JobQueue(), {"fatal": bailout, "info": info});
	net.read({"id": window.location.pathname.substring(1)}, function(response)
	{
		if (response.err)
		{
			info(response.err);
		}
		else
		{
			initialize(RemoteDoc(response, net)); 			
		}
	});
	
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