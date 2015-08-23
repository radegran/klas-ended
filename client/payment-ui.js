﻿var PaymentUI = function(addWizard, model)
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
		var $historyHeader = $("<div/>").text(L.PreviousPayments);
		$pastPayments = $("<div/>");
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
		
		var paymentList = [];
		
		dh.eachPayment(function(payment)
		{
			paymentList.push(payment);
		});
		
		paymentList = paymentList.reverse();
		
		$.each(paymentList, function(i, payment) 
		{
			var $p = $("<div/>").addClass("flex-horizontal-container flex-justify-center");
			var $clickable = $("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment small-text");
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
				
		$addButton.show();
	};
	
	return {
		"create": create,
		"update": update
	};
};
