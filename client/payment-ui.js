var PaymentUI = function(addWizard, model)
{
	var $addButton = null;
	var $historyContainer = null;
	var $addWizard = null;
	
	var hideWizard = function()
	{
		$historyContainer.show();
		$addButton.show();
		$addWizard.hide();
	};
	
	var showAddWizard = function(paymentIndex)
	{
		// paymentIndex might be null. Then its a new payment
		$addButton.hide();
		$historyContainer.hide();
		addWizard.show($addWizard.empty().show(), hideWizard, paymentIndex);
	};
	
	var create = function($parent)
	{
		var $historyHeader = $("<span/>").text("Tidigare betalningar:");
		$pastPayments = $("<div/>");
		$historyContainer = $("<div/>");
		$addWizard = $("<div/>");
		$addButton = $("<span/>")
			.addClass("add-button")
			.text("New payment")
			.on("click", function() { showAddWizard(); });
		
		$parent.append(
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$addButton), 
			$historyContainer.append($historyHeader, $pastPayments), 
			$addWizard);
	};
	
	var update = function()
	{
		$pastPayments.empty();
		hideWizard();	
		$historyContainer.hide();
		var dh = model.getDataHelper();
		
		dh.eachPayment(function(payment)
		{
			var $p = $("<div/>").addClass("flex-horizontal-container");
			var $label = $("<span/>").html(payment.text());
			var $cost = $("<span/>").html("(cost:" + payment.cost() + ")");
			var $remove = $("<span/>").html("(X)").on("click", function() { payment.remove(); dh.commit(); });
			
			$p.on("click", function()
			{
				showAddWizard(payment.index);
			});
			
			$pastPayments.append($p.append(
				$label.addClass("flex-grow"), 
				$cost, 
				$remove));
				
			$historyContainer.show();
		});
	};
	
	return {
		"create": create,
		"update": update
	};
};
