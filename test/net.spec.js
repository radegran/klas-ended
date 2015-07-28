var L = {};

describe("Net", function()
{
	describe("JobQueue", function() 
	{
		beforeEach(function() { jasmine.clock().install(); });
		afterEach(function() { jasmine.clock().uninstall(); });
		
		it("should discard queued jobs when a job rejects", function()
		{
			var str = "";
			var f1 = function(resolve, reject) { setTimeout(function() { str += "f1"; resolve(); }, 100); };
			var f2 = function(resolve, reject) { setTimeout(function() { str += "f2"; resolve(); }, 100); };
			var f3 = function(resolve, reject) { setTimeout(function() { str += "f3"; reject(); }, 100); };
			var f4 = function(resolve, reject) { setTimeout(function() { str += "f4"; resolve(); }, 100); };
			var f5 = function(resolve, reject) { setTimeout(function() { str += "f5"; resolve(); }, 100); };
			
			var jq = JobQueue();
			jq.add(f1);
			jq.add(f2);
			jq.add(f3);
			jq.add(f4);
			
			jasmine.clock().tick(99); expect(str).toBe("");
			jasmine.clock().tick(1); expect(str).toBe("f1");
			jasmine.clock().tick(99); expect(str).toBe("f1");
			jasmine.clock().tick(1); expect(str).toBe("f1f2");
			jasmine.clock().tick(100); expect(str).toBe("f1f2f3");
			jasmine.clock().tick(500); expect(str).toBe("f1f2f3");
			
			jq.add(f5);
			
			jasmine.clock().tick(99); expect(str).toBe("f1f2f3");
			jasmine.clock().tick(1); expect(str).toBe("f1f2f3f5");
		});
	});
	
	describe("RemoteDoc", function()
	{
		var infoSpy;
		var fatalSpy;
		
		var makeRemoteDoc = function(data, generation)
		{
			var errorHandler = {"fatal": $.noop, "info": $.noop};
			var net = Net(JobQueue(), errorHandler);
			infoSpy = spyOn(errorHandler, "info");
			fatalSpy = spyOn(errorHandler, "fatal");
			
			return RemoteDoc({"data": data, "generation": generation, "id": "some_id"}, net);
		};
		
		it("should hold update data and step generation on success", function()
		{
			var rd = makeRemoteDoc(42, 0);
			
			// mock
			$.ajax = function(obj)
			{
				obj.success({ok:true});
			};
			
			rd.update(43, $.noop);
			
			expect(infoSpy).not.toHaveBeenCalled();
			expect(fatalSpy).not.toHaveBeenCalled();			
			expect(rd.data()).toBe(43);
			expect(rd.generation()).toBe(1);
		});
		
		it("should trigger conflict callback", function()
		{
			var rd = makeRemoteDoc(42, 0);
			
			// mock
			$.ajax = function(obj)
			{
				// no 'ok' means conflict...
				obj.success({data: 99, generation: 3, id: "some_id"});
			};
			
			var conflictSpy = jasmine.createSpy('conflict');
			rd.update(43, conflictSpy);
			
			expect(infoSpy).toHaveBeenCalled();
			expect(fatalSpy).not.toHaveBeenCalled();
			expect(conflictSpy).toHaveBeenCalledWith(99);
			expect(rd.data()).toBe(99);
			expect(rd.generation()).toBe(3);			
		});
		
		it("should call fatal error handler when server reports internal error", function()
		{
			var rd = makeRemoteDoc(42, 0);
			
			// mock
			$.ajax = function(obj)
			{
				obj.success({err: "aah"});
			};
			
			rd.update(43, $.noop);
			
			expect(infoSpy).not.toHaveBeenCalled();
			expect(fatalSpy).toHaveBeenCalled();			
		});
		
		it("should call fatal error handler when ajax call fails", function()
		{
			var rd = makeRemoteDoc(42, 0);
			
			// mock
			$.ajax = function(obj)
			{
				obj.error({err: "aah"});
			};
			
			rd.update(43, $.noop);
			
			expect(infoSpy).not.toHaveBeenCalled();
			expect(fatalSpy).toHaveBeenCalled();			
		});
	});
});