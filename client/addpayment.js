var PaymentWizard = function()
{
	var data;
	
	var start = function($trContainer)
	{
		
	};
	
	var update = function(d)
	{
		data = d;
	};
	
	return {
		"update": update,
		"start": start
	};
};