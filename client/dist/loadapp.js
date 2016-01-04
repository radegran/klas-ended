$(document).ready(function()
{
	var $exampleContainer = $("<div/>").hide();
	var $page;
	var viewExample = function(visible)
	{
		if (visible)
		{
			$page.hide();
			$exampleContainer.show();			
		}
		else
		{
			$page.show();
			$('.view-example').hide();
			$exampleContainer.hide();	
		}
	};
	
	$page = $("<div/>").append(
		horizontal("ui-header").css("font-size", "1em").append(
			vertical().css("padding", "1.8em").append(
				div().css({
					"font-size": "2em",
					"padding-bottom": "0.6em"}).html("Splitta Notan"),
				div().css({
					"white-space": "normal",
					"padding-bottom": "0.3em"}).html(L.Welcome1),
				div('view-example').css("white-space", "normal").append(
					"Men titta först på ",
					$("<a/>")
						.attr("href", "#")
						.html("ett exempel.")
						.on("click", function() {
							viewExample(true);
						})
				),
				div().css("font-size", "0.5em").html("&nbsp;")		
			)
		),
		horizontal().css("padding", "2em").append(
			div("nav-payments").load("creditcard.svg").on("click", loadApp)
		)
	);	
	
	$(document.body).append(
		$page,
		$exampleContainer);
	$(document.querySelector("html")).css({
		"overflow-y": "auto"	
	});
	// EXAMPLE
	
	var errorHandler = {
		"fatal": function(m) { console.log("F:" + m)}, 
		"info": function(m) { console.log("I:" + m)}};
	
	var id = "example";
	var net = null;
	var networkStatus = {onChanged: $.noop};

	var localDoc = LocalDoc(id, {});
	var data = $.extend({}, L.StartData);
	data.title = "Danmarksresan";
	data.names = ["Alva", "Patrik", "Berit"];
	data.payments = [
		
		{
			text: "Hyrbil",
			createdTime: Date.now() - 14*24*60*60*1000,
			values: [[1500, 500], [0, 500], [0, 500]]
		},
		{
			text: "Vandrarhem",
			createdTime: Date.now() - 13*24*60*60*1000,
			values: [[0, 300], [900, 300], [0, 300]]
		},
		{
			text: "Berit och Patrik - Öl",
			createdTime: Date.now() - 12.5*24*60*60*1000,
			values: [[0, 0], [0, 60], [135, 75]]
		}
	]
	
	localDoc.update("mine", data);
	localDoc.update("theirs", data);
	
	var docProxy = DocProxy(localDoc, 
							RemoteDoc(id, net), 
							networkStatus,
							errorHandler);
		
	var ui;
	
	var model = Model(function(newdata) 
	{ 
		ui.update();
		//docProxy.update(newdata);
	});
	
	var $uiRoot = div("ui-root");
	
	var paymentWizard = PaymentWizard(model, errorHandler, $uiRoot);

	ui = UI(TitleUI(
				model,
				HelpUI(model, net, networkStatus, $uiRoot)),
			MainContentUI(
				StatsUI(paymentWizard, model),
				PaymentUI(paymentWizard, model)
			),
			AddPaymentButtonUI(paymentWizard, model)
		);
	
	ui.create($uiRoot);
		
	var onData = function(data) 
	{
		model.reset(data);
		ui.update();
	};
	
	docProxy.onData(onData);
	docProxy.read();
	
	var $iGetIt = div("i-get-it i-get-it-entrance")
		.html("Jag fattar!")
		.on("click", function() { 
			$iGetIt.removeClass("i-get-it-entrance");
			window.setTimeout(function() 
			{ 
				viewExample(false);
			}, 250);
		});
		
	$exampleContainer.append($uiRoot);
	$exampleContainer.append($iGetIt);
	
	nonbounceSetup();
});