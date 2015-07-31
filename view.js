var addButtonCell = function(onclick)
{
	var c = $("<td/>").html("&nbsp;+&nbsp;");
	c.on("click", onclick);
	c.css("cursor", "pointer");
	return c;
};

var makeEditable = function($td, currentValue, onNewValue)
{	
	currentValue = (currentValue === null) ? "" : (currentValue + "");

	// contenteditable not for td elems in IE
	var $elem = $("<div/>").text(currentValue);
	$td.html($elem);
	
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

var Table = function($header, $table, model)
{
	var newRow = function() { return $("<tr>"); };
	
	// Setup clean table
	var setup = function()
	{
		var $addColumnCell = addButtonCell(function()
		{
			model.addColumn();
			$(this).prev().find("div").text("").focus();
		});
		
		var $addRowCell = addButtonCell(function() 
		{ 
			model.addRow(); 
			$(this).parent().prev().find("td:first").find("div").text("").focus();
		});
		
		$table.empty().append(
			newRow().addClass("column-header-row").append(
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
	
	var updatePaymentPlan = function(data, plan)
	{
		$table.find(".transfer-plan").remove();
	
		$.each(plan, function(i, moneyTransfer)
		{
			var longRow = function(text)
			{
				var tr = $("<tr/>").addClass("transfer-plan");
				var td = $("<td colspan=" + (data.names.length+1) + "/>");
				if (text) { td.text(text)} else { td.html("&nbsp;"); }
				return tr.append(td);
			};
			
			var mt = moneyTransfer;
			if (mt.amount > 0.005)
			{
				// Only show if amount is big enough
				$table.append(
					longRow(data.names[mt.from] + " " + L.ShouldGive + " " + mt.amount.toFixed(2) + " " + L.To + " " + data.names[mt.to]));				
			}
		});
	};
	
	var updatePyjamasClasses = function()
	{
		$table.find("tr").each(function(i)
		{
			if (i % 2 == 0)
			{
				$(this).addClass("even");
			}
			else
			{
				$(this).removeClass("even");
			}
		});
	};
	
	var updateHeader = function(data)
	{
		makeEditable($header, data.title, function(newTitle)
		{
			if (newTitle == "")
			{
				newTitle = "...";
			}
			model.updateTitle(newTitle);
		});		
	};
	
	var updateTotalDiffRow = function(data)
	{
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
				// Discard those who didn't participate in this payment
				if (value !== null)
				{
					rowSum += value;
					rowCount++;					
				}
			});
			
			$(payment.values).each(function(i, value) 
			{
				// Discard those who didn't participate in this payment
				if (value !== null)
				{
					totalDiffs[i] += value - rowSum / rowCount;		
				}
			});
		});
		
		for (var i = 0; i < totalDiffs.length; i++)
		{
			var twoDecimals = totalDiffs[i].toFixed(2);
			$diffRow.append($("<td/>")
				.addClass("diff-cell")
				.text(twoDecimals)
				.css("color", (twoDecimals > 0 ? "limegreen" : (twoDecimals < 0 ? "salmon" : ""))));
		}

		// Tombstone
		$diffRow.append($("<td/>").addClass("diff-cell"));
		
		return totalDiffs;
	};
	
	var updateNamesAndPayments = function(data)
	{
		var d3table = d3.select($table[0]);
		
		// First row - Names
		var firstRowCell = d3table.select("tr").selectAll("td.cell")
			.data(data.names);

		firstRowCell.enter()
			.insert("td", ".add-column-cell")
			.attr("class", "cell");
		// update
		firstRowCell
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

		var paymentRowEnter = paymentRow.enter()
			.insert("tr", ".add-row-row").attr("class", "payment-row");
			
		paymentRowEnter.append("td");
		paymentRowEnter.append("td").attr("class", "tombstone");
			
		// update	
		paymentRow.select("td")
			.attr("class", "payment-text")
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
			.insert("td", ".tombstone");
			
		// update
		paymentCell
			.attr("class", function(value) { return (value === null) ? "cell nullvalue" : "cell"; })
			.style("background-color", "")
			.each(function(value, i, j) {
				var $cell = $(this);
				makeEditable($cell, value, function(newValue) 
				{
					// Not comma, use dot
					newValue = newValue.replace(/,/g, ".");
					
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
	};

	var update = function(data)
	{
		// Prevents bug for updating while contenteditable has focus... sigh.
		$table.find("*").off("blur");
		
		updateHeader(data);
		updateNamesAndPayments(data);			
		var diffs = updateTotalDiffRow(data);
		updatePaymentPlan(data, transferPlan(diffs));
		updatePyjamasClasses();
	};
	
	setup();

	return {
		"update": update
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

var showMessage = function(message, delay)
{
	$(".messagecontainer").empty();
	
	var $message = $("<div/>")
		.addClass("message yellow info")
		.text(message).hide();
		
	$(".messagecontainer").append($message);
	
	var timer = null;
	
	var obj = {"hide": function() 
	{
		$message.slideUp();
		obj.hide = $.noop;
		clearTimeout(timer);
	}};

	$message.slideDown('fast');
	timer = setTimeout(function() { $message.slideUp() }, delay || 3000);
	
	return obj;
};

var bailout = function(message)
{
	showMessage(message || L.UnknownErrorReloadPage)
	setTimeout(function() { window.location.href = window.location.href;}, 3000)
};

var info = function(message, delay)
{
	return showMessage(message, delay);
};

var setOnlineCss = function(isOnline) 
{
	if (isOnline)
	{
		$(".root").removeClass("offline");
	}
	else
	{
		$(".root").addClass("offline");
	}
};

var log = function(message)
{
	if (false)
	{
		console.log(message);
	}
};

var logData = function(data, message)
{
	if (message)
	{
		log(message);
	}
	
	var str = "";
	for (var i = 0; i < data.payments.length; i++)
	{
		str += data.payments[i].text + ", ";
	}
	log(" - " + str);
};
