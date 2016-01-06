var buildSummary = function($container, o)
{
	var payments = o.data.payments;
	var names = o.data.names;
	var balances = new Array(names.length);

	var title = function($c)
	{
		$c.append($("<h3/>").css("padding-left", "0.6em").html(o.data.title));	
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
			var $td = $("<td/>").attr("align", "right").html(names[j]);
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
		
		var $totalTr = $("<tr/>").appendTo($table);
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
	contents($t, spentTotal, 0, "Utlägg");
	addRowWith($t, "", "1.5em");
	
	var consumeTotal = new Array(names.length);
	contents($t, consumeTotal, 1, "Spenderat");
	addRowWith($t, "", "2em");
	
	totalDiff($t, spentTotal, consumeTotal);
	
	addRowWith($t, "", "2.5em");
	
	// transfer plan
	var balances = [];
	for (var i = 0; i < spentTotal.length; i++)
	{
		balances[i] = spentTotal[i] - consumeTotal[i];
	}
	
	$t.append(
		$("<tr/>").css("font-weight", "bold").append(
			$("<td/>").html("Bli kvitt såhär")
		)	
	);
	
	var $total = $("<tr/>").appendTo($t);
	$total.append($("<td/>"), $("<td/>"));
	
	var plan = transferPlan(balances);
	
	for (var p = 0; p < plan.length; p++)
	{
		var transfer = plan[p];
		$t.append(
			$("<tr/>").append(
				$("<td/>").attr("colspan", 2 + names.length).html(
					names[transfer.from] + 
					" ska ge " + 
					moneyTd(transfer.amount).text() +
					" till " +
					names[transfer.to])						
			)
		);
	}
	
	$container.append($("<br/>"), $("<br/>"));
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
			$("body").css({
				"overflow": "auto",
				"padding-left": "1em",
				"margin-bottom": "1em",
				"font-family": "courier new"	
			});
			buildSummary($(document.body), data)
		}		
	});
	
});