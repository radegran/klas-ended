﻿var PayModel = function(names, payment, allActiveDefault)
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
				"update": function() 
				{ 
					payment.values[i][0] = p.pay;
					payment.values[i][1] = p.expense;
					updateCallback(p.isActive, p.pay, p.expense, p.isLocked); 
				}
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
		"eachPerson": eachPerson
	};
};

var AddWizard = function(model)
{
	var Nav = function(onSave, onClose)
	{
		var $close = $("<span/>").text("(X)").on("click", onClose);
		var $save = $("<span/>").text("(Save)").on("click", onSave);
		
		var $nav = $("<div/>").append($save, $close);
		
		return {
			"element": function() { return $nav; }
		};
	}
	
	var $table;
	
	var show = function($parent, onClose, paymentIndex)
	{	
		var isNewPayment = paymentIndex === undefined;
	
		var dh = model.getDataHelper();
		var payment = isNewPayment ? dh.emptyPayment() : dh.payment(paymentIndex);
		var values = payment.values;
		var payModel = PayModel(dh.names(), payment, isNewPayment);
		
		
		var onSave = function()
		{
			if (isNewPayment)
			{
				dh.addPayment(payment.text, values);
			}

			dh.commit();
			onClose();
		};
		
		var nav = Nav(onSave, onClose);
		
		var editableTitle = editable(payment.text, function(value) { payment.text = value;});
		var $title = editableTitle.element().on("click", editableTitle.editMode);
		$table = $("<table/>");
		
		payModel.eachPerson(function(person)
		{
			var editablePayment = editable(0, function(value) 
			{
				var parsed = toNonNegativeNumber(value);
				if (parsed === null)
				{
					alert("ILLEGAL NUMBER!!!.   Todo här att fixa...");
				}
				person.pay(parsed); 
			});
			var editableExpense = editable(0, function(value) 
			{ 
				var parsed = toNonNegativeNumber(value);
				if (parsed === null)
				{
					alert("ILLEGAL NUMBER!!!.   Todo här att fixa...");
				}
				person.expense(parsed); 
			});
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

var PaymentUI = function(addWizard, model)
{
	var $addButton = null;
	var $historyContainer = null;
	var $addWizard = null;
	
	var hideWizard = function()
	{
		$historyContainer.show();
		$addButton.show();
		$addWizard.hide();
	};
	
	var showAddWizard = function(paymentIndex)
	{
		// paymentIndex might be null. Then its a new payment
		$addButton.hide();
		$historyContainer.hide();
		addWizard.show($addWizard.empty().show(), hideWizard, paymentIndex);
	};
	
	var create = function($parent)
	{
		var $historyHeader = $("<span/>").text("Tidigare betalningar:");
		$pastPayments = $("<div/>");
		$historyContainer = $("<div/>");
		$addWizard = $("<div/>");
		$addButton = $("<span/>")
			.addClass("add-button")
			.text("New payment")
			.on("click", function() { showAddWizard(); });
		
		$parent.append(
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$addButton), 
			$historyContainer.append($historyHeader, $pastPayments), 
			$addWizard);
	};
	
	var update = function()
	{
		$pastPayments.empty();
		$historyContainer.hide();
		hideWizard();	
		var dh = model.getDataHelper();
		
		dh.eachPayment(function(payment)
		{
			var $p = $("<div/>").addClass("flex-horizontal-container");
			var $label = $("<span/>").html(payment.text());
			var $cost = $("<span/>").html("(cost:" + payment.cost() + ")");
			var $remove = $("<span/>").html("(X)").on("click", function() { payment.remove(); dh.commit(); });
			
			$p.on("click", function()
			{
				showAddWizard(payment.index);
			});
			
			$pastPayments.append($p.append(
				$label.addClass("flex-grow"), 
				$cost, 
				$remove));
				
			$historyContainer.show();
		});
	};
	
	return {
		"create": create,
		"update": update
	};
};