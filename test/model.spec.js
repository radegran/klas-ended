L = {};

describe("Model", function()
{
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
	
	describe("LocalDiff", function()
	{
		it("does not accept different title", function()
		{
			var m = makeModel();
			m.updateTitle("new title");
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept modified name", function()
		{
			var m = makeModel();
			m.updateName("new name", 1);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});

		it("does not accept modified payment text", function()
		{
			var m = makeModel();
			m.updatePaymentText("new text", 1);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept removing name column", function()
		{
			var m = makeModel();
			m.updateName("", 2);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept removing payment row", function()
		{
			var m = makeModel();
			m.updatePaymentText("", 2);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept updating payment value", function()
		{
			var m = makeModel();
			m.updatePaymentValue(999, 1, 1);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("accepts new columns, and states 'local only'", function()
		{
			var m = makeModel();
			m.addColumn();
			m.addColumn();
			m.updateName("N3", 3);
			m.updateName("N4", 4);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(true);
			
			expect(d.name(2).localOnly).toBe(false);
			expect(d.name(3).localOnly).toBe(true);
		});
		
		it("accepts new rows, and states 'local only'", function()
		{
			var m = makeModel();
			m.addRow();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentText("T4", 4);
			
			var d = LocalDiff(getTestData(), localData);
			expect(d.accepted()).toBe(true);
			
			expect(d.payment(2).localOnly).toBe(false);
			expect(d.payment(3).localOnly).toBe(true);
		});
	});	
});