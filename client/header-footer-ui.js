var TitleUI = function(model, helpUI)
{
	var $title = null;
	
	var update = function()
	{
		var dh = model.getDataHelper();
		
		var title = dh.title();
		title = (title == "") ? "..." : title;
		document.title = title;
		
		var editableTitle = editable(title, function(newValue)
		{
			document.title = newValue;
			dh.title(newValue);
			dh.commit();
		});
		
		$title.empty();
		$title.append(editableTitle.element().on("click", function() { editableTitle.editMode(); }));
	};
	
	var create = function($parent)
	{
		var $help = div("flex-no-shrink").css("font-size", "0.5em");
		helpUI.create($help);
		$title = horizontal("");
		var $indent = div("flex-grow").css({
			"max-width": "1.6em",
		});
		
		$parent.append(
			horizontalFill("flex-align-center").append(
				$indent,
				div("flex-grow"),
				$title, 
				div("flex-grow"),
				$help
			)
		);
	};
	
	return {
		"update": update,
		"create": create
	};
};

var AddPaymentButtonUI = function(paymentWizard, model)
{
	var $addPaymentButton = null;
	var $addPaymentHelp = null;
	var $parentElem = null;
	
	var update = function()
	{
		var dh = model.getDataHelper();
		
		if (dh.payment(0) == null)
		{
			$addPaymentHelp.show();
		}
		else
		{
			$addPaymentHelp.hide();
		}

		if (dh.names().length == 0)
		{
			$parentElem.slideUp();
		}
		else
		{
			$parentElem.slideDown();
		}
	};
	var create = function($parent)
	{
		$parentElem = $parent;
		$addPaymentHelp = div().html("Lägg till nya betalningar här").css("cursor", "pointer")
		$addPaymentButton = horizontal().append(
			div("payment-add").load("plus.svg"),
			$addPaymentHelp
		).on("click", function() { paymentWizard.show(); });

		$parent.append(horizontal().append($addPaymentButton));
	};
	
	return {
		"update": update,
		"create": create
	};
};
