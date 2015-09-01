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
		var anyLocked = false;
		var totalPay = 0;
	
		for (var i = 0; i < persons.length; i++)
		{
			var it = persons[i].internal;
			
			anyActive |= it.isActive;
			anyLocked |= it.isLocked;
			totalPay += it.pay;
			
			if (triggerPersonsUpdate)
			{
				it.update();
			}
		}
		
		onAllUpdateCallback(anyActive, anyLocked, totalPay > 0);
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
				}
			};
			
			var onUpdate = function(updateCallback_)
			{
				updateCallback = updateCallback_;
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
				triggerAllUpdate();
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
			
			var otherActiveFilter = function(cb)
			{
				return function(it, isMe)
				{
					if (!isMe && it.isActive)
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
			};
			
			var computeGap = function(filter)
			{
				var unlockedCount = 0;
				var lockedGap = 0;
				iteratePersons(filter(function(it)
				{
					lockedGap += it.pay;
					
					if (it.isLocked)
					{
						lockedGap -= it.expense;
					}
					else
					{
						unlockedCount += 1;
					}
				}));
				
				return {
					"amount": lockedGap,
					"unlockedCount": unlockedCount
				};
			};
							
			var distributeExpenseOnUnlocked = function(totalAmount, numUnlocked, filter)
			{
				iteratePersons(filter(function(it)
				{
					it.expense = totalAmount / numUnlocked;
				}));
			};
			
			var activate = function()
			{
				if (p.isActive)
				{
					return;
				}
				
				p.isActive = true;
			
				var gap = computeGap(activeFilter);
				distributeExpenseOnUnlocked(gap.amount, gap.unlockedCount, unlockedActiveFilter);
			};
			
			var toggleActive = function()
			{
				if (!p.isActive)
				{
					activate();
					updateAll();
					return;
				}
							
				// inactivate
				var contrib = p.pay - p.expense;
				
				var gap = computeGap(otherActiveFilter);
					
				if (contrib > 0)
				{
					if (gap.unlockedCount > 0 && contrib <= (gap.amount + p.pay))
					{
						distributeExpenseOnUnlocked(gap.amount, gap.unlockedCount, otherUnlockedActiveFilter);
					}
					else
					{
						// Fail
						p.update();
						return;
					}
				}
				else if (contrib < 0)
				{
					if (gap.unlockedCount > 0)
					{
						distributeExpenseOnUnlocked(gap.amount, gap.unlockedCount, otherUnlockedActiveFilter);
					}
					else
					{
						// Fail
						p.update();
						return;
					}
				}
				
				p.expense = 0;
				p.pay = 0;
				p.isActive = false;
				p.isLocked = false;
	
				updateAll();
			};
			
			var expense = function(value)
			{
				if (value < 0)
				{
					p.update();
					return;
				}
				
				activate();
				
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
				
				activate();
				
				var gap = computeGap(activeFilter);
				
				if (gap.unlockedCount == 0)
				{
					p.update();
					return;
				}
				
				var contrib = p.pay - value;
				
				if (contrib > 0)
				{
					if (gap.amount < contrib)
					{
						p.update();
						return;
					}
				}
				
				p.pay = value;
				
				distributeExpenseOnUnlocked(gap.amount - contrib, gap.unlockedCount, unlockedActiveFilter);
				updateAll();
			};
			
			var lock = function(shouldLock)
			{
				p.isLocked = shouldLock;
				
				if (!p.isLocked)
				{
					var gap = computeGap(activeFilter);
					distributeExpenseOnUnlocked(gap.amount, gap.unlockedCount, unlockedActiveFilter);
				}
				
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

		var iterateKLAS = function(itCallback)
		{
			for (var j = 0; j < persons.length; j++)
			{
				var it = persons[j].internal;
				
				if (it.isActive)
				{
					itCallback(it);					
				}
			}			
		};
			
		var initLocks = function()
		{
			var dict = {};
			var uniqueExpenses = [];
	
			iterateKLAS(function(it)
			{
				if (!dict.hasOwnProperty(it.expense))
				{
					dict[it.expense] = 0;
					uniqueExpenses.push(it.expense);
				}

				dict[it.expense]++;				
			});

			var maxCount = 0;
			var maxOccuredExpense = -1;
			
			for (var i = 0; i < uniqueExpenses.length; i++)
			{
				var expense = uniqueExpenses[i];
				if (dict[expense] > maxCount)
				{
					maxOccuredExpense = expense;
					maxCount = dict[expense];
				}			
			}

			iterateKLAS(function(it)
			{
				if (it.expense !== maxOccuredExpense)
				{
					it.isLocked = true;
				}
			});
		};
				
		initLocks();
	};
	
	return {
		"eachPerson": eachPerson,
		"onUpdate": onAllUpdate,
		"triggerUpdate": function() { triggerAllUpdate(true); }
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
	}).css("color", "green");
	
	var $expenseInput = moneyInput(function(newValue)
	{
		person.expense(newValue);
	}).css("color", "red");
	
	var $activator = div("input-match activator")
		.on("click", person.toggleActive)
		.append(div("small-text").html("Lägg till"));
	
	$name.on("click", person.toggleActive);
	
	var $locked = $("<div/>");
	var $lockedIndent = div("lock-indent");
	var $expenseInputContainer = horizontal().append($expenseInput, $activator);
	var $lockedContainer = horizontal().append($locked, $lockedIndent);
	
	var isLockedState;
	var isActiveState = true;
	
	$locked.on("click", function() { person.lock(!isLockedState); });
	
	person.onUpdate(function(isActive, payValue, expenseValue, isLocked)
	{
		isLockedState = isLocked;
		isActiveState = isActive;

		if (isActive)
		{
			$activator.hide(showHideSpeed);
			$expenseInput.show(showHideSpeed);
			$name.removeClass("inactive");
			$locked.show(showHideSpeed);
			$lockedIndent.hide(showHideSpeed);
		}
		else
		{
			$activator.show(showHideSpeed);
			$expenseInput.hide(showHideSpeed);
			$name.addClass("inactive");
			$locked.hide(showHideSpeed);
			$lockedIndent.show(showHideSpeed);
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
	
	var $row = row([horizontalFill().append($name), $payInput, $expenseInputContainer, $lockedContainer]);
	
	return {
		"element": function() { return $row; }
	};
};

var PaymentWizard = function(model, errorHandler, $uiRoot)
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
		payModel.onUpdate(function(anyActive, anyLocked, anyPay)
		{
			if (!anyPay)
			{
				$(".col2").hide(showHideSpeed);
			}
			else
			{
				$(".col2").show(showHideSpeed);
			}
			
			if (anyLocked)
			{
				$(".col3").show(showHideSpeed);
			}
			else
			{
				$(".col3").hide(showHideSpeed);				
			}
		});

		var $wizElem;
		
		if (isNewPayment)
		{
			payment.text = "Beskriv betalningen här";
		}
			
		var editableTitle = editable(payment.text, function(newValue)
		{
			payment.text = newValue;
		});
		
		var $paymentTitle = editableTitle.element().on("click", function() 
		{
			editableTitle.editMode(); 
		});
		
		// navigation
		var close = function() 
		{ 
			 $wizElem.removeClass("translate"); 
			 $uiRoot.removeClass("translate");
			 setTimeout(function() { $wizElem.remove(); }, 500);
		};
		var save = function() 
		{ 
			errorHandler.info("Sparar \"" + payment.text + "\"");
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
		$table.append(row([$selectActiveLabel, div("input-match").text("Betalat"), horizontal().append(div("input-match").text("Skuld")), div("lock-indent")]));
		
		payModel.eachPerson(function(person)
		{
			var pp = PersonPayment(person);
			$table.append(pp.element())
		});
		
		var $confirm = div("confirm-remove volatile").hide()
			.html("Är du säker?")
			.on("click", function() 
			{
				dh.removePayment(paymentIndex); dh.commit(); 
				close();
			});
				
		var $remove = div("payment-remove")
			.html("TA BORT")
			.on("click", function(e) { $confirm.show(showHideSpeed); e.stopPropagation(); });
							
		var $contentContainer = div("ui-content-container flex-grow nonbounce");
		
		$wizElem = vertical("ui-root").append(
			horizontal("ui-header small-padding").append($paymentTitle),
			$contentContainer.append(
				vertical("ui-content").append(
					horizontalFill().append(
						div("flex-grow"),
						horizontalFill().append(div("flex-grow").append($table)),
						div("flex-grow")
					),
					(!isNewPayment ? horizontal().append($confirm, $remove) : $())
				)				
			),
			horizontal("ui-footer small-padding").append($paymentNavigation)
		);
		
		$(document.body).append($wizElem);
		
		$wizElem.css("left", "100%");
		setTimeout(function() { $wizElem.addClass("translate"); $uiRoot.addClass("translate"); }, 0);
		
		payModel.triggerUpdate();
		
		nonbounceSetup();
	};
	
	return {
		"show": show
	};
};