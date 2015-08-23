var initialize = function(docProxy, net, networkStatus)
{	
	var ui;
	
	var model = Model(function(newdata) 
	{ 
		ui.update();
		docProxy.update(newdata);
	});
	
	var $uiRoot = div("ui-root");
	
	var paymentWizard = {
		"show": function(paymentIndex) 
		{
			var isNewPayment = paymentIndex === undefined;
			var dh = model.getDataHelper();
			var payment = isNewPayment ? dh.emptyPayment() : dh.payment(paymentIndex);
			var values = payment.values;
			var payModel = PayModel(dh.names(), payment, false);

			// title
			var $paymentTitle = div().text("title-todo");
			
			// navigation
			var $paymentClose = div("payment-close");
			var $paymentSave = div("payment-save");
			var $paymentNavigation = vertical("flex-justify-center").append(
				horizontal().append(
					$paymentClose,
					$paymentSave
				)
			);
			
			// content
			var $table = $("<table/>");
			$table.append(row([$(), div().text("betalat"), div().text("borde betalat"), $()]));
			
			payModel.eachPerson(function(person)
			{
				var pp = PersonPayment(person);
				$table.append(pp.element())
			});
			
			var $wizElem = vertical("ui-root").append(
				horizontal("ui-header").append($paymentTitle),
				horizontal("flex-grow").append($table),
				horizontal("ui-footer").append($paymentNavigation)
			);
			
			$uiRoot.hide();
			$(document.body).append($wizElem);
		}
	};

	ui = UI(TitleUI(model),
			MainContentUI(
				StatsUI(paymentWizard, model),
				PaymentUI(paymentWizard, model)), 
			AddPaymentButtonUI(paymentWizard, model));
	
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
	
	var ajaxTimer = null;
	var messageObj = {"hide": $.noop};
	
	$(window).on("click", function() { $(".confirm-remove").hide('fast'); });
	
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