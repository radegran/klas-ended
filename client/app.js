var initialize = function(docProxy, net, networkStatus)
{	
	var ui;
	var hasSetStartPage = false;
	
	var model = Model(function(newdata) 
	{ 
		ui.update();
		docProxy.update(newdata);
	});
	
	var fullScreen = function(shouldFullScreen)
	{
		ui.fullScreen(shouldFullScreen);
	};
	
	var addWizard = AddWizard(model, fullScreen);
	
	var ui = MainUI(StatsUI(addWizard, model), 
				    PaymentUI(addWizard, model), 
					PeopleUI(model),
					HeaderUI(model));
	
	ui.create($(document.body));
	
	
	var onData = function(data) 
	{
		model.reset(data);
		
		if (!hasSetStartPage)
		{
			setStartPage(ui, model)
			hasSetStartPage = true;
		}
		
		ui.update();
	};
	
	docProxy.onData(onData);
	docProxy.read();
};

// called from app.html
var startApp = function()
{
	FastClick.attach(document.body);
	
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
	
	
	nonbounce("ui-content-container");
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
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