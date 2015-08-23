var StatsUI = function(addWizard, model)
{
	var $addWizard = null;
	var $stats = null;
	var $transferPlan = null;
	var $transfers = null;
	var $addPerson = null;
	
	var hideWizard = function()
	{
		$addWizard.hide();
		$stats.show();
		$transferPlan.show();
	}
	
	var editPayment = function(index)
	{
		$addWizard.show();
		$stats.hide();
		$transferPlan.hide();
		addWizard.show($addWizard.empty(), hideWizard, index);
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
			
			$personSummary = $("<div/>").addClass("flex-horizontal-container person-summary").append(
				$("<span/>").html(person.name + whiteSpace(3)).addClass("flex-grow"),
				$("<span/>").html(formatMoney(person.diff, true)));
			
			var $stat = $("<div/>").append(
				$personSummary,
				$details);
				
			$personSummary.on("click", function() { $details.slideToggle('fast'); });
				
			$stats.append($stat);
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
		$addWizard = $("<div/>").hide();
		$addPerson = div("person-add");
		
		$parent.append(
			$addWizard, 
			horizontal().append($stats), 
			horizontal().append(
				$transferPlan.append(
					$("<div/>").html(whiteSpace(1)),
					$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($transferHeader), 
					$("<div/>").html(whiteSpace(1)),
					$transfers)),
			horizontal().append($addPerson));
	};
	
	return {
		"create": create,
		"update": update
	};
};
