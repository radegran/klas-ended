// TODO: use toNonNegativeNumber
var toNonNegativeNumber = function(str)
{
	str = str.trim().replace(",", ".");
	var parsed = parseFloat(str);
	
	if (str.search(/[^0-9\.]/) > -1 || isNaN(parsed))
	{
		return null;
	}
	
	return parsed;
};

var makeArray = function(length, defaultValue)
{
	var a = new Array(length);
	for (var i = 0; i < a.length; i++)
	{
		a[i] = defaultValue;
	}
	return a;
};

var transferPlan = function(balances)
{
	var MoneyTransfer = function(fromIndex, toIndex, amount)
	{
		return {
			"from": fromIndex,
			"to": toIndex,
			"amount": amount
		};
	};
	
	var IndexedBalance = function(i, balance)
	{
		return {
			"index": i,
			"balance": balance
		};
	};
	
	var positives = [];
	var negatives = [];
	
	$.each(balances, function(i, value)
	{
		if (value > 0)
		{
			positives.push(IndexedBalance(i, value));
		}
		else if (value < 0)
		{
			negatives.push(IndexedBalance(i, -value));
		}
	});
	
	var plan = [];
	var n = negatives.pop();
	var p = positives.pop();
	
	while (p && n)
	{
		var pReceived = 0;
		var pIsSatisfied = false;
		
		do
		{
			var pRemains = p.balance - pReceived;
			pIsSatisfied = n.balance >= pRemains;
			
			var amount = pIsSatisfied ? pRemains : n.balance;
			plan.push(MoneyTransfer(n.index, p.index, amount));
			
			pReceived += amount;
			
			if (!pIsSatisfied)
			{
				n = negatives.pop();
			}
			else
			{
				n.balance -= amount;
			}
		}
		while (!pIsSatisfied && n)
			
		p = positives.pop();
	}
	
	// key needed?
	for (var i = 0; i < plan.length; i++)
	{
		plan[i].key = plan[i].from + "_" + plan[i].to + "_" + plan[i].amount;
	}
	
	return plan;
};

// Only for testing!!! TODO: jasminify
var testTransfer = function(balances)
{
	var sum = balances.reduce(function(a, b) { return a + b; });
	var normBalances = balances.map(function(v) { return v - sum/balances.length; });
	
	var plan = transferPlan(normBalances);
	var p = plan.pop();
	while(p)
	{
		normBalances[p.from] += p.amount;
		normBalances[p.to] -= p.amount;
		
		console.log(p.from + " -> " + p.to + ": " + p.amount);
		p = plan.pop();
	}
	
	console.log(normBalances);
}

var isValidCellValue = function(text)
{
	var trimmed = text.replace(/ /g, "");
	return trimmed === "" || parseFloat(trimmed) == trimmed;
};

var toValidCellValue = function(text)
{	
	var trimmed = text.replace(/ /g, "");
	return isNaN(parseFloat(trimmed)) ? null : parseFloat(trimmed);
};

var DataDiff = function(serverData, localData)
{
	var sameNamesAndPayments = function()
	{
		var acc = true;
		
		// check names diff
		$.each(serverData.names, function(i, name)
		{
			if (name != localData.names[i])
			{
				acc = false;
				return false;
			}
		});
		
		// check payment diff
		$.each(serverData.payments, function(i, payment)
		{
			if (payment.text != localData.payments[i].text)
			{
				acc = false;
				return false;
			}
			
			$.each(payment.values, function(j, valuePair)
			{
				var localValuePair = localData.payments[i].values[j];
				if (valuePair[0] !== localValuePair[0] || valuePair[1] !== localValuePair[1])
				{
					acc = false;
					return false;
				}
			});
		});
		
		return acc;
	};

	var accepted = function()
	{
		if (serverData.title != localData.title ||
		    localData.names.length != serverData.names.length ||
		    localData.payments.length < serverData.payments.length)
		{
			return false;
		}
		
		return sameNamesAndPayments();
	};
	
	var isEmpty = function()
	{
		if (serverData.title != localData.title ||
		    localData.names.length != serverData.names.length ||
		    localData.payments.length != serverData.payments.length)
		{
			return false;
		}
		
		return sameNamesAndPayments();
	};
	
	var paymentStats = function(index)
	{
		return {
			"localOnly": (index < localData.payments.length) && (index+1 > serverData.payments.length)
		};
	};
	
	var nameStats = function(index)
	{
		return {
			"localOnly": (index < localData.names.length) && (index+1 > serverData.names.length)
		};
	};
	
	var rebaseable = function()
	{
		// ... meaning that its ok to push an accepted local diff onto this diff
		var serverNewData = localData;
		
		if (serverData.names.length != serverNewData.names.length)
		{
			return false;
		}
		
		for (var i = 0; i < serverData.names.length; i++)
		{
			if (serverData.names[i] != serverNewData.names[i])
			{
				return false;
			}
		}
		
		return true;
	};
	
	var applyTo = function(otherData)
	{
		var serverDiff = DataDiff(serverData, otherData);
		if (!serverDiff.rebaseable())
		{
			// console.log("Couldn't merge!");
			return null;
		}
		
		var mergedData = otherData;
		var m = Model(function(d) { mergedData = d; });
		m.reset(otherData);
		
		var dh = m.getDataHelper();
		
		for (var i = serverData.payments.length; i < localData.payments.length; i++)
		{
			var p = localData.payments[i];
			var newP = dh.newPayment();
			newP.text = p.text;
			newP.values = p.values;
		}
		
		dh.commit();
		
		return mergedData;
	};
	
	return {
		"accepted": accepted,
		"rebaseable": rebaseable,
		"isEmpty": isEmpty,
		"payment": paymentStats,
		"name": nameStats,
		"applyTo": applyTo
	};
};

