L = {};

describe("Model", function()
{	
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
				
		it("knows if the diff is empty", function()
		{
			var m = makeModel();
			m.updatePaymentValue(999, 1, 1);
			
			var d1 = LocalDiff(getTestData(), getTestData());
			var d2 = LocalDiff(getTestData(), localData);
			
			expect(d1.isEmpty()).toBe(true);
			expect(d2.isEmpty()).toBe(false);
		});
	});	
});