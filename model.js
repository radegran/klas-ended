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

var LocalDiff = function(serverData, localData)
{
	var accepted = function()
	{
		if (serverData.title != localData.title ||
		    localData.names.length < serverData.names.length ||
		    localData.payments.length < serverData.payments.length)
		{
			return false;
		}
		
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
	
	return {
		"accepted": accepted,
		"payment": paymentStats,
		"name": nameStats
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
	
	var addColumn = function()
	{
		var data = currentData();
		data.names.push(" ");
		$.each(data.payments, function(i, p) {
			p.values.push(null);
		});
		onChanged(data);
	};
	
	var addRow = function()
	{
		var data = currentData();
		var numNames = data.names.length;
		var payment = {"text": " ", "values": []};
		for (var i = 0; i < numNames; i++)
		{
			payment.values.push(0);
		}
		data.payments.push(payment);
		onChanged(data);
	};
	
	var updateName = function(newName, i)
	{
		var data = currentData();
		if (newName === "")
		{
			data.names.splice(i, 1);
			$.each(data.payments, function(j, p) {
				p.values.splice(i, 1);
			});
		}
		else
		{
			data.names[i] = newName;			
		}
		onChanged(data);
	};
	
	var updateTitle = function(newTitle)
	{
		var data = currentData();
		data.title = newTitle;
		onChanged(data);
	};
	
	var updatePaymentText = function(newText, i)
	{
		var data = currentData();
		if (newText === "")
		{
			data.payments.splice(i, 1);
		}
		else
		{
			data.payments[i].text = newText;
		}
		onChanged(data);
	};
	
	var updatePaymentValue = function(newValue, i, j)
	{
		var data = currentData();
		data.payments[i].values[j] = newValue;
		onChanged(data);
	};
	
	return {
		"addColumn": addColumn,
		"addRow": addRow,
		"updateName": updateName,
		"updatePaymentText": updatePaymentText,
		"updatePaymentValue": updatePaymentValue,
		"updateTitle": updateTitle,
		"undo": undo,
		"redo": redo,
		"reset": reset
	};
};