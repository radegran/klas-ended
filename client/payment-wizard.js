var PayModel = function(names, payment, allActiveDefault)
{
	var persons = [];
	
	var onAllUpdateCallback = $.noop;
	
	var onAllUpdate = function(cb)
	{
		onAllUpdateCallback = cb;
	};
	
	var triggerAllUpdate = function(triggerPersonsUpdate)
	{
		var anyActive = false;
		var totalPay = 0;
	
		for (var i = 0; i < persons.length; i++)
		{
			var it = persons[i].internal;
			
			anyActive |= it.isActive;
			totalPay += it.pay;
			
			if (triggerPersonsUpdate)
			{
				it.update();
			}
		}
		
		onAllUpdateCallback(anyActive, totalPay > 0);
	};
	
	var triggerUpdate = function()
	{
		triggerAllUpdate(true);
	};
	
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
					triggerAllUpdate();
				}
			};
			
			var onUpdate = function(updateCallback_)
			{
				updateCallback = updateCallback_;
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

			var activeFilter = function(cb)
			{
				return function(it, isMe)
				{
					if (it.isActive)
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
				iteratePersons(function(it) { it.isLocked = false; });

				if (!p.isActive)
				{
					p.isActive = true;
				
					var totalExpense = 0;
					var personCount = 0;
					iteratePersons(activeFilter(function(it) { personCount++; totalExpense += it.expense; }));
					
					var myExpenseShouldBe = totalExpense / personCount;
					distributeExpense(myExpenseShouldBe);
					p.expense = myExpenseShouldBe;

					updateAll();
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
				
				p.isActive = true;
				
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
				p.isActive = true;
				
				iteratePersons(function(it) { it.isLocked = false; });
				distributeExpense(contrib, true);
				updateAll();
			};
			
			var lock = function(shouldLock)
			{
				p.isLocked = shouldLock;
				updateAll();
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
		"eachPerson": eachPerson,
		"onUpdate": onAllUpdate,
		"triggerUpdate": triggerUpdate
	};
};

var PersonPayment = function(person)
{
	var $name = div("clickable-person").html(person.name);
	
	var moneyInput = function(onChanged) 
	{
		var beforeFocusValue;
		
		var $m = $("<input type='number' pattern='[0-9]+([\.|,][0-9]+)?' step='none'/>")
			.addClass("money-input")
			.on("focus", function() { beforeFocusValue = $(this).val(); $(this).val(""); })
			.on("blur", function() { if ($(this).val() === "") $(this).val(beforeFocusValue); })
			.on("change paste", function()
			{
				var parsed = toNonNegativeNumber($m.val());
				var isNull = parsed === null;
				
				if (!isNull)
				{
					onChanged(parsed);
				}
				
				$payInput.css("background-color", isNull ? "lightsalmon" : "");
			});
			
		return $m;
	};
	
	var $payInput = moneyInput(function(newValue)
	{
		person.pay(newValue);
	});
	
	var $expenseInput = moneyInput(function(newValue)
	{
		person.expense(newValue);
	});
	
	var $expenseInputContainer = horizontal().append($expenseInput, $locked);
	
	var $locked = $("<div/>");
	
	var isLockedState;
	var isActiveState = true;
	
	$name.on("click", person.toggleActive);
	
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
	
	var $row = row([horizontalFill().append($name), $payInput, $expenseInputContainer]);
	
	return {
		"element": function() { return $row; }
	};
};

var PaymentWizard = function(model, $uiRoot)
{
	var show = function(paymentIndex) 
	{
		var isNewPayment = paymentIndex === undefined;
		var dh = model.getDataHelper();
		var payment = isNewPayment ? dh.newPayment() : dh.payment(paymentIndex);
		var values = payment.values;
		var payModel = PayModel(dh.names(), payment, false);
		
		// currenty no used
		var $selectActiveLabel = div();
		
		// paymodel general update
		payModel.onUpdate(function(anyActive, anyPay)
		{
			if (!anyPay)
			{
				$(".col2").hide(showHideSpeed);
			}
			else
			{
				$(".col2").show(showHideSpeed);
			}
		});

		var $wizElem;
		
		if (isNewPayment)
		{
			payment.text = "new!";
		}
		
		var editableTitle = editable(payment.text, function(newValue)
		{
			payment.text = newValue;
		});
		
		var $paymentTitle = editableTitle.element().on("click", function() { editableTitle.editMode(); });
		
		// navigation
		var close = function() { $wizElem.remove(); $uiRoot.fadeIn('fast'); };
		var save = function() 
		{ 
			dh.commit(); 
			close(); 
		};
		
		var $paymentClose = div("payment-close").on("click", close);
		var $paymentSave = div("payment-save").on("click", save);
		var $paymentNavigation = vertical().append(
			horizontal().append(
				$paymentClose,
				$paymentSave
			)
		);
		
		// content
		var $table = vertical();
		$table.append(row([$selectActiveLabel, div("input-match").text("betalat"), div("input-match").text("skuld")]));
		
		payModel.eachPerson(function(person)
		{
			var pp = PersonPayment(person);
			$table.append(pp.element())
		});
		
		var $contentContainer = horizontalFill("ui-content-container flex-grow");
		
		$wizElem = vertical("ui-root").append(
			horizontal("ui-header").append($paymentTitle),
			$contentContainer.append(
				div("flex-grow"),
				horizontalFill().append(div("flex-grow").append($table)),
				div("flex-grow")
			),
			horizontal("ui-footer").append($paymentNavigation)
		);
		
		$uiRoot.fadeOut('fast');
		$(document.body).append($wizElem);
		
		$wizElem.hide();
		$wizElem.fadeIn('fast');
		
		payModel.triggerUpdate();
	};
	
	return {
		"show": show
	};
};