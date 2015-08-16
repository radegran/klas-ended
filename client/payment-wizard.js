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
	
	var $nameRow = $("<div/>").addClass("flex-horizontal-container flex-grow");
	var $inputRow = $("<div/>").addClass("flex-horizontal-container");
	
	var $indent = $("<div/>").addClass("payment-indent");
	var $name = $("<div/>").addClass("clickable-person").text(person.name);
	
	var $payLabel = $("<div/>").text("Betalat").addClass("flex-grow pay-label");
	var $expenseLabel = $("<div/>").text("Borde betalat").addClass("flex-grow expense-label");
	
	var $innerLayout = $("<div/>").addClass("flex-vertical-container");
	var $outerLayout = $("<div/>").addClass("flex-vertical-container");	
	
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
	
	$container.append($outerLayout.append(
		$nameRow.append(
			$name,
			$indent.clone().addClass("flex-grow")),
		$inputRow.append(
			$indent.clone(),
			$innerLayout.append(
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
	));
	
	$name.on("click", function() { person.toggleActive(); });
	
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
	
	var isActiveState = true;
	
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
		$expenseInput.val(formatMoney(expenseValue).text());
	});
	
	//
	// API
	//	
	var hide = function()
	{
		$container.hide();
	};
	
	var showAll = function()
	{
		$container.find("*").show();
		$outerLayout.attr("class", "flex-vertical-container");
		$innerLayout.attr("class", "flex-vertical-container");
		$container.show();
	};
	
	var showName = function()
	{
		showAll();
		$inputRow.hide();
	};
	
	var showPay = function()
	{
		if (!isActiveState)
		{
			hide();
			return;
		}
		
		showAll();
		$outerLayout.attr("class", "flex-horizontal-container flex-justify-center");
		$payLabel.hide();
		$expenseLabel.hide();
		$expenseInput.hide();
		$locked.hide();
	};
	
	var showShouldHavePaid = function()
	{
		if (!isActiveState)
		{
			hide();
			return;
		}
		
		showAll();
		$outerLayout.attr("class", "flex-horizontal-container flex-justify-center");
		$innerLayout.attr("class", "flex-horizontal-container flex-justify-center");
		$payLabel.hide();
		$expenseLabel.hide();
		$payInput.hide();
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

var AddWizard = function(model)
{
	var Nav = function(steps, $navTitle, onSave, onClose)
	{
		var currentStep = 0;
		var stepCount = steps.length;
		
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
		
		var showCurrentStep = function()
		{
			$navTitle.show();
			$back.show();
			$next.show();
			$save.hide();
				
			if (currentStep < 0)
			{
				onClose();
				$navTitle.hide();
				return;
			}
			
			if (currentStep == stepCount-1)
			{
				$next.hide();
				$save.show();				
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
		
		$back = $("<span/>").addClass("payment-back").on("click", prevStep);
		$next = $("<span/>").addClass("payment-next").on("click", nextStep);
		$save = $("<span/>").addClass("payment-save").on("click", onSaveInternal);
		
		var $dummy = $("<div/>").addClass("flex-grow");
		
		var $nav = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
			$dummy.clone(),
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
	}
	
	var $items;
	
	var show = function($parent, onClose, paymentIndex)
	{	
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
		var Persons = function(personList)
		{
			var forAll = function(funcName)
			{				
				$.each(personPayments, function(i, pp)
				{
					pp[funcName]();
				});
			};
			
			return {
				"hide": function() { forAll("hide"); },
				"showNames": function() { forAll("showName"); },
				"showPay": function() { forAll("showPay"); },
				"showShouldHavePaid": function() { forAll("showShouldHavePaid"); },
				"showEverything": function() { forAll("showEverything"); }
			};
		};
		var persons = Persons(personPayments);
			
		// Navigation		
		var $stepTitle = $("<div/>");
		var onSave = function()
		{
			if (isNewPayment)
			{
				dh.addPayment(payment.text, values);
			}

			dh.commit();
			onClose();
		};
		// SSSSSSSSSSTTTTTTTTEEEEEEEEPPPPPPPPSSSSSSSSSS
		var step1 = function() 
		{
			$stepTitle.html("Beskriv betalningen").show();
			$title.show();
			persons.hide();
			editableTitle.editMode();			
		};
		var step2 = function()
		{
			$stepTitle.html("Vilka berörs av betalningen?").show();
			$title.hide();
			persons.showNames();
		};
		var step3 = function()
		{
			$stepTitle.html("Hur mycket har folk betalat?").show();
			$title.hide();
			persons.showPay();
		};
		var step4 = function()
		{
			$stepTitle.html("Hur mycket borde folk betalat?").show();
			$title.hide();
			persons.showShouldHavePaid();
		};
		var step5 = function()
		{
			$stepTitle.html("Sammanställning av betalning");
			$title.show();
			persons.showEverything();
		};
		var nav = Nav([step1, step2, step3, step4, step5], $stepTitle, onSave, onClose);
		
		// Add all
		$parent.append(
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($stepTitle), 
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($title), 
			$items, 
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
