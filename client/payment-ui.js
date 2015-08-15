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
		var $historyHeader = $("<div/>").text("Tidigare betalningar");
		$pastPayments = $("<div/>").addClass("small-text");
		$historyContainer = $("<div/>");
		$addWizard = $("<div/>");
		$addButton = $("<div/>")
			.addClass("payment-add")
			.on("click", function() { showAddWizard(); });
		
		$parent.append(
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($addButton), 
			$historyContainer.append(
				$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($historyHeader), 
				$("<div/>").html(whiteSpace(1)),
				$pastPayments), 
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
			var $label = $("<span/>").html(payment.text() + whiteSpace(3));
			var $cost = $("<span/>").html(formatMoney(payment.cost()));
			var $remove = $("<div/>").addClass("payment-remove").on("click", function() { payment.remove(); dh.commit(); });
			
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