// DataHelper

var DataHelper = function(data, onChange, onCommit)
{
	var eachPerson = function(callback)
	{
		var makePerson = function(name, diff, nameIndex)
		{
			var eachPayment = function(callback2)
			{
				var makePayment = function(paymentIndex)
				{
					var text = function(str)
					{
						if (str === undefined)
						{
							return data.payments[paymentIndex].text;
						}
						data.payments[paymentIndex].text = str;
					};
										
					var valuePair = function(pair)
					{
						if (pair === undefined)
						{
							return data.payments[paymentIndex].values[nameIndex];
						}
						data.payments[paymentIndex].values[nameIndex] = pair;
					};
				
					return {
						"text": text,
						"valuePair": valuePair,
						"index": paymentIndex
					}
				};
			
				for (var j = 0; j < data.payments.length; j++)
				{
					var v = data.payments[j].values[nameIndex];
					callback2(makePayment(j));
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
				$.each(data.payments, function(j, p) 
				{
					var payModel = PayModel(data.names, p, true);
					var i = nameIndex;
					var pmp;
					
					payModel.eachPerson(function(it)
					{
						if (i-- == 0)
						{
							pmp = it;						
						}
					});
					
					pmp.toggleActive();					
				});

				data.names.splice(nameIndex, 1);
				$.each(data.payments, function(j, p) {
					p.values.splice(nameIndex, 1);
				});
				
				onChange();
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
	
	var addPerson = function(name)
	{
		data.names.push(name || "XXX");
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
		var cleanupPayments = function()
		{
			data.payments = data.payments.filter(function(p) { return !p.remove; });
		};
		
		var stillEnumerating = true;
		
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
			
			var text = function(str)
			{
				if (str === undefined)
				{
					return payment.text;
				}
				payment.text = str;
				onChange();
			};
			
			var remove = function()
			{
				payment.remove = true;
				if (!stillEnumerating)
				{
					cleanupPayments();
				}
			};
			
			callback({
				"cost": cost,
				"text": text,
				"remove": remove,
				"index": index
			});
		};
		
		for (var j = 0; j < data.payments.length; j++)
		{
			makePayment(j);
		}
		
		stillEnumerating = false;
		
		cleanupPayments();
	};
	
	var newPayment = function()
	{
		var p = {
			"text": "",
			"values": []
		};
		
		for (var i = 0; i < data.names.length; i++)
		{
			p.values.push([0, 0]);
		}
		
		data.payments.push(p);
		
		return p;
	};
	
	var paymentByIndex = function(index)
	{
		return data.payments[index];
	}
	
	var commit = function()
	{
		(onCommit || $.noop)();
	};
	
	return {
		"eachPerson": eachPerson,
		"eachPayment": eachPayment,
		"name": name,
		"payment": paymentByIndex,
		"addPerson": addPerson,
		"title": title,
		"names": function() { return data.names; },
		"newPayment": newPayment,
		"commit": commit
	};
}

var Model = function(onChangedCallback)
{
	// Expecting a "reset" call to be initialized
	var undoStack;
	var undoStackCursor;
	var gen = 0;
	
	var currentData = function()
	{
		return $.extend(true, {}, undoStack[undoStackCursor]);
	};
	
	var onChanged = function(newData)
	{
		undoStack = undoStack.slice(0, undoStackCursor + 1);
		undoStack.push(newData);
		undoStackCursor++;
		onChangedCallback(newData);
	};
	
	var undo = function()
	{
		undoStackCursor = Math.max(0, undoStackCursor - 1);
		gen++;
		onChangedCallback(undoStack[undoStackCursor]);
	};
	
	var redo = function()
	{
		undoStackCursor = Math.min(undoStack.length - 1, undoStackCursor + 1);
		gen++;
		onChangedCallback(undoStack[undoStackCursor]);
	};
	
	var reset = function(data)
	{
		undoStack = [data];
		undoStackCursor = 0
		gen++;;
		// Let's not call onChangedCallback(data); 
	};
	
	var getDataHelper = function(onDataHelperChange)
	{
		var current = currentData();
		var validAtGen = gen;
		
		var onCommit = function()
		{
			if (validAtGen !== gen)
			{
				throw "Tried to commit from an old dataHelper";
			}
			onChanged(current);
		};
		
		return DataHelper(current, 
						  onDataHelperChange || $.noop, 
						  onCommit);
	};
	
	return {
		"undo": undo,
		"redo": redo,
		"reset": reset,
		"getDataHelper": getDataHelper
	};
};