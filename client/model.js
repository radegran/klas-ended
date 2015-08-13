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
			
			$.each(payment.values, function(j, value)
			{
				if (value !== localData.payments[i].values[j])
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
		
		var addPayment = function(payment)
		{
			var rowIndex = mergedData.payments.length;
			m.addRow();
			m.updatePaymentText(payment.text, rowIndex);
			
			for (var j = 0; j < payment.values.length; j++)
			{
				m.updatePaymentValue(payment.values[j], rowIndex, j);
			}
		}
		
		for (var i = serverData.payments.length; i < localData.payments.length; i++)
		{
			addPayment(localData.payments[i]);
		}
		
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

var Model = function(onChangedCallback)
{
	// Expecting a "reset" call to be initialized
	var undoStack;
	var undoStackCursor;
	
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
		onChangedCallback(undoStack[undoStackCursor]);
	};
	
	var redo = function()
	{
		undoStackCursor = Math.min(undoStack.length - 1, undoStackCursor + 1);
		onChangedCallback(undoStack[undoStackCursor]);
	};
	
	var reset = function(data)
	{
		undoStack = [data];
		undoStackCursor = 0;
		// Let's not call onChangedCallback(data); 
	};
	
	var getDataHelper = function()
	{
		var current = currentData();
		return DataHelper(currentData);
	};
	
	return {
		"undo": undo,
		"redo": redo,
		"reset": reset,
		"getDataHelper": getDataHelper
	};
};