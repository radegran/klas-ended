describe("PayModel", function()
{
	var out, iface;
	
	var makePM = function(allActive, a, b, c, d)
	{
		var names = ["aaa", "bbb", "ccc"];
		var values = [a || [0,0], b || [0,0], c || [0,0]];
		
		if (d)
		{
			names.push("ddd");
			values.push(d);
		}
		
		var pm = PayModel(names, {"text": "bla", "values": values}, allActive);
		
		out = {};
		iface = {};
		
		pm.eachPerson(function(person)
		{
			iface[person.name] = person;
			
			person.onUpdate(function(isActive, pay, expense, isLocked)
			{
				out[person.name] = [isActive, pay, expense, isLocked];
			});
		});
		
		pm.triggerUpdate();
	};
	
	var verifyOut = function(name, isActive, pay, expense, isLocked)
	{
		expect(out[name][0]).toBe(isActive);
		expect(out[name][1]).toBeCloseTo(pay, 8);
		expect(out[name][2]).toBeCloseTo(expense, 8);
		expect(out[name][3]).toBe(isLocked);		
	};
	
	var modify = function(name, func, value)
	{
		iface[name][func](value);
	};
	
	it("should update with init values", function()
	{
		var pm = makePM(true, [9,3], [0,3], [0,3]);
		verifyOut("aaa", true, 9, 3, false);
		verifyOut("bbb", true, 0, 3, false);
		verifyOut("ccc", true, 0, 3, false);
	});
	
	it("should distribute expensing when goes inactive", function()
	{
		var pm = makePM(true, [60,20], [0,20], [0,20]);
		modify("bbb", "toggleActive");
		verifyOut("aaa", true, 60, 30, false);
		verifyOut("bbb", false, 0, 0, false);
		verifyOut("ccc", true, 0, 30, false);
	});
	
	it("should distribute paying when goes inactive", function()
	{
		var pm = makePM(true, [20,30], [40,30], [0,30]);
		modify("bbb", "toggleActive");
		verifyOut("aaa", true, 20, 10, false);
		verifyOut("bbb", false, 0, 0, false);
		verifyOut("ccc", true, 0, 10, false);
	});
	
	it("should be inactive when pay/expense is zero", function()
	{
		var pm = makePM(false, [30,15], [0,15], [0,0]);
		verifyOut("aaa", true, 30, 15, false);
		verifyOut("bbb", true, 0, 15, false);
		verifyOut("ccc", false, 0, 0, false);
	});
	
	//lock
	it("modify expense should lock and distribute among others equally", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		modify("aaa", "expense", 50);
		verifyOut("aaa", true, 90, 50, true);
		verifyOut("bbb", true, 0, 20, false);
		verifyOut("ccc", true, 0, 20, false);
		
		modify("bbb", "expense", 30);
		verifyOut("aaa", true, 90, 50, true);
		verifyOut("bbb", true, 0, 30, true);
		verifyOut("ccc", true, 0, 10, false);
	});
	
	it("modify expense negative numbers", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		modify("aaa", "expense", -50);
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, false);
		verifyOut("ccc", true, 0, 30, false);
	});

	//lock
	it("modify expense more than spent, take max", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		modify("bbb", "expense", 100);
		verifyOut("aaa", true, 90, 0, false);
		verifyOut("bbb", true, 0, 90, true);
		verifyOut("ccc", true, 0, 0, false);
	});
	
	//lock
	it("locking/unlocking", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		modify("bbb", "lock", true);
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, true);
		verifyOut("ccc", true, 0, 30, false);
		
		modify("bbb", "lock", false);
		verifyOut("bbb", true, 0, 30, false);
	});

	it("inactivation should always work if there are no locks", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, false);
		verifyOut("ccc", true, 0, 30, false);
		
		modify("aaa", "toggleActive");
		verifyOut("aaa", false, 0, 0, false);
		verifyOut("bbb", true, 0, 0, false);
		verifyOut("ccc", true, 0, 0, false);
	});
	
	//lock
	it("modify expense when all others are locked should not have effect", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		modify("aaa", "lock", true);
		modify("bbb", "lock", true);
		
		modify("ccc", "expense", 20);
		verifyOut("aaa", true, 90, 30, true);
		verifyOut("bbb", true, 0, 30, true);
		verifyOut("ccc", true, 0, 30, false);
		
		modify("ccc", "expense", 40);
		verifyOut("aaa", true, 90, 30, true);
		verifyOut("bbb", true, 0, 30, true);
		verifyOut("ccc", true, 0, 30, false);
	});

	it("toggle active twice actually toggles twice", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		
		modify("ccc", "toggleActive");
		verifyOut("aaa", true, 90, 45, false);
		verifyOut("bbb", true, 0, 45, false);
		verifyOut("ccc", false, 0, 0, false);
		
		modify("ccc", "toggleActive");
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, false);
		verifyOut("ccc", true, 0, 30, false);
	});
	
	//lock
	it("can expense although locked", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		
		modify("aaa", "lock", true);
		verifyOut("aaa", true, 90, 30, true);
		modify("aaa", "expense", 40);
		verifyOut("aaa", true, 90, 40, true);
		verifyOut("bbb", true, 0, 25, false);
		verifyOut("ccc", true, 0, 25, false);
	});
	
	//...
	it("inactive persons should be untouched by paying/expenseing", function()
	{
		var pm = makePM(false, [90,45], [0,45], [0,0]);
		verifyOut("ccc", false, 0, 0, false);
		
		modify("aaa", "expense", 70);
		verifyOut("aaa", true, 90, 70, true);
		verifyOut("bbb", true, 0, 20, false);
		verifyOut("ccc", false, 0, 0, false);
		
		modify("aaa", "expense", 10);
		verifyOut("aaa", true, 90, 10, true);
		verifyOut("bbb", true, 0, 80, false);
		verifyOut("ccc", false, 0, 0, false);
	
		modify("aaa", "pay", 110);
		verifyOut("aaa", true, 110, 10, true);
		verifyOut("bbb", true, 0, 100, false);
		verifyOut("ccc", false, 0, 0, false);
	
		modify("aaa", "pay", 30);
		verifyOut("aaa", true, 30, 10, true);
		verifyOut("bbb", true, 0, 20, false);
		verifyOut("ccc", false, 0, 0, false);
	});
	
	it("unlocking redistributes", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		
		modify("bbb", "expense", 50);
		verifyOut("aaa", true, 90, 20, false);
		verifyOut("bbb", true, 0, 50, true);
		verifyOut("ccc", true, 0, 20, false);
		
		modify("bbb", "lock", false);
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, false);
		verifyOut("ccc", true, 0, 30, false);
	});
	
	it("rejects paying negative amount", function()
	{
		var pm = makePM(false, [90,30], [0,30], [0,30]);
		
		modify("bbb", "pay", -10);
		verifyOut("aaa", true, 90, 30, false);
		verifyOut("bbb", true, 0, 30, false);
		verifyOut("ccc", true, 0, 30, false);
	});
	
	// it("unlocks all when paying", function()
	// {
		// var pm = makePM(false, [90,30], [0,30], [0,30]);
		
		// modify("aaa", "lock", true);
		// modify("bbb", "lock", true);
		// modify("ccc", "lock", true);		
		// verifyOut("aaa", true, 90, 30, true);
		// verifyOut("bbb", true, 0, 30, true);
		// verifyOut("ccc", true, 0, 30, true);
		
		// modify("aaa", "pay", 99);
		// verifyOut("aaa", true, 99, 33, false);
		// verifyOut("bbb", true, 0, 33, false);
		// verifyOut("ccc", true, 0, 33, false);
	// });
	
	//lock
	it("inactivation should be rejected if locked amounts depends on it", function()
	{
		var pm = makePM(true, [0,0], [0,0], [0,0]);
		
		modify("aaa", "pay", 30);	
		verifyOut("aaa", true, 30, 10, false);
		verifyOut("bbb", true, 0, 10, false);
		verifyOut("ccc", true, 0, 10, false);
		
		modify("bbb", "expense", 12);	
		verifyOut("aaa", true, 30, 9, false);
		verifyOut("bbb", true, 0, 12, true);
		verifyOut("ccc", true, 0, 9, false);
		
		modify("aaa", "toggleActive");	
		verifyOut("aaa", true, 30, 9, false);
		verifyOut("bbb", true, 0, 12, true);
		verifyOut("ccc", true, 0, 9, false);	
	});
		
	//lock
	it("activating should set expense to fair share among nonlocked", function()
	{
		var pm = makePM(true, [0,0], [0,0], [0,0], [0,0]);
		
		modify("ccc", "toggleActive");	
		modify("ddd", "toggleActive");	
		modify("aaa", "pay", 12);
		modify("bbb", "lock", true);
		
		verifyOut("aaa", true, 12, 6, false);
		verifyOut("bbb", true, 0, 6, true);
		verifyOut("ccc", false, 0, 0, false);
		verifyOut("ddd", false, 0, 0, false);
		
		modify("ccc", "toggleActive");	
		verifyOut("aaa", true, 12, 3, false);
		verifyOut("bbb", true, 0, 6, true);
		verifyOut("ccc", true, 0, 3, false);
		verifyOut("ddd", false, 0, 0, false);
	});
	
	it("pay should activate", function()
	{
		var pm = makePM(false, [0,0], [0,0], [0,0]);
		
		verifyOut("aaa", false, 0, 0, false);
		verifyOut("bbb", false, 0, 0, false);
		verifyOut("ccc", false, 0, 0, false);
	
		modify("aaa", "pay", 30);
		modify("bbb", "expense", 30);
		
		verifyOut("aaa", true, 30, 0, false);
		verifyOut("bbb", true, 0, 30, true);
		verifyOut("ccc", false, 0, 0, false);
	});
	
	it("all inactive then two pay should balance expenses", function()
	{
		var pm = makePM(false, [0,0], [0,0], [0,0]);
		
		verifyOut("aaa", false, 0, 0, false);
		verifyOut("bbb", false, 0, 0, false);
		verifyOut("ccc", false, 0, 0, false);
	
		modify("aaa", "pay", 30);
		modify("bbb", "pay", 70);
		
		verifyOut("aaa", true, 30, 50, false);
		verifyOut("bbb", true, 70, 50, false);
		verifyOut("ccc", false, 0, 0, false);
	});
	
	it("initialize with locks", function()
	{
		var pm = makePM(false, [90,10], [0,20], [0,10], [0,50]);
		
		verifyOut("aaa", true, 90, 10, false);
		verifyOut("bbb", true, 0, 20, true);
		verifyOut("ccc", true, 0, 10, false);
		verifyOut("ddd", true, 0, 50, true);
	});
	
	it("lock and unlock is like do and redo", function()
	{
		var pm = makePM(false, [90,45], [0,45], [0,0]);
		
		verifyOut("aaa", true, 90, 45, false);
		verifyOut("bbb", true, 0, 45, false);
		verifyOut("ccc", false, 0, 0, false);
		
		modify("bbb", "expense", 50);		
		verifyOut("aaa", true, 90, 40, false);
		verifyOut("bbb", true, 0, 50, true);
		verifyOut("ccc", false, 0, 0, false);

		modify("aaa", "lock", true);		
		verifyOut("aaa", true, 90, 40, true);
		verifyOut("bbb", true, 0, 50, true);
		verifyOut("ccc", false, 0, 0, false);
		
		modify("aaa", "lock", false);		
		verifyOut("aaa", true, 90, 40, false);
		verifyOut("bbb", true, 0, 50, true);
		verifyOut("ccc", false, 0, 0, false)
	});
});