 var addButtonCell = function(onclick)
{
	var c = $("<td/>").html("&nbsp;+&nbsp;");
	c.on("click", onclick);
	c.css("cursor", "pointer");
	return c;
};

var makeEditable = function($elem, currentValue, onNewValue)
{
	// Reset any earlier makeEditable for this element
	$elem.off("blur");
	$elem.off("keydown");
	
	$elem.attr("contentEditable", true); 	
	$elem.on("blur", function() 
	{ 
		var newValue = $(this).text();
		if (newValue !== currentValue)
		{
			currentValue = newValue;
			onNewValue(newValue);
		}
	});
	$elem.on("keydown", function(e) 
	{ 
		if (e.which == 13) 
		{
			e.preventDefault();
			$elem.blur(); 
		}
	});	
};

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

var Table = function($header, $table, model)
{
	var newRow = function() { return $("<tr>"); };

	var $addColumnCell = addButtonCell(function()
	{
		model.addColumn();
		$(this).prev().focus().text("");
	});
	var $addRowCell = addButtonCell(function() 
	{ 
		model.addRow(); 
		$(this).parent().prev().find("td:first").focus().text("");
	});
	
	// Setup clean table
	var setup = function()
	{
		$table.empty().append(
			newRow().append(
				$("<td/>"),
				$addColumnCell.addClass("add-column-cell")),
			newRow().addClass("add-row-row").append(
				$addRowCell.addClass("add-row-cell")),
			newRow().addClass("diff-row").append(
				$("<td/>")));


		$table.off("keydown");
		$table.on("keydown", function(e)
		{
			// Disable input fields' default undo/redo
			if (isCtrlY(e) || isCtrlZ(e))
			{
				return false;
			}
		});
		
		$(window).off("keydown");
		$(window).on("keydown", function(e)
		{
			if (isCtrlY(e))
			{
				model.redo();
				return false;
			}
			if (isCtrlZ(e))
			{
				model.undo();
				return false;
			}
		});
				
	};

	var update = function(data)
	{
		// Prevents bug for updating while contenteditable has focus... sigh.
		$table.find("*").off("blur");
		
		$header.text(data.title);
		makeEditable($header, data.title, function(newTitle)
		{
			if (newTitle == "")
			{
				newTitle = "...";
			}
			model.updateTitle(newTitle);
		});
		
		var d3table = d3.select($table[0]);
		
		// First row - Names
		var firstRowCell = d3table.select("tr").selectAll("td.cell")
			.data(data.names);

		firstRowCell.enter()
			.insert("td", ".add-column-cell")
			.attr("class", "cell");
		// update
		firstRowCell
			.text(function(name) { return name; })
			.each(function(d, i) {
				makeEditable($(this), d, function(newValue) {
					model.updateName(newValue, i);
				});
			});
		
		firstRowCell.exit()
			.remove();

		// Payments
		var paymentRow = d3table.select("tbody").selectAll("tr.payment-row")
			.data(data.payments);

		paymentRow.enter()
			.insert("tr", ".add-row-row").attr("class", "payment-row")
			.append("td");
		// update	
		paymentRow.select("td")
			.text(function(d) { return d.text; })
			.each(function(d, i) {
				makeEditable($(this), d.text, function(newValue) {
					model.updatePaymentText(newValue, i);
				});
			});	

		paymentRow.exit()
			.remove();
		
		var paymentCell = paymentRow.selectAll("td.cell")
			.data(function(d) { return d.values; });
		
		// Value cells
		paymentCell.enter()
			.append("td")
			.attr("class", "cell");
			
		// update
		paymentCell
			.text(function(value) { return value; })
			.style("background-color", "")
			.each(function(value, i, j) {
				var $cell = $(this);
				makeEditable($cell, value + "", function(newValue) {
					if (isValidCellValue(newValue))
					{
						$cell.css("background-color", "");
						model.updatePaymentValue(toValidCellValue(newValue), j, i);
					}
					else
					{
						$cell.css("background-color", "lightsalmon");
					}
				});
			});
		
		paymentCell.exit()
			.remove();
			
		// UPDATE DIFF ROW
		var $diffRow = $table.find(".diff-row");
		$diffRow.find(".diff-cell").remove();
		
		var totalDiffs = new Array(data.names.length);
		for (var i = 0; i < totalDiffs.length; i++)
			totalDiffs[i] = 0;
		
		$(data.payments).each(function(i, payment) 
		{
			var rowSum = 0;
			var rowCount = 0;
			$(payment.values).each(function(i, value) 
			{
				// Discard those who didn't enjoy this payment
				if (value !== null)
				{
					rowSum += value;
					rowCount++;					
				}
			});
			
			$(payment.values).each(function(i, value) 
			{
				// Discard those who didn't enjoy this payment
				if (value !== null)
				{
					totalDiffs[i] += value - rowSum / rowCount;		
				}
			});
		});
		
		for (var i = 0; i < totalDiffs.length; i++)
		{
			var twoDecimals = totalDiffs[i].toFixed(2);
			$diffRow.append($("<td/>").addClass("diff-cell").text(twoDecimals));
		}
		
		// Pyjamas classes
		$table.find("tr").each(function(i)
		{
			if (i % 2 == 1)
			{
				$(this).addClass("odd");
			}
			else
			{
				$(this).removeClass("odd");
			}
		});
	};
	
	setup();

	return {
		"update": update
	};
};

var Model = function(initdata, onChangedCallback)
{
	var undoStack = [initdata];
	var undoStackCursor = 0;
	
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
		onChangedCallback(data);
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

var isCtrlZ = function(e)
{
	e = window.event || e;
    return (e.keyCode == 90 && e.ctrlKey);
};

var isCtrlY = function(e)
{
	e = window.event || e;
    return (e.keyCode == 89 && e.ctrlKey);
};
