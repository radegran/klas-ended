var PayModel = function(names, payment, allActiveDefault)
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
				
				iteratePersons(function(p) { p.isLocked = false; });
				
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

var PersonPayment = function(person)
{
	var $container = $("<div/>").addClass("payment-person-container");
	
	var $nameRow = $("<div/>").addClass("flex-horizontal-container");
	var $inputRow = $("<div/>").addClass("flex-horizontal-container");
	
	var $active = $("<div/>").addClass("payment-active");
	var $indent = $("<div/>").addClass("payment-indent");
	var $name = $("<div/>").addClass("flex-grow").text(person.name);
	
	var $payLabel = $("<div/>").text("Betalat").addClass("flex-grow");
	var $expenseLabel = $("<div/>").text("Spenderat").addClass("flex-grow");
	
	var moneyInput = function() 
	{
		return $("<input type='number' pattern='[0-9]+([\.|,][0-9]+)?' step='none'/>")
			.css("width", "4em")
			.on("focus", function() { $(this).val("");});
	};
	
	var $payInput = moneyInput();
	var $expenseInput = moneyInput();
	var $locked = $("<div/>");
	
	var isLockedState;
	
	$container.append(
		$nameRow.append(
			$active,
			$name),
		$inputRow.append(
			$indent.clone(),
			$("<div/>").addClass("flex-vertical-container").append(
				$("<div/>").addClass("flex-horizontal-container").append(
					$payLabel,
					$payInput,
					$indent.clone()),
				$("<div/>").addClass("flex-horizontal-container").append(
					$expenseLabel,
					$expenseInput,
					$locked)		
			)
		)
	);
	
	$payInput.on("change paste", function()
	{
		var parsed = toNonNegativeNumber($payInput.val());
		var isNull = parsed === null;
		
		if (!isNull)
		{
			person.pay(parsed);
		}
		
		$payInput.css("background-color", isNull ? "lightsalmon" : "");
	});
		
	$expenseInput.on("change paste", function()
	{
		var parsed = toNonNegativeNumber($expenseInput.val());
		var isNull = parsed === null;
		
		if (!isNull)
		{
			person.expense(parsed);
		}
		
		$expenseInput.css("background-color", isNull ? "lightsalmon" : "");
	});
	
	$locked.on("click", function() { person.lock(!isLockedState); });
	
	person.onUpdate(function(isActive, payValue, expenseValue, isLocked)
	{
		isActiveState = isActive;
		isLockedState = isLocked;

		$active.off("click");
		$container.off("click");
		
		var toggleActive = function(e)
		{			
			person.toggleActive(); 
			e.stopPropagation();
		};
		
		if (isActive)
		{
			$container.removeClass("transparent");
			$active.on("click", toggleActive);
		}
		else
		{
			$container.addClass("transparent");
			$container.on("click", toggleActive);
		}
		
		if (isLocked)
		{
			$locked.removeClass("payment-unlocked transparent");
			$locked.addClass("payment-locked");
		}
		else
		{
			$locked.removeClass("payment-locked");
			$locked.addClass("payment-unlocked transparent");
		}
		
		$payInput.val(formatMoney(payValue));
		$expenseInput.val(formatMoney(expenseValue));
	});
	
	return {
		"element": function() { return $container; }
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
	
	var $items;
	
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
		
		// Clear title on focus first time, if its a new payment
		var $title = editableTitle.element()
			.one("click", function() { if (isNewPayment) { editableTitle.set("");} })
			.on("click", editableTitle.editMode);
			
		$items = $("<div/>");
		
		var personPayments = [];
		
		payModel.eachPerson(function(person)
		{
			personPayments.push(PersonPayment(person));
		});
		
		$.each(personPayments, function(i, pp)
		{
			$items.append(pp.element());
		});
		
		$parent.append($title, $items, nav.element());
	};
	
	return {
		"show": show
	};
};
