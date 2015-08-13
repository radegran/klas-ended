var DataHelper = function(data, onChange)
{
	var eachPerson = function(callback)
	{
		var makePerson = function(name, diff, nameIndex)
		{
			var eachPayment = function(callback2)
			{
				for (var j = 0; j < data.payments.length; j++)
				{
					var v = data.payments[j].values[nameIndex];
					if (v[0] != 0 || v[1] != 0)
					{
						callback2(data.payments[j].text, v[0] - v[1]);
					}
				}
			};
			
			var setName = function(newName)
			{
				if (data.names[nameIndex] !== newName)
				{						
					data.names[nameIndex] = newName;
					onChange();
				}
			};
			
			var remove = function()
			{
				alert("not implemented!");
				return;
				
				// data.names.splice(nameIndex, 1);
				// $.each(data.payments, function(j, p) {
					// p.values.splice(nameIndex, 1);
				// });
				// onChange();
			};
			
			callback({
				"key": nameIndex,
				"name": name,
				"diff": diff,
				"eachPayment": eachPayment,
				"setName": setName,
				"remove": remove
			});
		};
		
		for (var i = 0; i < data.names.length; i++)
		{
			var name = data.names[i];
			var diff = 0;
			
			for (var j = 0; j < data.payments.length; j++)
			{
				diff += data.payments[j].values[i][0];
				diff -= data.payments[j].values[i][1];
			}
			
			makePerson(name, diff, i);
		}
	};
	
	var name = function(index)
	{
		return data.names[index];
	};
	
	var addPerson = function()
	{
		data.names.push("XXX");
		$.each(data.payments, function(i, p) {
			p.values.push([0,0]);
		});
		onChange();
	};
	
	var title = function(value)
	{
		if (value === undefined)
		{
			return data.title;
		}
		
		data.title = value;
		onChange();
	};
	
	var eachPayment = function(callback)
	{
		var makePayment = function(index)
		{
			var payment = data.payments[index];
			
			var cost = function()
			{
				var c = 0;
				
				for (var i = 0; i < payment.values.length; i++)
				{
					c += payment.values[i][0];
				}
				
				return c;
			};
			
			var text = function()
			{
				return payment.text;
			}
			
			callback({
				"cost": cost,
				"text": text
			});
		};
		
		for (var j = data.payments.length - 1; j >= 0; j--)
		{
			makePayment(j);
		}
	};
	
	var emptyPayment = function()
	{
		var p = {
			"text": "Beskrivning...",
			"values": []
		};
		
		for (var i = 0; i < data.names.length; i++)
		{
			p.values.push([0, 0]);
		}
		
		return p;
	};
	
	return {
		"eachPerson": eachPerson,
		"eachPayment": eachPayment,
		"name": name,
		"addPerson": addPerson,
		"title": title,
		"names": function() { return data.names; },
		"emptyPayment": emptyPayment
	};
}

var editable = function(text, onChange)
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

var StatsUI = function(dataHelper)
{
	var $stats = null;
	var $transferPlan = null;
	
	var update = function()
	{
		$stats.empty();
		$transferPlan.empty();
		
		var balances = [];
		
		dataHelper.eachPerson(function(person)
		{
			balances.push(person.diff);

			var $details = $("<div/>").css("font-size", "0.7em").hide();
			person.eachPayment(function(text, diff)
			{
				$details.append($("<div/>").append(
					$("<span/>").text(text),
					$("<span/>").text(diff)));
			});
			
			var $stat = $("<div/>").append(
				$("<span/>").text(person.name),
				$("<span/>").text(person.diff),
				$details);
				
			$stat.on("click", function() { $details.slideToggle('fast'); });
				
			$stats.append($stat);
		});
		
		var plan = transferPlan(balances);
		
		$.each(plan, function(i, transfer)
		{
			// Improve UI
			var $plan = $("<div/>").text(
				dataHelper.name(transfer.from) +
				" ska ge " +
				transfer.amount + 
				" till " +
				dataHelper.name(transfer.to));
			
			$transferPlan.append($plan);
		});
	};
	
	var create = function($parent)
	{
		$stats = $("<div/>");
		$transferPlan = $("<div/>");
		$parent.append($stats, $transferPlan);
	};
	
	return {
		"create": create,
		"update": update
	};
};

