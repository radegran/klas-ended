L = {};

describe("Model", function()
{	
	describe("DataDiff", function()
	{
		it("does not accept different title", function()
		{
			var m = makeModel();
			m.updateTitle("new title");
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept modified name", function()
		{
			var m = makeModel();
			m.updateName("new name", 1);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});

		it("does not accept modified payment text", function()
		{
			var m = makeModel();
			m.updatePaymentText("new text", 1);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept removing name column", function()
		{
			var m = makeModel();
			m.updateName("", 2);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept removing payment row", function()
		{
			var m = makeModel();
			m.updatePaymentText("", 2);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept updating payment value", function()
		{
			var m = makeModel();
			m.updatePaymentValue(999, 1, 1);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("does not accept new columns", function()
		{
			var m = makeModel();
			m.addColumn();
			m.addColumn();
			m.updateName("N3", 3);
			m.updateName("N4", 4);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(false);
		});
		
		it("accepts new rows, and states 'local only'", function()
		{
			var m = makeModel();
			m.addRow();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentText("T4", 4);
			
			var d = DataDiff(getTestData(), localData);
			expect(d.accepted()).toBe(true);
			
			expect(d.payment(2).localOnly).toBe(false);
			expect(d.payment(3).localOnly).toBe(true);
		});
				
		it("knows if the diff is empty", function()
		{
			var m = makeModel();
			m.updatePaymentValue(999, 1, 1);
			
			var d1 = DataDiff(getTestData(), getTestData());
			var d2 = DataDiff(getTestData(), localData);
			
			expect(d1.isEmpty()).toBe(true);
			expect(d2.isEmpty()).toBe(false);
		});
					
		it("Merging works", function()
		{
			// local changes
			var m = makeModel();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentValue(999, 3, 2);
			
			var diff = DataDiff(getTestData(), localData);
			
			// server changes
			var m2 = makeModel();
			m2.updatePaymentText("", 2);
			m2.updatePaymentText("New payment text!", 1);
			m2.updatePaymentValue(666, 1, 1);
			expect(localData.payments.length).toBe(2);
			
			var mergedData = diff.applyTo(localData);
			
			expect(mergedData.payments.length).toBe(3);
			expect(mergedData.payments[1].text).toEqual("New payment text!");
			expect(mergedData.payments[2].text).toEqual("T3");
			expect(mergedData.payments[1].values[1]).toBe(666);
			expect(mergedData.payments[2].values[2]).toBe(999);			
		});
		
		it("Merging fails when a name is changed on the server", function()
		{
			// local changes
			var m = makeModel();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentValue(999, 3, 2);
			
			var diff = DataDiff(getTestData(), localData);
			
			// server changes
			var m2 = makeModel();
			m.updateName("Klas", 2);
			
			var mergedData = diff.applyTo(localData);
			expect(mergedData).toBe(null);			
		});
		
		it("Merging fails when a name is added on the server", function()
		{
			// local changes
			var m = makeModel();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentValue(999, 3, 2);
			
			var diff = DataDiff(getTestData(), localData);
			
			// server changes
			var m2 = makeModel();
			m.addColumn();
			m.updateName("Klas", 3);
			
			var mergedData = diff.applyTo(localData);
			expect(mergedData).toBe(null);			
		});
		
		it("Merging fails when a name is removed on the server", function()
		{
			// local changes
			var m = makeModel();
			m.addRow();
			m.updatePaymentText("T3", 3);
			m.updatePaymentValue(999, 3, 2);
			
			var diff = DataDiff(getTestData(), localData);
			
			// server changes
			var m2 = makeModel();
			m.updateName("", 2);
			
			var mergedData = diff.applyTo(localData);
			expect(mergedData).toBe(null);
		});
	});	
});