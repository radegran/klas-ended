var editable = function(text, onChange)
{
	onChange = onChange || $.noop;
	
	var $e = $("<span/>").html(text);
	var $input = $("<input/>").hide();
	var $cont = $("<span/>").append($e, $input);
	
	var editMode = function()
	{
		$input.val("");
		$input.css("width", $e.width() + 5);
		$e.hide(); $input.show().focus().on("blur", function()
		{
			$input.trigger("change");
		});
	};
	
	var set = function(value)
	{
		$e.html(value);
	};
	
	$input.on("input paste", function()
	{
		var v = $input.val();
		$e.html(v);
		$input.css("width", $e.width() + 5);
	});

	$input.on("submit change", function()
	{
		var v = $input.val();
		$e.html(v);
		$e.show(); $input.hide();
		onChange(v);
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
	
var horizontal = function(classNames)
{
	return $("<div/>").addClass("flex-horizontal-container flex-justify-center " + (classNames || ""));
};

var vertical = function(classNames)
{
	return $("<div/>").addClass("flex-vertical-container " + (classNames || ""));
};

var div = function(classNames)
{
	return $("<div/>").addClass(classNames);
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
	var $note = null;
	var $addWizard = null;
	var $stats = null;
	var $transferPlan = null;
	var $transfers = null;
	
	var hideWizard = function()
	{
		$addWizard.hide();
		$stats.show();
		$transferPlan.show();
		$note.show();
	}
	
	var editPayment = function(index)
	{
		$addWizard.show();
		$stats.hide();
		$transferPlan.hide();
		$note.hide();
		addWizard.show($addWizard.empty(), hideWizard, index);
	};
	
	var update = function()
	{
		$stats.empty();
		$transfers.empty();
		$transferPlan.hide();
		$note.hide();
		
		var balances = [];
		var persons = [];
		
		var dh = model.getDataHelper();
		
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
		
		// more note code... DRY!
		var note = function(text)
		{
			$note.html($("<div/>")
				.addClass("flex-horizontal-container flex-justify-center")
				.append($("<span/>").html(text))).show();
		};
		
		if (dh.names().length == 0)
		{
			note(L.AddPersonsFirst);
			return;
		}
	};
	
	var create = function($parent)
	{
		var $transferHeader = $("<div/>").text(L.MakeEven);
		$stats = $("<div/>");
		$note = $("<note/>");
		$transferPlan = $("<div/>");
		$transfers = $("<div/>").addClass("small-text");
		$addWizard = $("<div/>").hide();
		$parent.append(
			$note,
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
	
	var create = function($parent)
	{
		$names = $("<div/>");
		var $add = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
			$("<div/>")
				.addClass("people-add")
				.on("click", function() { var dh = model.getDataHelper(); dh.addPerson(L.Name); dh.commit(); }));
		
		$parent.append($add, $names);
	};
	
	var update = function()
	{
		$names.empty();
		
		var dh = model.getDataHelper();
		
		var personList = [];
		
		dh.eachPerson(function(person)
		{
			personList.push(person);
		});
		
		personList = personList.reverse();
		
		$.each(personList, function(i, person) 
		{
			var $name = $("<div/>");
			
			var editableName = editable(person.name, function(newName) { person.setName(newName || "?"); dh.commit(); });
			var $name = editableName.element();
			var $confirm = $("<div/>").hide()
				.addClass("confirm-remove")
				.text("Ta bort")
				.on("click", function() { person.remove(); dh.commit(); });
				
			var $remove = $("<div/>")
				.addClass("people-remove")
				.on("click", function(e) { $confirm.toggle('fast'); e.stopPropagation(); });
				
			$row = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$confirm,
				$name.addClass("flex-grow"),
				$("<span/>").html(whiteSpace(3)),
				$remove);

			$names.append($row);
		});
		
		var noNamesYet = $names.find("*").length == 0;
		
		if (noNamesYet)
		{
			var $info = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$("<span/>").text(L.AddPersonsHere));
				
			$names.append($info);
		}
	};
	
	return {
		"create": create,
		"update": update
	};
};

var HelpUI = function(model, net, networkStatus)
{
	var create = function($parent)
	{
		// $helpContainer.addClass("help-container yellow");
		
		// var text = function(content)
		// {
			// return $("<div/>").addClass("help-text").append($("<span/>").html(content));
		// };
		
		// var header = function(content)
		// {
			// return $("<div/>").addClass("help-header").append($("<span/>").html(content));
		// };
		
		// $helpContainer.append(
			// header("&nbsp;"),
			// header(L.HelpHeader1),
			// text(L.HelpText1),
			// header(L.HelpHeader2),
			// text(L.HelpText2),
			// header(L.HelpHeader3),
			// text(L.HelpText3),
			// header(L.HelpHeader4),
			// text(L.HelpText4),
			// header(L.HelpHeader5),
			// text(L.HelpText5),
			// text("&nbsp;"));
			
		var $urlContainer = div("big-margin").append(
			horizontal().html(L.CopyUrlInfo).addClass("small-text big-margin"),
			horizontal().html(window.location.href).addClass("small-text"),
			div("big-margin").html(whiteSpace(1))
		);
			
		var $container = vertical();
		
		var emailSent = false;
		var updateSubmitButton;
		
		var $textArea = $("<textarea/>").addClass("big-margin small-text")
			.val(L.CommentSample)
			.attr("cols", 20)
			.attr("rows", 6)
			.on("input paste", function() { updateSubmitButton(); });
		var $inputEmail = $("<input/>").addClass("big-margin small-text")
			.css("width", "15em")
			.css("padding", "0.2em")
			.css("border", "1px solid rgb(79,93,115)")
			.attr("placeholder", L.ExampleEmail)
			.on("input paste", function() { updateSubmitButton(); });
		var $submit = $("<button/>").addClass("help-button big-margin").on("click", function() {
			net.sendmail({"message": $textArea.val(), "from": $inputEmail.val()});
			emailSent = true;
			updateSubmitButton();
			$textArea.val(L.ThankYou);
			
			setTimeout(function() 
			{ 				
				emailSent = false;
				updateSubmitButton();
			}, 2000);
		});
		
		updateSubmitButton = function()
		{
			var enabled =(networkStatus.isOnline && $textArea.val() != "" && !emailSent && $inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/) > -1)
			$submit.attr("disabled", !enabled);
			if (enabled)
			{
				$submit.removeClass("transparent");
			}
			else
			{
				$submit.addClass("transparent");
			}
		};
		
		networkStatus.onChanged(function() { updateSubmitButton(); });
		
		$container.append($urlContainer, $textArea, horizontal().append($inputEmail), horizontal().append($submit));
		$parent.append(horizontal().append($container));
		
		updateSubmitButton();
	};
	
	return {
		"create": create
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

var MainUI = function(statsUI, paymentUI, peopleUI, headerUI, helpUI)
{
	var $overviewNav;
	var $paymentsNav;
	var $peopleNav;
	var $helpNav;
	var $header;
	var $topNavigation;
	var $topNavigationAlternative;
	
	var create = function($parent)
	{
		var $root = $("<div/>").addClass("ui-root flex-vertical-container");
		$header = $("<div/>");
		$topNavigation = $("<div/>").addClass("ui-navigation-bar flex-horizontal-container flex-justify-center small-padding");
		$topNavigationAlternative = $("<div/>").addClass("ui-navigation-bar flex-horizontal-container flex-justify-center small-padding");
		var $statusBar = $("<div/>").addClass("ui-status-bar flex-horizontal-container flex-justify-center messagecontainer");
		var $contentContainer = $("<div/>").addClass("ui-content-container flex-grow small-padding");
		
		var $paymentContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $peopleContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $statsContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $helpContentFlex = $("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");
		var $headerFlex = $("<div/>").addClass("ui-header small-padding flex-horizontal-container flex-justify-center");
		
		var $peopleContent = $("<div/>");
		var $paymentContent = $("<div/>");
		var $statsContent = $("<div/>");
		var $helpContent = $("<div/>");
		
		$overviewNav = $("<div/>").addClass("nav nav-stats");
		$paymentsNav = $("<div/>").addClass("nav nav-payments");
		$peopleNav = $("<div/>").addClass("nav nav-people");
		$helpNav = $("<div/>").addClass("nav nav-help");
		
		var navClick = function()
		{
			$(".ui-content").hide();
			$('.nav').addClass("transparent"); 
			$(this).removeClass("transparent");
		};

		$overviewNav.on("click", function() { navClick.call(this); $statsContentFlex.show().focus(); });
		$paymentsNav.on("click", function() { navClick.call(this); $paymentContentFlex.show().focus(); });
		$peopleNav.on("click", function() { navClick.call(this); $peopleContentFlex.show().focus(); });
		$helpNav.on("click", function() { navClick.call(this); $helpContentFlex.show().focus(); });
		
		statsUI.create($statsContent);
		paymentUI.create($paymentContent);
		peopleUI.create($peopleContent);
		helpUI.create($helpContent);
		headerUI.init($header);
		
		$parent.empty().addClass("ui-parent");
		$parent.append(
			$root.append(
				$headerFlex.append($header),
				$topNavigation.append(
					$peopleNav,
					$paymentsNav,
					$overviewNav,
					$helpNav),
				$topNavigationAlternative.hide(),
				$statusBar,
				$contentContainer.append(
					$statsContentFlex.append($statsContent),
					$paymentContentFlex.append($paymentContent),
					$peopleContentFlex.append($peopleContent),
					$helpContentFlex.append($helpContent))));
		
		// General stuff...
		$(window).on("click", function() { $(".confirm-remove").hide('fast'); });

	};
	
	var update = function()
	{
		headerUI.update();
		statsUI.update();
		paymentUI.update();
		peopleUI.update();
	};
	
	var fullScreen = function($withTopNavigation)
	{
		if ($withTopNavigation)
		{
			$header.hide();
			$topNavigation.hide();
			$topNavigationAlternative.append($withTopNavigation).show();
		}
		else
		{
			$header.show();
			$topNavigation.show();
			$topNavigationAlternative.empty().hide();
		}
	};
	
	return {
		"create": create,
		"update": update,
		"navPeople": function() { $peopleNav.trigger('click'); },
		"navPayments": function() { $paymentsNav.trigger('click'); },
		"navStats": function() { $overviewNav.trigger('click'); },
		"fullScreen": fullScreen
	};
};

var setStartPage = function(mainUi, model)
{
	var dh = model.getDataHelper();
	
	if (dh.names().length == 0)
	{
		mainUi.navPeople();
	}
	else
	{
		mainUi.navPayments();
	}
};