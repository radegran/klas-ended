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
	var $container = div("payment-person-container");
	
	var $nameRow = horizontal("flex-grow");
	var $inputRow = horizontal();
	
	var $indent = div("payment-indent");
	var $name = div("clickable-person").html(person.name);
	
	var $payLabel = div("flex-grow pay-label").text(L.Paid);
	var $expenseLabel = div("flex-grow expense-label").text(L.ShouldPaid);
	
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
	var isActiveState = true;
	
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
		isLockedState = isLocked;
		isActiveState = isActive;

		if (isActive)
		{
			$name.removeClass("inactive");
		}
		else
		{
			$name.addClass("inactive");
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
		
		$payInput.val(formatMoney(payValue).text());
		$payInput.css("background-color", "");
		$expenseInput.val(formatMoney(expenseValue).text());
		$expenseInput.css("background-color", "");
	});
	
	//
	// API
	//	
	var hide = function()
	{
		$container.find("*").detach();
		$name.off();
	};
	
	var showAll = function()
	{
		hide();
		
		$container.append(
			vertical().append(
				horizontal().append(
					$nameRow.append(
						$name,
						div("flex-grow")
					)
				),
				$inputRow.append(
					$indent.clone(),
					vertical().append(
						horizontal().append(
							$payLabel,
							$payInput,
							$indent.clone()
						),
						horizontal().append(
							$expenseLabel,
							$expenseInput,
							$locked
						)
					)
				)
			)
		);
	};
	
	var showName = function()
	{
		hide();
		$container.append(
			horizontal().append(
				$name
			)
		);
				
		$name.on("click", function() 
		{ 
			person.toggleActive(); 
		});
	};
	
	var showPay = function()
	{
		if (!isActiveState)
		{
			hide();
			return;
		}
		
		hide();
		$container.append(
			horizontal().append(
				$name,
				div("flex-grow"),
				$payInput
			)
		);
	};
	
	var showShouldHavePaid = function()
	{
		if (!isActiveState)
		{
			hide();
			return;
		}
		
		hide();
		$container.append(
			horizontal().append(
				$name,
				div("flex-grow"),
				$expenseInput,
				$locked
			)
		);
	};
	
	var showEverything = function()
	{
		if (!isActiveState)
		{
			hide();
			return;
		}
		
		showAll();
	};
	
	return {
		"element": function() { return $container; },
		"hide": hide,
		"showName": showName,
		"showPay": showPay,
		"showShouldHavePaid": showShouldHavePaid,
		"showEverything": showEverything
	};
};

var WizNav = function(steps, $navTitle, onSave, onClose)
{
	var currentStep = 0;
	var stepCount = steps.length;
	
	var $close;
	var $back;
	var $next;
	var $save;
	var dots = [];
	
	for (var i = 0; i < stepCount; i++)
	{
		dots.push($("<div/>").addClass("dot"));
	}
	
	var onSaveInternal = function()
	{
		$navTitle.hide();
		onSave();
	};
		
	var onCloseInternal = function()
	{
		$navTitle.hide();
		onClose();
	};
	
	var showCurrentStep = function()
	{
		$navTitle.show();
		$close.removeClass("transparent").off().on("click", onCloseInternal);
		$back.removeClass("transparent").off().on("click", prevStep);
		$next.removeClass("transparent").off().on("click", nextStep);
		$save.addClass("transparent").off();
			
		if (currentStep == 0)
		{
			$back.addClass("transparent").off();
		}
		
		if (currentStep == stepCount-1)
		{
			$next.addClass("transparent").off();
			$save.removeClass("transparent").off().on("click", onSaveInternal);				
		}
		
		$(dots).removeClass("filled");
		for (var i = 0; i < stepCount; i++)
		{
			if (i <= currentStep)
			{
				dots[i].addClass("filled");
			}
			else
			{
				dots[i].removeClass("filled");					
			}
		}
		
		steps[currentStep]();
	};
	
	var nextStep = function()
	{
		currentStep++;
		showCurrentStep();
	};
	
	var prevStep = function()
	{
		currentStep--;
		showCurrentStep();
	};
	
	$close = $("<span/>").addClass("payment-close");
	$back = $("<span/>").addClass("payment-back");
	$next = $("<span/>").addClass("payment-next");
	$save = $("<span/>").addClass("payment-save");
	
	var $dummy = $("<div/>").addClass("flex-grow");
	
	var $nav = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
		$dummy.clone(),
		$close,
		$back,
		dots,
		$next,
		$save,
		$dummy.clone());
			
	var begin = function()
	{
		showCurrentStep();
	};
	
	var last = function()
	{
		currentStep = steps.length - 1;
		showCurrentStep();
	}
	
	return {
		"element": function() { return $nav; },
		"begin": begin,
		"last": last
	};
};

