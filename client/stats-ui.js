var StatsUI = function(paymentWizard, model)
{
	var $stats = null;
	var $transferPlan = null;
	var $transfers = null;
	var $addPerson = null;
	
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
		
		$.each(persons, function(i, person)
		{
			var $details = $("<div/>").addClass("small-text").hide();
			
			// Paymeny details for person
			person.eachPayment(function(payment)
			{	
				var diff = payment.valuePair()[0] - payment.valuePair()[1];
				if (diff === 0)
				{
					return;
				}
				
				var $detail = $("<div/>").addClass("clickable-payment flex-horizontal-container flex-justify-center").append(
					$("<div/>").html(payment.text() + whiteSpace(3)).addClass("flex-grow"),
					$("<div/>").html(formatMoney(diff, true))).on("click", function()
					{
						editPayment(payment.index);
					});
					
				$details.append($detail);
			});
			
			// Person summary
			var $removeButton = div("volatile").text("(X)").hide();
			var $editButton = div("volatile").text("(...)").hide();
			var $confirm = div("volatile confirm-remove").text(L.Remove).hide();
			var editableName = editable(person.name, function(newValue) { person.setName(newValue); dh.commit(); });
			var $name = editableName.element();
			
			$personSummary = vertical("person-summary volatile-container").append(
				horizontal().append(
					$confirm,
					$editButton,
					$name.addClass("flex-grow"),
					div().html(whiteSpace(3)),
					$("<span/>").html(formatMoney(person.diff, true)),
					$removeButton
				),
				$details.addClass("volatile")
			);
			
			$removeButton.on("click", function() { $confirm.show('fast'); });
			$editButton.on("click", function() { editableName.editMode(); });
			$confirm.on("click", function() { person.remove(); dh.commit(); });
			
			$personSummary.on("click", function() 
			{ 
				$("person-summary").not(this).find(".volatile").hide('fast');
				$details.show('fast');
				$editButton.show('fast');
				$removeButton.show('fast');
			});
				
			$stats.append($personSummary);
		});
		
		var plan = transferPlan(balances);
		
		$.each(plan, function(i, transfer)
		{
			// Improve UI
			var $plan = $("<div/>").append(
				$("<span/>").html(dh.name(transfer.from) + " " + L.ShouldGive + " "),
				formatMoney(transfer.amount), 
				$("<span/>").html(" " + L.To + " " + dh.name(transfer.to)));
			
			$transfers.append($plan);
			
			$transferPlan.show();
		});
	};

	var create = function($parent)
	{
		var $transferHeader = $("<div/>").text(L.MakeEven);
		$stats = $("<div/>");
		$transferPlan = $("<div/>");
		$transfers = $("<div/>").addClass("small-text");
		$paymentWizard = $("<div/>").hide();
		$addPerson = div("person-add");
		
		$parent.append(
			$paymentWizard, 
			horizontal().append($stats),
			horizontal().append($addPerson),
			horizontal().append(
				$transferPlan.append(
					$("<div/>").html(whiteSpace(1)),
					horizontal().append($transferHeader), 
					$("<div/>").html(whiteSpace(1)),
					$transfers)));
	};
	
	return {
		"create": create,
		"update": update
	};
};
