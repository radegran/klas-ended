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
			{"text": "T0", "values": [0, 0, 30]},
			{"text": "T1", "values": [null, 29, 0]},
			{"text": "T2", "values": [40, -40, null]}
		]
	};
};

var makeModel = function()
{
	var model = Model(function(data) { localData = data; });
	model.reset(getTestData());
	return model;
};