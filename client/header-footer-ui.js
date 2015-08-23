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

		if (dh.names.length == 0)
		{
			$addPaymentButton.hide();
		}
		else
		{
			$addPaymentButton.slideDown();
		}
	};
	
	var showAddPayment = function()
	{
		var hideWizard = $.noop;
		paymentWizard.show($addWizard.empty().show(), hideWizard);
	};
	
	var create = function($parent)
	{
		$addPaymentButton = div("payment-add")
			.on("click", function() {});
		
		// $addPaymentButton = $("<div/>")
			// .addClass("people-add")
			// .on("click", function() { var dh = model.getDataHelper(); dh.addPerson(L.Name); dh.commit(); });

		$parent.append($addPaymentButton);
	};
	
	return {
		"update": update,
		"create": create
	};
};