var AddWizard = function(model, fullScreenFunc)
{	
	var $items;
	
	var show = function($parent, onClose, paymentIndex)
	{	
		fullScreenFunc(true);
		var onCloseInternal = function()
		{
			fullScreenFunc(false);
			onClose();
		};
	
		// Setup
		var isNewPayment = paymentIndex === undefined;
		var dh = model.getDataHelper();
		var payment = isNewPayment ? dh.emptyPayment() : dh.payment(paymentIndex);
		var values = payment.values;
		var payModel = PayModel(dh.names(), payment, false);

		// Title
		var editableTitle = editable(payment.text, function(value) 
		{ 
			if (value == "")
			{
				payment.text = "...";
				editableTitle.set("...");
			}
			else
			{
				payment.text = value;
			}
		});
		var $title = editableTitle.element()
			.addClass("payment-title-wizard")
			.on("click", editableTitle.editMode);
	
		// Throw in person payment objects
		$items = vertical();
		var personPayments = [];
		payModel.eachPerson(function(person)
		{
			personPayments.push(PersonPayment(person));
		});
		$.each(personPayments, function(i, pp)
		{
			$items.append(pp.element());
		});
		var forAllPersonsCall = function(funcName)
		{				
			$.each(personPayments, function(i, pp)
			{
				pp[funcName]();
			});
		};
					
		// Navigation		
		var $stepTitle = div("wiz-step-title");
		var onSave = function()
		{
			if (isNewPayment)
			{
				dh.addPayment(payment.text, values);
			}

			dh.commit();
			onCloseInternal();
		};
		// SSSSSSSSSSTTTTTTTTEEEEEEEEPPPPPPPPSSSSSSSSSS
		var step1 = function() 
		{
			$stepTitle.html(L.DescribePayment).show();
			$title.show();
			forAllPersonsCall("hide");
			if ($title.text() == "")
			{
				editableTitle.editMode();			
			}
		};
		var step2 = function()
		{
			$stepTitle.html(L.WhoAffected).show();
			$title.hide();
			forAllPersonsCall("showName");
		};
		var step3 = function()
		{
			$stepTitle.html(L.HowMuchPeoplePaid).show();
			$title.hide();
			forAllPersonsCall("showPay");
		};
		var step4 = function()
		{
			$stepTitle.html(L.HowMuchPeopleShouldPaid).show();
			$title.hide();
			forAllPersonsCall("showShouldHavePaid");
		};
		var step5 = function()
		{
			$stepTitle.html(L.Summary);
			$title.show();
			forAllPersonsCall("showEverything");
		};
		var nav = WizNav([step1, step2, step3, step4, step5], $stepTitle, onSave, onCloseInternal);
		
		// Add all
		$parent.append(
			horizontal().append($stepTitle), 
			horizontal().append($title), 
			horizontal().append($items), 
			nav.element());
		
		if (isNewPayment)
		{
			nav.begin();
		}
		else
		{
			nav.last();
		}
	};
	
	return {
		"show": show
	};
};
