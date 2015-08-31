var initialize = function(docProxy, net, networkStatus)
{	
	var ui;
	
	var model = Model(function(newdata) 
	{ 
		ui.update();
		docProxy.update(newdata);
	});
	
	var $uiRoot = div("ui-root");
	
	var paymentWizard = PaymentWizard(model, $uiRoot);

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
	
	$(document.body).append($uiRoot);
	
	var onData = function(data) 
	{
		model.reset(data);
		ui.update();
	};
	
	docProxy.onData(onData);
	docProxy.read();
};

var preloadImages = function() 
{
  for (var i = 0; i < arguments.length; i++) {
    $("<img />").attr("src", arguments[i]);
  }
};

// called from app.html
var startApp = function()
{
	FastClick.attach(document.body);
	preloadImages("hoverimage1.jpg","hoverimage2.jpg", "arrow-left.png", "close.png", "creditcard.png", "icon-144.png", "icon-57.png", "icon-72.png", "locked.png", "mail.png", "help.png", "plus.png");
	
	var errorHandler = {"fatal": bailout, "info": info};
	var networkStatus = NetworkStatus();
	
	var net = Net(JobQueue(), 
				  errorHandler, 
				  networkStatus);
	var id = window.location.pathname.substring(1);

	var docProxy = DocProxy(LocalDoc(id, window.localStorage || {}), 
							RemoteDoc(id, net), 
							networkStatus,
							errorHandler);
	
	networkStatus.onChanged(setOnlineCss);
	networkStatus.onChanged(function(isOnline)
	{
		if (isOnline)
		{
			docProxy.read();
		}
	});
	
	initialize(docProxy, net, networkStatus); 	
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
	nonbounceSetup();
	
	$(window).on("click", function(e) 
	{ 
		var $inTopMostVolatileContainer = $(e.target).parents(".volatile-container").last().find(".volatile")
		$(".volatile").not($inTopMostVolatileContainer).hide(showHideSpeed);
	});
	
	$(document).ajaxStart(function()
	{
		if (networkStatus.isOnline)
		{
			ajaxTimer = setTimeout(function() {
				messageObj = showMessage(L.Saving);
			}, 2000);			
		}
	});
	
	$(document).ajaxStop(function()
	{
		clearTimeout(ajaxTimer);
		messageObj.hide();
	});
};

// called from index.html
var loadApp = function()
{
	var net = Net({}, {}, NetworkStatus());
	
	net.create(function(url) 
	{ 
		window.location.href = url;
	});
};