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
			remoteDoc.update(99, $.noop, conflictHandler, $.noop);

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
			remoteDoc.update(43, $.noop, $.noop, errHandler);
			
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
	
	describe("DocProxy", function()
	{
		var online = $.noop;
		var storage;
		var remoteMock;
		var errorHandler;
		
		var makeDocProxy = function()
		{
			storage = {};
			remoteMock = {
				"read": function(onData, onError) {},
				"update": function(data, onConflict, onError) {}
			};
			
			var status = {isOnline: true};
			online = function(isOnline)
			{
				status.isOnline = isOnline;
			};
			
			errorHandler = jasmine.createSpyObj('errorHandler', ['info', 'fatal']);
			
			return DocProxy(LocalDoc(storage), remoteMock, status, errorHandler);
		};
				
		describe("update function", function() 
		{
			it("update(testData) -> local:testData", function()
			{
				var dp = makeDocProxy();
				var h = jasmine.createSpyObj('h', ['onConflict']);
				remoteMock.read = function(onData, e) { onData(getTestData()); };
				remoteMock.update = function(d, c, e) {};
				
				dp.read();
				dp.update(getTestData(), h.onConflict);
				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(getTestData()));
				expect(h.onConflict).not.toHaveBeenCalled();		
			});
			
			it("update(testData), remote conflict(modifiedData) -> modifiedData, local:modifiedData", function()
			{
				var m = makeModel();
				m.updatePaymentValue(999, 1, 1);
				
				var dp = makeDocProxy();
				var h = jasmine.createSpyObj('h', ['onConflict']);
				remoteMock.read = function(onData, e) { onData(getTestData()); };
				remoteMock.update = function(d, s, conflict, e) { conflict(localData); };
				
				dp.read();
				dp.update(getTestData(), h.onConflict);
				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(localData));
				expect(h.onConflict).toHaveBeenCalledWith(jasmine.objectContaining(localData));
			});
			
			// TODO: some local changes should be accepted!
			it("local:testData, update(modifiedData), remote error -> testData, local:testData", function()
			{
				var m = makeModel();
				
				var dp = makeDocProxy();
				remoteMock.read = function(onData, e) { onData(getTestData()); };
				remoteMock.update = function(d, s, c, error) { error(); };
				
				// Arrange to get local:testData
				dp.read();				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(getTestData()));
				
				// Make some modification, write to 'localData' variable
				m.updatePaymentValue(999, 1, 1);
				
				var h = jasmine.createSpyObj('h', ['onConflict']);
				dp.update(localData, h.onConflict);
				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(getTestData()));
				expect(h.onConflict).toHaveBeenCalledWith(jasmine.objectContaining(getTestData()));
			});
			
			it("local:testData, update(extendedData), remote error -> extendedData, local:extendedData", function()
			{
				var m = makeModel();
				m.addRow();
				m.updatePaymentText("mama", 3);
				
				var dp = makeDocProxy();
				remoteMock.read = function(onData, e) { onData(getTestData()); };
				remoteMock.update = function(d, s, c, error) { error(); };
				
				var h = jasmine.createSpyObj('h', ['onConflict']);
				
				dp.read();				
				dp.update(localData, h.onConflict);
				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(localData));
				expect(h.onConflict).not.toHaveBeenCalled();
			});
			
			it("offline: an unacceptable change to rollback to last acceptable data", function()
			{
				var m = makeModel();
				m.addRow();
				m.updatePaymentText("mama", 3);
				
				var dp = makeDocProxy();
				remoteMock.read = function(onData, e) { onData(getTestData()); };
				remoteMock.update = function(d, s, c, error) { error(); };
				var h = jasmine.createSpyObj('h', ['onConflict']);
				
				dp.read();				
				dp.update(localData, h.onConflict);
				var acceptedData = localData;
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(acceptedData));
				
				m.updatePaymentValue(999, 1, 1);
				dp.update(localData, h.onConflict);
				
				expect(JSON.parse(storage.data)).toEqual(jasmine.objectContaining(acceptedData));
				expect(h.onConflict).toHaveBeenCalledWith(jasmine.objectContaining(acceptedData));
			});
		});
		
		describe("read function", function() 
		{
			it("local:null, remote:error -> fatal error", function()
			{
				var dp = makeDocProxy();
				remoteMock.read = function(a,onError) { onError(); };
				
				var handler = jasmine.createSpy('h');
				dp.onData(handler);
				dp.read();
				
				expect(handler).not.toHaveBeenCalled();
				expect(errorHandler.info).not.toHaveBeenCalled();
				expect(errorHandler.fatal).toHaveBeenCalled();
			});
			
			it("local:null, remote:42 -> 42", function()
			{
				var dp = makeDocProxy();
				remoteMock.read = function(onData,a) { onData(42); };
				
				var handler = jasmine.createSpy('h');
				dp.onData(handler);
				dp.read();
				
				expect(handler).toHaveBeenCalledWith(42);
				expect(handler.calls.count()).toBe(1);
				expect(errorHandler.info).not.toHaveBeenCalled();
				expect(errorHandler.fatal).not.toHaveBeenCalled();
			});
			
			it("local:42, remote:error -> 42", function()
			{
				var dp = makeDocProxy();
				storage.data = "42";
				remoteMock.read = function(a,onError) { onError(); };
				
				var handler = jasmine.createSpy('h');
				dp.onData(handler);
				dp.read();
				
				expect(handler).toHaveBeenCalledWith(42);
				expect(handler.calls.count()).toBe(1);
				expect(errorHandler.info).not.toHaveBeenCalled(); // should be called by net code though
				expect(errorHandler.fatal).not.toHaveBeenCalled();
			});
			
			it("local:42, remote:99 -> 42 and then 99", function()
			{
				var dp = makeDocProxy();
				storage.data = "42";
				remoteMock.read = function(onData,a) { onData(99); };
				
				var handler = jasmine.createSpy('h');
				dp.onData(handler);
				dp.read();
				
				expect(handler.calls.argsFor(0)[0]).toBe(42);
				expect(handler.calls.argsFor(1)[0]).toBe(99);
				expect(handler.calls.count()).toBe(2);
				expect(errorHandler.info).not.toHaveBeenCalled();
				expect(errorHandler.fatal).not.toHaveBeenCalled();
			});
			
			it("local:{a:{b:42}}, remote:{a:{b:42}} -> {a:{b:42}} only once", function()
			{
				var dp = makeDocProxy();
				storage.data = JSON.stringify({a:{b:42}});
				remoteMock.read = function(onData,a) { onData({a:{b:42}}); };
				
				var handler = jasmine.createSpy('h');
				dp.onData(handler);
				dp.read();
				
				expect(handler.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({a:{b:42}}));
				expect(handler.calls.count()).toBe(1);
				expect(errorHandler.info).not.toHaveBeenCalled(); 
				expect(errorHandler.fatal).not.toHaveBeenCalled();
			});
			
			it("offline, local:null -> fatal error", function()
			{
				var dp = makeDocProxy();		
				online(false);
				var handler = jasmine.createSpy('h');
				remoteMock.read = function(onData,a) { onData(42); }; // should not matter
				
				dp.read(handler);
				
				expect(handler).not.toHaveBeenCalled();
				expect(errorHandler.info).not.toHaveBeenCalled(); 
				expect(errorHandler.fatal).toHaveBeenCalled();
			});
		});
	});
});