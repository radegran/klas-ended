var showMessage = function(message)
{
	$(".message").remove();
	var $msg = $("<div/>")
		.addClass("yellow info")
		.text(message);
		
	return prependToCenter($msg, "fixed").addClass("message");
};

var bailout = function(message)
{
	showMessage(message || "Ooops! Ett fel har inträffat... Laddar strax om sidan!")
	setTimeout(function() { window.location.href = window.location.href;}, 3000)
};

var info = function(message)
{
	showMessage(message).delay(3000).fadeOut('slow');
};

var initialize = function(docState)
{	
	var $table = $("<table>");
	var $header = $("<div/>").addClass("header");
	addToCenter($header);
	addToCenter($table);

	var $startupInfo = $();
	var t;
	
	var model = Model(docState.data(), function(newdata) 
	{ 
		$startupInfo.animate({height:0, padding:0, margin:0, "font-size":0});
		$startupInfo = $();
		
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
	
	// First time? Show info...
	if (docState.generation() == 0)
	{			
		var $startupInfo = $("<div/>")
			.text("Alla ändringar sparas till länken i adressfältet!")
			.addClass("startup");
		var $startupContainer = wrapCenter($("<div/>").append($startupInfo))
		    .addClass("yellow");
		
		$(document.body).prepend($startupContainer);
	}
};

$(document).ready(function() 
{
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
	var $savingMessage = $();
	
	$(document).ajaxStart(function()
	{
		ajaxTimer = setTimeout(function() {
			$savingMessage = showMessage("Sparar ...");
		}, 2000);
	});
	
	$(document).ajaxStop(function()
	{
		clearTimeout(ajaxTimer);
		$savingMessage.hide();
	});
	
});