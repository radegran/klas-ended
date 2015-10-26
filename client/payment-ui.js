var PaymentUI = function(paymentWizard, model)
{
	var $historyContainer = null;

	var create = function($parent)
	{
		var $historyHeader = div("section-header")
			.html(L.PreviousPayments + whiteSpace(1));
		$pastPayments = vertical();
		$historyContainer = vertical();
		
		$parent.append(
			$historyContainer.append(
				horizontal().append($historyHeader), 
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
			var $p = horizontal("volatile-container clickable-payment");
			var $clickable = $("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center");
			var $label = horizontal().append(
				div().html(payment.text()),
				div("created-time flex-grow").html(formatTimeSince(payment.createdTime()))
			);
			var $cost = div().html(formatMoney(payment.cost()));
			
			$clickable.on("click", function()
			{
				paymentWizard.show(payment.index);
			});
			
			$pastPayments.append($p.append(
				$clickable.append(
					$label.addClass("flex-grow"), 
					$cost,
					rightArrow())
				)
			);
				
			$historyContainer.show();
		});
	};
	
	return {
		"create": create,
		"update": update
	};
};
