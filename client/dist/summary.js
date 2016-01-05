var buildSummary = function($container, o)
{
	var payments = o.data.payments;
	var names = o.data.names;
	var balances = new Array(names.length);

	var title = function($c)
	{
		$c.append($("<h3/>").html(o.data.title));	
	};

	var moneyTd = function(value)
	{
		return  $("<td/>").attr("align", "right").append(
			$("<div/>").html(formatMoney(value).css("color", "black"))
		);	
	};

	var tableWithHeader = function()
	{
		var $table = $("<table/>").addClass("summary-table").appendTo("body");
		var $header = $("<tr/>").appendTo($table);
		$header.append($("<td/>"), $("<td/>"));
	
		for (var j = 0; j < names.length; j++)
		{
			var $td = $("<td/>").html(names[j]);
			$header.append($td);
		}
		
		return $table;
	};
	
	var addRowWith = function($table, borderCss, height)
	{
		var $row = $("<tr/>");
		var $td = $("<td/>").attr("colspan", 2 + names.length);
		var $div = $("<div/>");
		
		$div.css("border-top", borderCss);
		$div.css("height", height || 0);
		$td.append($div);
		$row.append($td);
		$table.append($row);
	};
	
	var contents = function($table, total, ix, totalText)
	{
		for (var i = 0; i < payments.length; i++)
		{
			var payment = payments[i];
			
			var $tr = $("<tr/>").appendTo($table);
			var $title = $("<td/>").appendTo($tr);
			var $time = $("<td/>").css("color", "gray").appendTo($tr);
			
			$title.html(payment.text);
			var time = formatTime(payment.createdTime);
			$time.html(time);
			
			for (var j = 0; j < names.length; j++)
			{
				moneyTd(payment.values[j][ix]).appendTo($tr);
				total[j] = (total[j] || 0) + payment.values[j][ix];
			}
		}	
		
		addRowWith($table, "1px dashed black");
		
		var $totalTr = $("<tr/>").css("font-weight", "bold").appendTo($table);
		var $totalTitle = $("<td/>").html(totalText + " totalt").appendTo($totalTr);
		$("<td/>").appendTo($totalTr);
			
		for (var j = 0; j < names.length; j++)
		{
			moneyTd(total[j]).appendTo($totalTr);
		}					
	};
	
	var totalDiff = function($table, spentTotal, consumeTotal)
	{
		var $totalTr = $("<tr/>").css("font-weight", "bold").appendTo($table);
		var $totalTitle = $("<td/>").html("Skillnad totalt").appendTo($totalTr);
		$("<td/>").appendTo($totalTr);
			
		for (var j = 0; j < spentTotal.length; j++)
		{
			moneyTd(spentTotal[j] - consumeTotal[j]).appendTo($totalTr);
		}	
	};
	

	title($container);
	
	var $t = tableWithHeader();
	$container.append($t);
	
	var spentTotal = new Array(names.length);
	contents($t, spentTotal, 0, "Utgifter");
	addRowWith($t, "", "1.5em");
	
	var consumeTotal = new Array(names.length);
	contents($t, consumeTotal, 1, "Spenderat");
	addRowWith($t, "", "1.5em");
	
	totalDiff($t, spentTotal, consumeTotal);
	
	addRowWith($t, "", "2.5em");
	
	// transfer plan
	var balances = [];
	for (var i = 0; i < spentTotal.length; i++)
	{
		balances[i] = spentTotal[i] - consumeTotal[i];
	}
	
	$("<tr/>").css("font-weight", "bold").html("Bli kvitt såhär").appendTo($t);
	var $total = $("<tr/>").appendTo($t);
	$total.append($("<td/>"), $("<td/>"));
	
	
	var $table2 = $("<table/>").appendTo($container);
	var plan = transferPlan(balances);
	
	for (var p = 0; p < plan.length; p++)
	{
		var transfer = plan[p];
		$table2.append(
			$("<tr/>").append(
				$("<td/>").html(names[transfer.from] + " ska ge "),
				moneyTd(transfer.amount),
				$("<td/>").html(" till "),
				$("<td/>").html(names[transfer.to])						
			)
		);
	}
};

$(document).ready(function()
{
	var id = window.location.pathname.replace("/summary/","");

	var formatMoney = function(val)
	{
		if (val === 0)
		{
			return "";
		}
		
		return val;
	};

	$.ajax({
		url: "/get",
		type: "POST",
		data: JSON.stringify({"id": id}),
		contentType: "application/json",
		success: function(data)
		{
			/*
			{
				"id":"2791388c791ae39ec7d2",
				"created":1450285470242,
				"lastUpdated":1450285497288,
				"generation":5,
				"data":{
					"title":"Skriv en titel här",
					"names":["Klas","Namn"],
					"payments":[
						{
							"text":"En betöööölning",
							"values":[[34,17],[0,17]],
							"createdTime":1450285476222
						},
						{
							"text":"Hohoho",
							"values":[[0,3322],[3332,10]],
							"createdTime":1450285487486}]
						}
					}
			*/
			$(document.querySelector("body")).css("overflow", "auto");
			buildSummary($(document.body).css("padding-left", "1em"), data)
		}		
	});
	
});