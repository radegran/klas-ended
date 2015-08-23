var TitleUI = function(model)
{
	var $title = null;
	
	var update = function()
	{
		var dh = model.getDataHelper();
		
		var title = dh.title();
		title = (title == "") ? "..." : title;
		
		var editableTitle = editable(title, function(newValue)
		{
			dh.title(newValue);
			dh.commit();
		});
		
		$title.empty();
		$title.append(editableTitle.element().on("click", function() { editableTitle.editMode(); }));
		
	};
	
	var create = function($parent)
	{
		$title = horizontal();
		$parent.append($title);
	};
	
	return {
		"update": update,
		"create": create
	};
};

var AddPaymentButtonUI = function(paymentWizard, model)
{
	var $addPaymentButton = null;
	
	var update = function()
	{
		var dh = model.getDataHelper();

		if (dh.names().length == 0)
		{
			$addPaymentButton.hide();
		}
		else
		{
			$addPaymentButton.slideDown();
		}
	};
	var create = function($parent)
	{
		$addPaymentButton = div("payment-add")
			.on("click", function() { paymentWizard.show(); });

		$parent.append(horizontal().append($addPaymentButton));
	};
	
	return {
		"update": update,
		"create": create
	};
};
