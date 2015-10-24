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
			
			// Payment details for person
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
					div("flex-no-shrink").html(formatMoney(diff, true)),
					rightArrow()).on("click", function(e)
					{
						e.stopPropagation();
						editPayment(payment.index);
					});
				
				$detail.css("background-color", (diff > 0 ? "#F0FFF0": (diff < 0 ? "#FFF0F0" : "transparent")));
				//$detail.css("border-color", (diff > 0 ? "#B0FFB0": (diff < 0 ? "#FFB0B0" : "lightgray")));
					
				$details.prepend($detail);
			});
			
			// Person summary
			var $removeButton = div("volatile people-remove").load("x.svg").hide();
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
			var $plan = horizontal("transfer-div").append(
				div().html(dh.name(transfer.from)),
				div("flex-no-shrink").append(
					horizontal().append(
						div().html(whiteSpace(1) + L.ShouldGive + whiteSpace(1)), 
						div().append(formatMoney(transfer.amount).css("padding", 0)), 
						div().html(whiteSpace(1) + L.To + whiteSpace(1))
					)
				),
				div().html(dh.name(transfer.to))
			);
			
			$transfers.append(
			    $plan
			);
			
			$transferPlan.show();
		});
	};

	var create = function($parent)
	{
		var $transferHeader = div("section-header").html(L.MakeEven + whiteSpace(1));
		$stats = vertical("person-summaries");
		$transferPlan = vertical();
		$transfers = vertical();
		$addPersonHelp = div().html("Lägg till personer här").css("cursor", "pointer").hide();
		$addPerson = horizontal().append(
			div("person-add").load("plus-person.svg"),
			$addPersonHelp
		);
		
		$parent.append(
			$stats,
			horizontal().append($addPerson),
			horizontal().append(
				$transferPlan.append(
					div("small-text").html(whiteSpace(1)),
					horizontal().append($transferHeader),
					$transfers)));
	};
	
	return {
		"create": create,
		"update": update
	};
};
