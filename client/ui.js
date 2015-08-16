﻿var editable = function(text, onChange)
{
	onChange = onChange || $.noop;
	
	var $e = $("<span/>").html(text);
	var $input = $("<input/>").hide();
	var $cont = $("<span/>").append($e, $input);
	
	var editMode = function()
	{
		$input.val($e.html());
		$e.hide(); $input.show().focus().on("blur", function()
		{
			$input.trigger("change");
		});
	};
	
	var set = function(value)
	{
		$e.html(value);
	};

	$input.on("change", function()
	{
		$e.html($input.val());
		$e.show(); $input.hide();
		onChange($input.val());
	});
	
	$e.on("click", editMode);
	
	return {
		"editMode": editMode,
		"element": function() { return $cont; },
		"set": set
	}
};

var whiteSpace = function(count)
{
	var str = "";
	while(count--)
	{
		str += "&nbsp;";
	}
	return str;
};

var formatMoney = function(value, keepDecimals)
{
	var color = (value > 0) ? "green" : (value < 0 ? "red" : "");
	var fixed = value.toFixed(2);
	var split = ("" + fixed).split(".");
	var isNaturalNumber = (split[1] === "00");
	var ret = "";
	
	if (isNaturalNumber && !keepDecimals)
	{
		ret = parseInt(split[0]);
	}
	else 
	{
		ret = fixed;
	}
	
	return $("<span/>").css("color", color).text(ret);
}

var StatsUI = function(addWizard, model)
{
	var $addWizard = null;
	var $stats = null;
	var $transferPlan = null;
	var $transfers = null;
	
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
		
		dh.eachPerson(function(person)
		{
			persons.push(person);
		});
		
		persons = persons.sort(function(p1, p2) 
		{ 
			return p1.diff - p2.diff;
		});
		
		$.each(persons, function(i, person)
		{
			balances.push(person.diff);

			var $details = $("<div/>").addClass("small-text").hide();
			
			person.eachPayment(function(payment)
			{	
				var diff = payment.valuePair()[0] - payment.valuePair()[1];
				if (diff === 0)
				{
					return;
				}
				
				var $detail = $("<div/>").addClass("clickable-payment flex-horizontal-container").append(
					$("<span/>").html(payment.text() + whiteSpace(3)).addClass("flex-grow"),
					$("<span/>").html(formatMoney(diff, true))).on("click", function()
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
				$("<span/>").html(dh.name(transfer.from) + " ska ge "),
				formatMoney(transfer.amount), 
				$("<span/>").html(" till " + dh.name(transfer.to)));
			
			$transfers.append($plan);
			
			$transferPlan.show();
		});
	};
	
	var create = function($parent)
	{
		var $transferHeader = $("<div/>").text("Utjämnande överföringar");
		$stats = $("<div/>");
		$transferPlan = $("<div/>");
		$transfers = $("<div/>").addClass("small-text");
		$addWizard = $("<div/>").hide();
		$parent.append(
			$addWizard, 
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($stats), 
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$transferPlan.append(
					$("<div/>").html(whiteSpace(1)),
					$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($transferHeader), 
					$("<div/>").html(whiteSpace(1)),
					$transfers)));
	};
	
	return {
		"create": create,
		"update": update
	};
};

var PeopleUI = function(model)
{
	var $names = $();
	var $add = $();
	
	var create = function($parent)
	{
		$names = $("<div/>");
		$add = $("<div/>")
			.addClass("people-add")
			.on("click", function() { var dh = model.getDataHelper(); dh.addPerson(); dh.commit(); });
		
		$parent.append($names, $add);
	};
	
	var update = function()
	{
		$names.empty();
		
		var dh = model.getDataHelper();
		
		dh.eachPerson(function(person)
		{
			var $name = $("<div/>");
			
			var editableName = editable(person.name, function(newName) { person.setName(newName); dh.commit(); });
			var $name = editableName.element();
			var $edit = $("<div/>").addClass("people-edit").on("click", function() { editableName.editMode() });
			var $remove = $("<div/>").addClass("people-remove").on("click", function() { person.remove(); dh.commit(); });
			
			$row = $("<div/>").addClass("flex-horizontal-container").append(
				$name.addClass("flex-grow"),
				$("<span/>").html(whiteSpace(3)),
				$edit,
				$remove);

			$names.append($row);
		})
	};
	
	return {
		"create": create,
		"update": update
	};
};

var HeaderUI = function(model)
{
	var $header = null;
	
	var update = function()
	{
		var dataHelper = model.getDataHelper();
		
		var title = dataHelper.title();
		title = (title == "") ? "..." : title;
		
		var editableHeader = editable(title, function(newValue)
		{
			dataHelper.title(newValue);
			dataHelper.commit();
		});
		
		$header.empty();
		$header.append(editableHeader.element().on("click", function() { editableHeader.editMode(); }));
		
	};
	
	var init = function($headerElem)
	{
		$header = $headerElem;
	};
	
	return {
		"update": update,
		"init": init
	};
};

var MainUI = function(statsUI, paymentUI, peopleUI, headerUI)
{
	var create = function($parent)
	{
		var $root = $("<div/>").addClass("ui-root flex-vertical-container");
		var $header = $("<div/>");
		var $topNavigation = $("<div/>").addClass("ui-navigation-bar flex-horizontal-container flex-justify-center small-padding");
		var $statusBar = $("<div/>").addClass("ui-status-bar small-padding").text("status").hide();
		var $contentContainer = $("<div/>").addClass("scrollable ui-content-container flex-grow small-padding");
		
		var $paymentContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $peopleContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $statsContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $headerFlex = $("<div/>").addClass("ui-header small-padding flex-horizontal-container flex-justify-center");
		
		var $peopleContent = $("<div/>");
		var $paymentContent = $("<div/>");
		var $statsContent = $("<div/>");
		
		var $overviewNav = $("<div/>").addClass("nav nav-stats");
		var $paymentsNav = $("<div/>").addClass("nav nav-payments");
		var $peopleNav = $("<div/>").addClass("nav nav-people");
		
		var navClick = function()
		{
			$(".ui-content").hide();
			$('.nav').addClass("transparent"); 
			$(this).removeClass("transparent");
		};

		$overviewNav.on("click", function() { navClick.call(this); $statsContentFlex.show().focus(); });
		$paymentsNav.on("click", function() { navClick.call(this); $paymentContentFlex.show().focus(); });
		$peopleNav.on("click", function() { navClick.call(this); $peopleContentFlex.show().focus(); });
		
		statsUI.create($statsContent);
		paymentUI.create($paymentContent);
		peopleUI.create($peopleContent);
		headerUI.init($header);
		
		$parent.empty().addClass("ui-parent");
		$parent.append(
			$root.append(
				$headerFlex.append($header),
				$topNavigation.append(
					$overviewNav,
					$paymentsNav,
					$peopleNav),
				$statusBar,
				$contentContainer.append(
					$statsContentFlex.append($statsContent),
					$paymentContentFlex.append($paymentContent),
					$peopleContentFlex.append($peopleContent))));
					
		// Remove...
		$paymentsNav.trigger("click");
		
		// document.addEventListener('touchmove', function(e) {
// if (document.querySelector('.scrollable').contains(e.target)) {
// return;
// }

// e.preventDefault();
// }, true);

	};
	
	var update = function()
	{
		headerUI.update();
		statsUI.update();
		paymentUI.update();
		peopleUI.update();
	};
	
	return {
		"create": create,
		"update": update
	};
};