var showMessage = function(message)
{
	$(".center.info").remove();
	var $msg = $("<div/>")
	    .addClass("center info")
		.text(message);
	$(document.body).prepend($msg);	
	return $msg;
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
						info("Någon har ändrat balansen. Prova igen eller ladda om sidan.")
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
	var $table = $("<table>").addClass("center");
	var $container = $("<div/>").css("position", "relative");
	$(document.body).prepend($container.append($table));

	var t;
	var model = Model(docState.data(), function(newdata) 
	{ 
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

	t = Table($table, model);
	t.update(docState.data());
	
	if (docState.generation() == 0)
	{			
		$(document.body).append(
			$("<div/>")
			.addClass("center info")
			.text("Kopiera länken när du är klar. Alla ändringas sparas.")
			.delay(2000)
			.fadeOut('slow'));
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
	  success: function(doc) { initialize(DocState(doc)); },
	  error: function() { bailout(); }
	});
});