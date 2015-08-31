var StatsUI = function(paymentWizard, model)
{
	var $stats = null;
	var $transferPlan = null;
	var $transfers = null;
	var $addPerson = null;
	var $addPersonHelp = null;
	
	var editPayment = function(index)
	{
		paymentWizard.show(index);
	};
	
	var update = function()
	{
		$stats.empty();
		$transfers.empty();
		$transferPlan.hide();
		
		var balances = [];
		var persons = [];
		
		var dh = model.getDataHelper();
		
		$addPerson.off().on("click", function() 
		{
			dh.addPerson(L.Name);
			dh.commit();
		});
		
		dh.eachPerson(function(person)
		{
			balances.push(person.diff);
			persons.push(person);
		});
		
		persons = persons.sort(function(p1, p2) 
		{ 
			return p1.diff - p2.diff;
		});
		
		if (persons.length > 0)
		{
			$addPersonHelp.hide();
		}
		else
		{
			$addPersonHelp.show();			
		}
		
		$.each(persons, function(i, person)
		{
			var $details = div("person-history").hide();
			var isRemoveable = true;
			
			// Paymeny details for person
			person.eachPayment(function(payment)
			{	
				var diff = payment.valuePair()[0] - payment.valuePair()[1];
				if (diff === 0)
				{
					return;
				}
				
				isRemoveable = false;
				
				var $detail = horizontal("clickable-payment").append(
					div().html(payment.text()),
					div("flex-grow"),
					div().html(formatMoney(diff, true))).on("click", function()
					{
						editPayment(payment.index);
					});
					
				$details.append($detail);
			});
			
			// Person summary
			var $removeButton = div("volatile people-remove").hide();
			var $confirm = div("volatile confirm-remove").text(L.Remove).hide();
			var editableName = editable(person.name, function(newValue) { person.setName(newValue); dh.commit(); });
			var $name = editableName.element();
			
			$personSummary = vertical("person-summary volatile-container").append(
				horizontalFill("flex-align-center").append(
					$confirm,
					$name,
					div("flex-grow").on("click", function(e) 
					{ 
						if ($details.is(":visible")) 
						{ 
							$(".volatile").hide(); 
							e.stopPropagation();
						} 
					}),  // AAAAh... snygga till!!!
					div("flex-no-shrink").html(formatMoney(person.diff, true)),
					$removeButton
				),
				$details.addClass("volatile")
			);
			
			$removeButton.on("click", function(e) 
			{ 
				$removeButton.hide(showHideSpeed); 
				$confirm.show(showHideSpeed); 
				e.stopPropagation();
			});
			$name.on("click", function(e) 
			{ 
				editableName.editMode(); 
				$removeButton.hide(showHideSpeed); 
				$confirm.hide(showHideSpeed); 
				e.stopPropagation();								
			});
			$confirm.on("click", function() { person.remove(); dh.commit(); });
			
			$personSummary.on("click", function(e) 
			{ 			
				if ($details.is(":visible")) 
				{ 
					$(".volatile").hide(); 
					e.stopPropagation();
					return;
				} 
			
				$("person-summary").not(this).find(".volatile").hide(showHideSpeed);
				
				if (isRemoveable)
				{
					// Person is removeable if there are no non-zero diffs
					$removeButton.show(showHideSpeed);
				}
				else
				{
					$details.show(showHideSpeed);
				}
			});
				
			$stats.append($personSummary);
		});
		
		var plan = transferPlan(balances);
		
		$.each(plan, function(i, transfer)
		{
			// Improve UI
			var $plan = $("<div/>").addClass("transfer-div").append(
				$("<span/>").html(dh.name(transfer.from) + " " + L.ShouldGive + " "),
				formatMoney(transfer.amount), 
				$("<span/>").html(" " + L.To + " " + dh.name(transfer.to)));
			
			$transfers.append($plan);
			
			$transferPlan.show();
		});
	};

	var create = function($parent)
	{
		var $transferHeader = div("small-text").html(whiteSpace(1) /*L.MakeEven*/);
		$stats = vertical();
		$transferPlan = vertical();
		$transfers = vertical();
		$addPersonHelp = div().html("Lägg till personer här").css("cursor", "pointer").hide();
		$addPerson = horizontal().append(
			div("person-add"),
			$addPersonHelp
		);
		
		$parent.append(
			$stats,
			horizontal().append($addPerson),
			horizontal().append(
				$transferPlan.append(
					div("small-text").html(whiteSpace(1)),
					horizontal().append($transferHeader), 
					div("small-text").html(whiteSpace(1)),
					$transfers)));
	};
	
	return {
		"create": create,
		"update": update
	};
};
