var initialize = function(docState)
{	
	var $table = $("<table>");
	var $header = $("<div/>").addClass("header");
	var startupInfo;
	var t;
	
	var model = Model(docState.data(), function(newdata) 
	{ 
		if (startupInfo)
		{
			startupInfo.hide();
			startupInfo = null;
		}
		
		t.update(newdata);

		docState.update({
			"data": newdata,
			"conflict": function(theirdata)
			{
				// Conflict!	
				model.reset(theirdata);
			}
		});
	});

	t = Table($header, $table, model);
	t.update(docState.data());

	$(document.body).append($("<div/>").css({
		"display": "inline-block",
		"min-width": "100%"
	}).append([
		$header,
		$table
	]));
	
	// First time? Show info...
	if (docState.generation() == 0)
	{			
		startupInfo = info("Alla ändringar sparas till länken i adressfältet!", 9999999999);
	}	
};

$(document).ready(function() 
{
	$(document.body).append(
		$("<div/>").addClass("root").append(
			$("<div/>").addClass("messagecontainer")
		));
	
	// Get initial data
	$.ajax({
	  type: "POST",
	  url: "/get",
	  data: JSON.stringify({"id": window.location.pathname.substring(1)}),
	  contentType: "application/json",
	  success: function(reply) { 
		if (reply.err)
		{
			info(reply.err);
		}
		else
		{
			initialize(DocState(reply)); 			
		}
	  },
	  error: function() { bailout(); }
	});
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
	$(document).ajaxStart(function()
	{
		ajaxTimer = setTimeout(function() {
			messageObj = showMessage("Sparar ...");
		}, 2000);
	});
	
	$(document).ajaxStop(function()
	{
		clearTimeout(ajaxTimer);
		messageObj.hide();
	});
	
});