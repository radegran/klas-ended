var tip = function(selector, text)
{
	var dist = 25;
	
	$(".tip").remove();
	if (text == null)
	{
		return;
	}
	
	var $tip = $("<div/>").addClass("tip").css({
		"position": "absolute",
		"background-color": "darkorange",
		"color": "white",
		"padding": "0.7em",
		"z-index": 10,
		"overflow": "visible"
	}).append($("<div/>").css("position","relative").html(text));
	
	$tip.css("visibility", "hidden");
	$(document.body).append($tip);
	
	var $body = $(document.body);
	var $e = $(selector).filter(function() { return $(this).is(":visible"); });

	var bodyWidth = $body.width();
	var bodyHeight = $body.height();
	var eLeft = $e.offset().left;
	var eTop = $e.offset().top;
	var eWidth = $e.outerWidth();
	var eHeight = $e.outerHeight();
	var eCenterY = eTop + eHeight / 2;
	var tWidth = $tip.outerWidth();
	var tHeight = $tip.outerHeight();
	
	var placeTipAbove = (eCenterY > (bodyHeight / 2));
	var targetX = eLeft + (eLeft < 0.75*bodyWidth ? eWidth / 2 : 0);
	var targetY = placeTipAbove ? eTop : (eTop + eHeight);
	
	var tipLeft = Math.max(dist, Math.min(targetX - tWidth / 2, bodyWidth - tWidth - dist));
	var tipTop = targetY + (placeTipAbove ? -tHeight - dist : dist);
	
	$tip.css({
		"visibility": "",
		"left": tipLeft + "px",
		"top": tipTop + "px"
	});
	
	var arrowContainerWidth = tWidth + 2*dist;
	var arrowContainerHeight = tHeight + 2*dist;
	
	var $arrow = 
	$(
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + arrowContainerWidth + ' ' + arrowContainerHeight + '">' + 
	'<defs>' + 
	'<marker id="head" orient="auto" markerWidth="2" markerHeight="4" refX="0.1" refY="2">' +
    '<path d="M0,0 V4 L2,2 Z" fill="darkorange"></path>' +
	'</marker>' +
	'</defs>' +
	'<path id="arrow-line" marker-end="url(#head)" stroke-width="5" fill="none" stroke="darkorange" d="M0,0 20,1"></path>' +
	'</svg>');
	
	var $arrowContainer = $("<div/>").css({
		"top": -dist + "px",
		"left": -dist + "px",
		"position": "absolute",
		"width": arrowContainerWidth + "px",
		"height": arrowContainerHeight + "px"
	}).append($arrow);
	
	$tip.prepend($arrowContainer);
	
	var dX = targetX - ($tip.offset().left + $tip.outerWidth() /2);
	var dY = targetY - ($tip.offset().top + $tip.outerHeight() /2);
	var len = Math.sqrt(dX*dX + dY*dY);
	dX *= (len-10)/len;
	dY *= (len-10)/len;
	
	$arrow.find("#arrow-line").attr("d", "M" + arrowContainerWidth/2 + "," + arrowContainerHeight/2 + " l" + dX + "," + dY);
		
};

$(document).ready(function()
{
	var $exampleContainer = $("<div/>").hide();
	var $page;
	var $iGetIt;
	var initTutorial;
	
	var viewExample = function(visible)
	{
		if (visible)
		{
			$page.hide();
			$exampleContainer.show();	
			initTutorial();	
			window.setTimeout(function() { $iGetIt.addClass("i-get-it-entrance");}, 1500);
		}
		else
		{
			$page.show();
			//$('.view-example').hide();
			$exampleContainer.hide();	
		}
	};
	
	$page = vertical().css("height","100%").append(
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
		horizontal("flex-grow").css("padding", "2em").append(
			div("nav-payments").load("creditcard.svg").on("click", loadApp)
		)
	);	
	
	$(document.body).append(
		$page,
		$exampleContainer);
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
	
	$iGetIt = div("i-get-it")
		.html("Tillbaka!")
		.on("click", function() { 
			$iGetIt.removeClass("i-get-it-entrance");
			window.setTimeout(function() 
			{ 
				window.location.href = window.location.href.replace("#", "");
			}, 250);
		});

	$exampleContainer.append($uiRoot);
	$exampleContainer.append($iGetIt);
	
	var stepElems;
	var current = 0;
	
	var updateTutorial = function()
	{
		stepElems[current][0].css("opacity", 1).show();
		if (current > 1)
		{
			stepElems[current-1][0].css("opacity", 0.3);
		}	
		
		var e = stepElems[current];
		var text = e[1];
	
		if (!text)
		{
			current++;
			updateTutorial();
		}
		else
		{
			tip(e[0], e[1]);			
		}
	};
	
	var finishTutorial = function()
	{
		$.each(stepElems, function(i, e)
		{
			e[0].css("opacity", 1).show();	
		})
	};
	
	initTutorial = function()
	{
		stepElems = [
			['.ui-header', "Skriv en passande titel ..."],
			['.payments-container', "Här visas alla utlägg"],
			['.transfer-plan', "Bli kvitt såhär"],
			['.person-summaries', "Se vem som är skyldig mest"],
			['.person-add', null],
			['.ui-footer', "Lägg till nya betalningar"],
			['.help-button', "Klicka för att dela", function() { $(".help-button").trigger("click");}],
			['.link-to-self', "Ingen inloggning eller registrering<br>krävs. Kopiera istället den här länken<br>för att återkomma."],
			['.link-to-summary', "Här finns en<br>utskriftsvänlig översikt.", function() { $(".payment-back").trigger("click");}],
			['.i-get-it', "Prova att klicka runt lite<br>och gå sedan tillbaka!"]
			];
		
		$.each(stepElems, function(i, e) 
		{
			var e0 = $(".ui-root").find(e[0]);
			if (e0.length == 0)
			{
				e0 = $(e[0]);
			}
			e[0] = e0;
			if (i != 9)
			{
				e[0].hide();			
			}
		});
		updateTutorial();
	}
	
	$(document.body).append(
		$("<div/>")
			.css({
				"position": "relative",
				"background-color": "transparent",
				"z-index": 99,
				"height": "100%"
			}).append(div("tutorial-next")
				.html("Nästa")
			)
			.on("click", function()
			{
				var s = stepElems[current];
				current++;
				var functionExecuted = false;
				if (s.length == 3)
				{
					s[2]();
					functionExecuted = true;
				}
				if (current < stepElems.length)
				{
					if (functionExecuted)
					{
						setTimeout(updateTutorial, 450);
					}
					else
					{
						updateTutorial();
					}				
				}
				else
				{
					finishTutorial();	
					tip(null, null);
					$(this).remove();
				}
			}));

	nonbounceSetup();
});