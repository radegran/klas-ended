var PayModel = function(names, payment, allActiveDefault, onRemove)
{
	var persons = [];
	
	var eachPerson = function(callback)
	{
		$.each(names, function(i, name)
		{
			var updateCallback = $.noop;
			
			var p = {
				"isActive": allActiveDefault || payment.values[i][0] !== 0 || payment.values[i][1] !== 0,
				"pay": payment.values[i][0],
				"expense": payment.values[i][1],
				"isLocked": false,
				"update": function() { updateCallback(p.isActive, p.pay, p.expense, p.isLocked); }
			};
			
			var onUpdate = function(updateCallback_)
			{
				updateCallback = updateCallback_
				p.update();
			};
			
			var iteratePersons = function(itCallback)
			{
				for (var j = 0; j < persons.length; j++)
				{
					itCallback(persons[j].internal, j == i); // arg2: isMe
				}			
			};
			
			var updateAll = function()
			{
				iteratePersons(function(it) { it.update(); });
			};
			
			var otherUnlockedActiveFilter = function(cb)
			{
				return function(it, isMe)
				{
					if (!isMe && it.isActive && !it.isLocked)
					{
						cb(it);
					}
				}
			};
			
			var unlockedActiveFilter = function(cb)
			{
				return function(it, isMe)
				{
					if (it.isActive && !it.isLocked)
					{
						cb(it);
					}
				}
			};
			
			var distributeExpense = function(contrib, includeMe)
			{	
				// Distribute equally
				
				var notDistributed = 0;
				var numCandidates = 0;
				
				var isCandidate = function(it)
				{
					return (contrib > 0 ? it.expense > 0 : true);
				};
				
				var filter = includeMe ? unlockedActiveFilter : otherUnlockedActiveFilter;
				
				iteratePersons(filter(function(it) 
				{ 
					if (isCandidate(it))
					{
						numCandidates++; 
					}
				}));
				
				iteratePersons(filter(function(it)
				{
					if (isCandidate(it))
					{
						it.expense -= contrib / numCandidates;
						if (it.expense < 0)
						{
							notDistributed -= it.expense;
							it.expense = 0;
						}
					}
				}));
				
				if (notDistributed > 0.01)
				{
					distributeExpense(notDistributed);
				}
			}
			
			var toggleActive = function()
			{
				if (!p.isActive)
				{
					p.isActive = true;
					p.update();
					return;
				}
				
				var expense = p.expense;
				var pay = p.pay;
				var contrib = pay - expense;
				p.expense = 0;
				p.pay = 0;
				p.isActive = false;
				p.isLocked = false;
	
				distributeExpense(contrib);
				updateAll();
			};
			
			var expense = function(value)
			{
				if (value < 0)
				{
					p.update();
					return;
				}
				
				var numUnlockedOthers = 0;
				var expenseUnlockedOthers = 0;
				
				iteratePersons(otherUnlockedActiveFilter(function(it) 
				{ 
					expenseUnlockedOthers += it.expense;
					numUnlockedOthers++; 
				}));
				
				if (numUnlockedOthers === 0)
				{
					// Only me is unlocked
					p.update();
					return;
				}
				
				value = Math.min(value, p.expense + expenseUnlockedOthers);
								
				p.isLocked = true;
				var contrib = value - p.expense;
				p.expense = value;
				
				distributeExpense(contrib);	
				updateAll();				
			};
			
			var pay = function(value)
			{
				if (value < 0)
				{
					p.update();
					return;
				}
				
				var contrib = p.pay - value;
				p.pay = value;
				
				iteratePersons(function(it) { it.isLocked = false; });
				distributeExpense(contrib, true);
				updateAll();
			};
			
			var lock = function(shouldLock)
			{
				p.isLocked = shouldLock;
				p.update();
			};
			
			var external = {
				"name": name,
				"onUpdate": onUpdate,
				"toggleActive": toggleActive,
				"expense": expense,
				"pay": pay,
				"lock": lock
			};
			
			persons.push({"external": external, "internal": p});

			callback(external);
		});
	};
	
	return {
		"remove": onRemove,
		"eachPerson": eachPerson
	};
};

var AddWizard = function(dataHelper)
{
	var Nav = function(rollback)
	{
		var $close = $("<span/>").text("(X)").on("click", rollback);
		var $next = $("<span/>").text("(>)").on("click", $.noop);
		
		var $nav = $("<div/>").append($next, $close);
		
		return {
			"element": function() { return $nav; }
		};
	}
	
	var $table;
	
	var show = function($parent, payModel)
	{
		var nav = Nav(payModel.remove);
		
		var editableTitle = editable("title...");
		var $title = editableTitle.element().on("click", editableTitle.editMode);
		
		$table = $("<table/>");
		
		payModel.eachPerson(function(person)
		{
			var editablePayment = editable(0, function(value) { person.pay(value); });
			var editableExpense = editable(0, function(value) { person.expense(value); });
			var locked = false;
						
			var $active = $("<span/>");
			var $payment = editablePayment.element();
			var $expense = editableExpense.element();
			var $locked = $("<span/>").on("click", function() { person.lock(!locked);});
			
			var $label = $("<div/>").append($active, $("<span/>").text(person.name))
				.on("click", person.toggleActive);
			
			person.onUpdate(function(isActiveicipating, payValue, expenseValue, isLocked)
			{
				if (isActiveicipating)
				{
					$active.text("(y)");
					$payment.show();
					$expense.show();
					$locked.show();
				}
				else
				{
					$active.text("(n)");
					$payment.hide();
					$expense.hide();
					$locked.hide();
				}
				
				editablePayment.set(payValue);
				editableExpense.set(expenseValue);
				locked = isLocked;
				$locked.text(isLocked ? "(L)" : "(N)");
			});
			
			var $row = $("<tr/>").append(
				$("<td/>").append($label), 
				$("<td/>").append($payment), 
				$("<td/>").append($expense),
				$("<td/>").append($locked));
			
			$table.append($row);
		});
		
		$parent.append($title, $table, nav.element());
	};
	
	return {
		"show": show
	};
};

var PaymentUI = function(addWizard, dataHelper)
{
	var $addButton = null;
	var $history = null;
	var $addWizard = null;
	
	var hideWizard = function()
	{
		$history.show();
		$addButton.show();
		$addWizard.hide();
	};
	
	var createAddWizard = function()
	{
		var payModel = PayModel(dataHelper.names(), dataHelper.emptyPayment(), true, function() { hideWizard(); });
		
		$addButton.hide();
		$history.hide();
		addWizard.show($addWizard.empty().show(), payModel);
	};
	
	var create = function($parent)
	{
		$history = $("<div/>");
		$addWizard = $("<div/>");
		$addButton = $("<div/>")
			.addClass("add-button")
			.text("New payment")
			.on("click", createAddWizard);
		
		$parent.append($addButton, $history, $addWizard);
	};
	
	var update = function()
	{
		$history.empty();
		hideWizard();	
		
		dataHelper.eachPayment(function(payment)
		{
			var $p = $("<div/>");
			var $label = $("<span/>").html(payment.text());
			var $cost = $("<span/>").html(payment.cost());
			
			$history.append($p.append($label, $cost));
		});
	};
	
	return {
		"create": create,
		"update": update
	};
};
