var MainContentUI = function(statsUI, paymentUI)
{
	var create = function($parent)
	{
		var $stats = div();
		var $payments = div();
		
		statsUI.create($stats);
		paymentUI.create($payments);
		
		$parent.append($stats, $payments);
	};
	
	var update = function()
	{
		statsUI.update();
		paymentUI.update();
	};
	
	return {
		"create": create,
		"update": update
	};
};

var UI = function(headerUI, contentUI, footerUI)
{
	var create = function($parent)
	{
		var $root = vertical("ui-root flex-justify-center");
		var $header = div("ui-header small-padding");
		var $statusBar = div("ui-status-bar messagecontainer");
		var $content = vertical("flex-justify-center ui-content-container flex-grow small-padding");
		var $footer = div("ui-footer small-padding");
		
		headerUI.create($header);
		contentUI.create($content);
		footerUI.create($footer);
		
		$parent.append(
			$root.append(
				$header,
				$statusBar,
				$content,
				$footer
			)
		);
		
		// General stuff...
		$(window).on("click", function() { $(".confirm-remove").hide('fast'); });
	};
	
	var update = function()
	{
		headerUI.update();
		footerUI.update();
		contentUI.update();
	};
	
	return {
		"create": create,
		"update": update
	};
};
