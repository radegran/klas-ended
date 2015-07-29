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
		
		var makeRemoteDoc = function()
		{
			var errorHandler = {"fatal": $.noop, "info": $.noop};
			var net = Net(JobQueue(), errorHandler, NetworkStatus());
			infoSpy = spyOn(errorHandler, "info");
			fatalSpy = spyOn(errorHandler, "fatal");
			spyOn($, "ajax");
			
			return RemoteDoc("some_id", net);
		};
		
		var prevAjaxCall = function()
		{
			return $.ajax.calls.mostRecent().args[0];
		};
		
		var prevAjaxData = function()
		{
			return JSON.parse(prevAjaxCall().data);
		};
		
		it("should read data", function()
		{
			var onData = jasmine.createSpy('onData');
			
			var remoteDoc = makeRemoteDoc();
			remoteDoc.read(onData);
			
			prevAjaxCall().success({"data": 42, "generation": 0});
			expect(prevAjaxData().id).toBe("some_id");
			expect(onData).toHaveBeenCalledWith(42);
		});
		
		it("should update", function() 
		{
			var remoteDoc = makeRemoteDoc();
			
			remoteDoc.read($.noop);
			prevAjaxCall().success({"data": 42, "generation": 0});
			
			remoteDoc.update(99, $.noop);
			expect(prevAjaxData()).toEqual(jasmine.objectContaining({"data": 99, "generation": 1}));

			prevAjaxCall().success({ok:true});
			
			expect(infoSpy).not.toHaveBeenCalled();
			expect(fatalSpy).not.toHaveBeenCalled();			
		});
		
		it("should trigger conflict callback", function()
		{
			var conflictHandler = jasmine.createSpy('h');
			
			var remoteDoc = makeRemoteDoc();
			remoteDoc.update(99, conflictHandler, $.noop);

			prevAjaxCall().success({"data": 101, "generation": 3});
			
			expect(conflictHandler).toHaveBeenCalledWith(101);
			expect(infoSpy).toHaveBeenCalled();
			expect(fatalSpy).not.toHaveBeenCalled();			
		});
		
		it("should call fatal error handler when server reports internal error", function()
		{
			var remoteDoc = makeRemoteDoc();
			remoteDoc.update(43, $.noop);
			
			prevAjaxCall().success({"err": "..."});
			
			expect(infoSpy).not.toHaveBeenCalled();
			expect(fatalSpy).toHaveBeenCalled();			
		});
		
		it("should call info error handler when ajax call fails", function()
		{
			var errHandler = jasmine.createSpy('h');
			
			var remoteDoc = makeRemoteDoc();
			remoteDoc.update(43, $.noop, errHandler);
			
			prevAjaxCall().error({"err": "..."});
			
			expect(errHandler).toHaveBeenCalled();
			expect(infoSpy).toHaveBeenCalled();
			expect(fatalSpy).not.toHaveBeenCalled();					
		});
		
		it("should tell if its the first generation", function()
		{
			var remoteDoc = makeRemoteDoc();
			
			remoteDoc.read($.noop);
			prevAjaxCall().success({"data": 42, "generation": 0});
			expect(remoteDoc.isFirstGeneration()).toBe(true);
			
			remoteDoc.update(43, $.noop);
			expect(remoteDoc.isFirstGeneration()).toBe(false);
		});
	});
});