var PeopleUI = function(dataHelper)
{
	var $names = $();
	var $add = $();
	
	var create = function($parent)
	{
		$names = $("<div/>");
		$add = $("<div/>")
			.addClass("add-button")
			.text("(+)")
			.on("click", function() { dataHelper.addPerson(); });
		
		$parent.append($names, $add);
	};
	
	var update = function()
	{
		$names.empty();
		
		dataHelper.eachPerson(function(person)
		{
			var $name = $("<div/>");
			
			var editableName = editable(person.name, function(newName) { person.setName(newName)});
			var $name = editableName.element();
			var $edit = $("<span/>").text("(...)").on("click", function() { editableName.editMode() });
			var $remove = $("<span/>").text("(X)").on("click", function() { person.remove(); });
			
			$row = $("<div/>").addClass("flex-horizontal-container").append(
				$name,
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

var MainUI = function(statsUI, paymentUI, peopleUI, dataHelper)
{
	var $header = null;
	
	var create = function($parent)
	{
		var $root = $("<div/>").addClass("ui-root flex-vertical-container");
		$header = $("<div/>").addClass("ui-header small-padding");
		var $topNavigation = $("<div/>").addClass("ui-navigation-bar flex-horizontal-container small-padding");
		var $statusBar = $("<div/>").addClass("ui-status-bar small-padding").text("status").hide();
		var $contentContainer = $("<div/>").addClass("scrollable ui-content-container flex-grow small-padding");
		
		var $statsContent = $("<div/>").addClass("ui-content");
		var $paymentContent = $("<div/>").addClass("ui-content");
		var $peopleContent = $("<div/>").addClass("ui-content");
		
		var $overviewNav = $("<div/>").addClass("flex-grow").text("stats");
		var $paymentsNav = $("<div/>").addClass("flex-grow").text("payments");
		var $peopleNav = $("<div/>").addClass("flex-grow").text("people");

		$overviewNav.on("click", function() { $(".ui-content").hide(); $statsContent.show().focus(); });
		$paymentsNav.on("click", function() { $(".ui-content").hide(); $paymentContent.show().focus(); });
		$peopleNav.on("click", function() { $(".ui-content").hide(); $peopleContent.show().focus(); });
		
		statsUI.create($statsContent);
		paymentUI.create($paymentContent);
		peopleUI.create($peopleContent);
		
		$parent.empty().addClass("ui-parent");
		$parent.append(
			$root.append(
				$header,
				$topNavigation.append(
					$overviewNav,
					$paymentsNav,
					$peopleNav),
				$statusBar,
				$contentContainer.append(
					$statsContent,
					$paymentContent,
					$peopleContent)));
					
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
		var editableHeader = editable(dataHelper.title(), function(newValue)
		{
			dataHelper.title(newValue)
		});
		$header.empty();
		$header.append(editableHeader.element().on("click", function() { editableHeader.editMode(); }));
		
		statsUI.update();
		paymentUI.update();
		peopleUI.update();
	};
	
	return {
		"create": create,
		"update": update
	};
};

var data = {
	"title": "Skriv en titel här",
	"names": ["Klas", "Göran", "Berit"],
	"payments": [
		{"text": "Berit köper pizza till allihop", "values": [[0, 70], [0, 70], [210, 70]]},
		{"text": "Göran köper öl till sig själv och Berit", "values": [[0, 0], [140, 70], [0, 70]]},
		{"text": "Klas ger 100 kr till Göran", "values": [[100, 0], [0, 100], [0, 0]]}
	]
};

$(document).ready(function () 
{
	$(function() { FastClick.attach(document.body); });
	
	var ui;
	
	var dataHelper = DataHelper(data, function() { ui.update(); });
	
	var ui = MainUI(StatsUI(dataHelper), 
				    PaymentUI(AddWizard(dataHelper), dataHelper), 
					PeopleUI(dataHelper),
					dataHelper);
	
	ui.create($(document.body));
	ui.update();
});