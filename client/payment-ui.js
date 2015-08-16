var PaymentUI = function(addWizard, model)
{
	var $addButton = null;
	var $historyContainer = null;
	var $addWizard = null;
	var $note = null;
	
	var hideWizard = function()
	{
		$historyContainer.show();
		$addButton.show();
		$addWizard.hide();
		$note.show();
	};
	
	var showAddWizard = function(paymentIndex)
	{
		// paymentIndex might be null. Then its a new payment
		$addButton.hide();
		$historyContainer.hide();
		$note.hide();
		addWizard.show($addWizard.empty().show(), hideWizard, paymentIndex);
	};
	
	var create = function($parent)
	{
		var $historyHeader = $("<div/>").text("Tidigare betalningar");
		$pastPayments = $("<div/>");
		$historyContainer = $("<div/>");
		$note = $("<div/>");
		$addWizard = $("<div/>");
		$addButton = $("<div/>")
			.addClass("payment-add")
			.on("click", function() { showAddWizard(); });
		
		$parent.append(
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($addButton), 
			$note,
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
		$note.hide();
		var dh = model.getDataHelper();
		
		dh.eachPayment(function(payment)
		{
			var $p = $("<div/>").addClass("flex-horizontal-container flex-justify-center");
			var $clickable = $("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment small-text");
			var $label = $("<span/>").html(payment.text() + whiteSpace(3));
			var $cost = $("<span/>").html(formatMoney(payment.cost()));
			var $confirm = $("<div/>").hide()
				.addClass("confirm-remove")
				.text("Ta bort")
				.on("click", function() { payment.remove(); dh.commit(); });
				
			var $remove = $("<div/>")
				.addClass("payment-remove")
				.on("click", function(e) { $confirm.toggle('fast'); e.stopPropagation(); });
							
			$p.on("click", function()
			{
				showAddWizard(payment.index);
			});
			
			$pastPayments.append($p.append(
				$confirm,
				$clickable.append(
					$label.addClass("flex-grow"), 
					$cost), 
				$remove));
				
			$historyContainer.show();
		});
		
		var note = function(text)
		{
			$note.html($("<div/>")
				.addClass("flex-horizontal-container flex-justify-center")
				.append($("<span/>").html(text))).show();
		};
		
		var noNamesYet = dh.names().length == 0;
		
		if (noNamesYet)
		{
			$addButton.hide();
			note("Lägg först till några personer");
			return;
		}
			
		$addButton.show();
				
		// no payments yet?
		var noPaymentsYet = $pastPayments.find("*").length == 0;
		
		if (noPaymentsYet)
		{
			note("Lägg till betalningar här");
		}
	};
	
	return {
		"create": create,
		"update": update
	};
};
