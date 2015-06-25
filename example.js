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

var DocState = function(doc)
{
	var generation = doc.generation;
	var data = doc.data;
	var id = doc.id;
	
	var Queue = function () 
	{
		var previous = new $.Deferred().resolve();
		
		return function (fn) 
		{
			previous = previous.then(fn, function() {});
		};
	};
	
	var q = Queue();
	
	var update = function(opts) 
	{
		var conflictCallback = opts.conflict;
		
		var sequenceAjax = function()
		{
			generation++;
			
			var d = new $.Deferred();
			var returnedOk = false;
			
			$.ajax({
				type: "POST",
				url: "/update",
				data: JSON.stringify({
					"id": id,
					"generation": generation,
					"data": opts.data
				}),
				contentType: "application/json",
				success: function(updatereply) 
				{ 
					if (updatereply.err)
					{
						bailout(updatereply.err)
					}
					else if (updatereply.ok)
					{
						// All good...
						returnedOk = true;
					}
					else
					{
						info("Någon har ändrat balansen, försök igen.")
						data = updatereply.data;
						generation = updatereply.generation;
						conflictCallback(data);
					}
				},
				error: function() 
				{
					bailout();
				},
				complete: function()
				{
					if (returnedOk)
					{
						d.resolve();
					}
					else
					{
						// Invalidate any queue requests
						d.reject();
						// Make a fresh queue
						q = Queue();
					}
				}
			});
			
			return d;
		};
		
		q(sequenceAjax);
	};
	
	return {
		"data": function() { return data; },
		"update": update,
		"generation": function() { return generation; }
	};
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
		$startupInfo.fadeOut('fast');
		
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
	
	if (docState.generation() == 0)
	{			
		$startupInfo = $("<div/>").addClass("info yellow startup").append(
			$("<span/>").text("Ovanför finns en tom sammanställning du kan börja fylla i."), $("<br/>"),
			$("<span/>").text("Du kan lägga till den här sidan som ett bokmärke för att"), $("<br/>"),
			$("<span/>").text("återkomma senare. Det går också låta andra ta del av sidan"), $("<br/>"),
			$("<span/>").text("genom att bara kopiera och maila länken:"), $("<br/>"),
			$("<br/>"),
			$("<a/>").attr("href", window.location.href).text(window.location.href), $("<br/>"),
			$("<br/>"),
			$("<span/>").text("Alla ändringar sparas automatiskt!"));
		addToCenter($startupInfo);
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