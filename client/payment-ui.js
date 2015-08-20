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
		var $historyHeader = $("<div/>").text(L.PreviousPayments);
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
		$note.empty().hide();
		var dh = model.getDataHelper();
		
		var paymentList = [];
		
		dh.eachPayment(function(payment)
		{
			paymentList.push(payment);
		});
		
		paymentList = paymentList.reverse();
		
		$.each(paymentList, function(i, payment) 
		{
			var $p = $("<div/>").addClass("flex-horizontal-container flex-justify-center");
			var $clickable = $("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment");
			var $label = $("<span/>").html(payment.text() + whiteSpace(3));
			var $cost = $("<span/>").html(formatMoney(payment.cost()));
			var $confirm = $("<div/>").hide()
				.addClass("confirm-remove")
				.text(L.Remove)
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
			note(L.AddPersonsFirst);
			return;
		}
			
		$addButton.show();
				
		if (paymentList.length === 0)
		{
			note(L.AddPaymentsHere);
		}
	};
	
	return {
		"create": create,
		"update": update
	};
};
