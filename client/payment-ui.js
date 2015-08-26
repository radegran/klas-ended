var PaymentUI = function(paymentWizard, model)
{
	var $historyContainer = null;

	var create = function($parent)
	{
		var $historyHeader = $("<div/>").text(L.PreviousPayments);
		$pastPayments = $("<div/>");
		$historyContainer = $("<div/>");
		
		$parent.append(
			$historyContainer.append(
				$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($historyHeader), 
				$("<div/>").html(whiteSpace(1)),
				$pastPayments));
	};
	
	var update = function()
	{
		$pastPayments.empty();
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
			var $p = horizontal("volatile-container");
			var $clickable = $("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment small-text");
			var $label = $("<span/>").html(payment.text() + whiteSpace(3));
			var $cost = $("<span/>").html(formatMoney(payment.cost()));
			var $confirm = div("confirm-remove volatile").hide()
				.text(L.Remove)
				.on("click", function() { payment.remove(); dh.commit(); });
				
			var $remove = $("<div/>")
				.addClass("payment-remove")
				.on("click", function(e) { $confirm.show('fast'); });
							
			$label.on("click", function()
			{
				paymentWizard.show(payment.index);
			});
			
			$pastPayments.append($p.append(
				$confirm,
				$clickable.append(
					$label.addClass("flex-grow"), 
					$cost), 
				$remove));
				
			$historyContainer.show();
		});
	};
	
	return {
		"create": create,
		"update": update
	};
};
