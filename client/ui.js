var MainContentUI = function(statsUI, paymentUI, helpUI)
{
	var create = function($parent)
	{
		var $stats = div();
		var $payments = div();
		var $help = div();
		
		statsUI.create($stats);
		paymentUI.create($payments);
		helpUI.create($help);
		
		$parent.append(
			$stats, 
			div().html(whiteSpace(1)), 
			$payments,
			div().html(whiteSpace(1)),
			$help);
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
		var $root = vertical("ui-root");
		var $header = div("ui-header small-padding");
		var $statusBar = div("ui-status-bar messagecontainer");
		var $contentVertical = vertical();
		var $contentHorizontal = horizontal("ui-content small-padding");
		var $contentContainer = div("ui-content-container flex-grow nonbounce");
		var $footer = div("ui-footer small-padding");
		
		headerUI.create($header);
		contentUI.create($contentVertical);
		footerUI.create($footer);
		
		$parent.append(
			$root.append(
				$header,
				$statusBar,
				$contentContainer.append(
					$contentHorizontal.append(
						$contentVertical
					)
				),
				$footer
			)
		);
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
