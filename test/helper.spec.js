var L = {};
var log = $.noop;
var logData = $.noop;

var localData;

var getTestData = function()
{
	return {
		"title": "title text",
		"names": ["N0", "N1", "N2"],
		"payments": [
			{"text": "T0", "values": [[0,10], [0,10], [30,10]]},
			{"text": "T1", "values": [[0,0], [29, 14.5], [0,14.5]]},
			{"text": "T2", "values": [[40,0], [0,40], [0,0]]}
		]
	};
};

var makeModel = function()
{
	var model = Model(function(data) { localData = data; });
	model.reset(getTestData());
		
	var helper = model.getDataHelper();
	
	var facade = {
		"updateTitle": function(text) { helper.title(text); helper.commit(); },
		"updateName": function(text, index) 
		{ 
			var i = 0;
			
			helper.eachPerson(function(p) 
			{
				if (i++ == index)
				{
					if (text === "")
					{
						p.remove();
					}
					else
					{
						p.setName(text);
					}
				}					
			});
			helper.commit();
		},
		"updatePaymentText": function(text, index)
		{
			var i = 0;
			
			helper.eachPayment(function(p)
			{
				if (i++ == index)
				{
					if (text === "")
					{
						p.remove();
					}
					else
					{
						p.text(text);
					}
				}
			});
			helper.commit();
		},
		"updatePaymentValue": function(value, payIndex, nameIndex)
		{
			if (value[1] === undefined)
			{
				throw "Facade .updatePaymentValue(...) expected a value pair!";
			}
		
			helper.eachPerson(function(person)
			{
				if (nameIndex-- == 0)
				{
					person.eachPayment(function(payment)
					{
						if (payIndex-- == 0)
						{
							payment.valuePair(value);
						}
					});
				}
			});
			
			helper.commit();
		},
		"addColumn": function(name)
		{
			helper.addPerson(name);
			helper.commit();
		},
		"addRow": function(text)
		{
			helper.addPayment(text);
			helper.commit();
		}
	};
	
	return facade;	
};