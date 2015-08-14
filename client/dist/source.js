var initialize=function(docProxy,net,networkStatus){var ui;var model=Model(function(newdata){ui.update();docProxy.update(newdata)});var addWizard=AddWizard(model);var ui=MainUI(StatsUI(addWizard,model),PaymentUI(addWizard,model),PeopleUI(model),HeaderUI(model));ui.create($(document.body));var onData=function(data){model.reset(data);ui.update()};docProxy.onData(onData);docProxy.read()};var startApp=function(){FastClick.attach(document.body);var errorHandler={fatal:bailout,info:info};var networkStatus=NetworkStatus();var net=Net(JobQueue(),errorHandler,networkStatus);var id=window.location.pathname.substring(1);var docProxy=DocProxy(LocalDoc(id,window.localStorage||{}),RemoteDoc(id,net),networkStatus,errorHandler);networkStatus.onChanged(setOnlineCss);networkStatus.onChanged(function(isOnline){if(isOnline){docProxy.read()}});initialize(docProxy,net,networkStatus);var ajaxTimer=null;var messageObj={hide:$.noop};$(document).ajaxStart(function(){if(networkStatus.isOnline){ajaxTimer=setTimeout(function(){messageObj=showMessage(L.Saving)},2e3)}});$(document).ajaxStop(function(){clearTimeout(ajaxTimer);messageObj.hide()})};var loadApp=function(){var net=Net({},{},NetworkStatus());net.create(function(url){window.location.href=url})};var toNonNegativeNumber=function(str){str=str.trim().replace(",",".");var parsed=parseFloat(str);if(str.search(/[^0-9\.]/)>-1||isNaN(parsed)){return null}return parsed};var makeArray=function(length,defaultValue){var a=new Array(length);for(var i=0;i<a.length;i++){a[i]=defaultValue}return a};var transferPlan=function(balances){var MoneyTransfer=function(fromIndex,toIndex,amount){return{from:fromIndex,to:toIndex,amount:amount}};var IndexedBalance=function(i,balance){return{index:i,balance:balance}};var positives=[];var negatives=[];$.each(balances,function(i,value){if(value>0){positives.push(IndexedBalance(i,value))}else if(value<0){negatives.push(IndexedBalance(i,-value))}});var plan=[];var n=negatives.pop();var p=positives.pop();while(p&&n){var pReceived=0;var pIsSatisfied=false;do{var pRemains=p.balance-pReceived;pIsSatisfied=n.balance>=pRemains;var amount=pIsSatisfied?pRemains:n.balance;plan.push(MoneyTransfer(n.index,p.index,amount));pReceived+=amount;if(!pIsSatisfied){n=negatives.pop()}else{n.balance-=amount}}while(!pIsSatisfied&&n);p=positives.pop()}for(var i=0;i<plan.length;i++){plan[i].key=plan[i].from+"_"+plan[i].to+"_"+plan[i].amount}return plan};var testTransfer=function(balances){var sum=balances.reduce(function(a,b){return a+b});var normBalances=balances.map(function(v){return v-sum/balances.length});var plan=transferPlan(normBalances);var p=plan.pop();while(p){normBalances[p.from]+=p.amount;normBalances[p.to]-=p.amount;console.log(p.from+" -> "+p.to+": "+p.amount);p=plan.pop()}console.log(normBalances)};var isValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return trimmed===""||parseFloat(trimmed)==trimmed};var toValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return isNaN(parseFloat(trimmed))?null:parseFloat(trimmed)};var DataDiff=function(serverData,localData){var sameNamesAndPayments=function(){var acc=true;$.each(serverData.names,function(i,name){if(name!=localData.names[i]){acc=false;return false}});$.each(serverData.payments,function(i,payment){if(payment.text!=localData.payments[i].text){acc=false;return false}$.each(payment.values,function(j,valuePair){var localValuePair=localData.payments[i].values[j];if(valuePair[0]!==localValuePair[0]||valuePair[1]!==localValuePair[1]){acc=false;return false}})});return acc};var accepted=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length<serverData.payments.length){return false}return sameNamesAndPayments()};var isEmpty=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length!=serverData.payments.length){return false}return sameNamesAndPayments()};var paymentStats=function(index){return{localOnly:index<localData.payments.length&&index+1>serverData.payments.length}};var nameStats=function(index){return{localOnly:index<localData.names.length&&index+1>serverData.names.length}};var rebaseable=function(){var serverNewData=localData;if(serverData.names.length!=serverNewData.names.length){return false}for(var i=0;i<serverData.names.length;i++){if(serverData.names[i]!=serverNewData.names[i]){return false}}return true};var applyTo=function(otherData){var serverDiff=DataDiff(serverData,otherData);if(!serverDiff.rebaseable()){return null}var mergedData=otherData;var m=Model(function(d){mergedData=d});m.reset(otherData);var dh=m.getDataHelper();for(var i=serverData.payments.length;i<localData.payments.length;i++){var p=localData.payments[i];dh.addPayment(p.text,p.values)}dh.commit();return mergedData};return{accepted:accepted,rebaseable:rebaseable,isEmpty:isEmpty,payment:paymentStats,name:nameStats,applyTo:applyTo}};var DataHelper=function(data,onChange,onCommit){var eachPerson=function(callback){var makePerson=function(name,diff,nameIndex){var eachPayment=function(callback2){var makePayment=function(paymentIndex){var text=function(str){if(str===undefined){return data.payments[paymentIndex].text}data.payments[paymentIndex].text=str};var valuePair=function(pair){if(pair===undefined){return data.payments[paymentIndex].values[nameIndex]}data.payments[paymentIndex].values[nameIndex]=pair};return{text:text,valuePair:valuePair,index:paymentIndex}};for(var j=0;j<data.payments.length;j++){var v=data.payments[j].values[nameIndex];callback2(makePayment(j))}};var setName=function(newName){if(data.names[nameIndex]!==newName){data.names[nameIndex]=newName;onChange()}};var remove=function(){alert("not implemented!");return};callback({key:nameIndex,name:name,diff:diff,eachPayment:eachPayment,setName:setName,remove:remove})};for(var i=0;i<data.names.length;i++){var name=data.names[i];var diff=0;for(var j=0;j<data.payments.length;j++){diff+=data.payments[j].values[i][0];diff-=data.payments[j].values[i][1]}makePerson(name,diff,i)}};var name=function(index){return data.names[index]};var addPerson=function(name){data.names.push(name||"XXX");$.each(data.payments,function(i,p){p.values.push([0,0])});onChange()};var addPayment=function(text,values){data.payments.push({text:text||"...",values:values||makeArray(data.names.length,[0,0])})};var title=function(value){if(value===undefined){return data.title}data.title=value;onChange()};var eachPayment=function(callback){var cleanupPayments=function(){data.payments=data.payments.filter(function(p){return!p.remove})};var stillEnumerating=true;var makePayment=function(index){var payment=data.payments[index];var cost=function(){var c=0;for(var i=0;i<payment.values.length;i++){c+=payment.values[i][0]}return c};var text=function(str){if(str===undefined){return payment.text}payment.text=str;onChange()};var remove=function(){payment.remove=true;if(!stillEnumerating){cleanupPayments()}};callback({cost:cost,text:text,remove:remove,index:index})};for(var j=0;j<data.payments.length;j++){makePayment(j)}stillEnumerating=false;cleanupPayments()};var emptyPayment=function(){var p={text:"Beskrivning...",values:[]};for(var i=0;i<data.names.length;i++){p.values.push([0,0])}return p};var paymentByIndex=function(index){return data.payments[index]};var commit=function(){(onCommit||$.noop)()};return{eachPerson:eachPerson,eachPayment:eachPayment,name:name,payment:paymentByIndex,addPerson:addPerson,addPayment:addPayment,title:title,names:function(){return data.names},emptyPayment:emptyPayment,commit:commit}};var Model=function(onChangedCallback){var undoStack;var undoStackCursor;var gen=0;var currentData=function(){return $.extend(true,{},undoStack[undoStackCursor])};var onChanged=function(newData){undoStack=undoStack.slice(0,undoStackCursor+1);undoStack.push(newData);undoStackCursor++;onChangedCallback(newData)};var undo=function(){undoStackCursor=Math.max(0,undoStackCursor-1);gen++;onChangedCallback(undoStack[undoStackCursor])};var redo=function(){undoStackCursor=Math.min(undoStack.length-1,undoStackCursor+1);gen++;onChangedCallback(undoStack[undoStackCursor])};var reset=function(data){undoStack=[data];undoStackCursor=0;gen++};var getDataHelper=function(onDataHelperChange){var current=currentData();var validAtGen=gen;var onCommit=function(){if(validAtGen!==gen){throw"Tried to commit from an old dataHelper"}onChanged(current)};return DataHelper(current,onDataHelperChange||$.noop,onCommit)};return{undo:undo,redo:redo,reset:reset,getDataHelper:getDataHelper}};var JobQueue=function(){var previous=(new $.Deferred).resolve();var add=function(fn){var wrap=function(){var d=new $.Deferred;fn(function(){d.resolve()},function(){d.reject();previous=(new $.Deferred).resolve()});return d};previous=previous.then(wrap,function(){})};return{add:add}};var NetworkStatus=function(){var listeners=[];var obj={isOnline:true,setOnline:function(isOnline){if(obj.isOnline!=isOnline){obj.isOnline=isOnline;$.each(listeners,function(i,l){l(isOnline)})}},onChanged:function(listener){listeners.push(listener)}};return obj};var Net=function(jobQueue,errorHandler,networkStatus){var pingTimer=null;var ajax=function(url,data,onSuccess,onError){$.ajax({type:"POST",url:"/"+url,data:JSON.stringify(data),contentType:"application/json",success:function(o){networkStatus.setOnline(true);onSuccess(o)},error:function(o){if(networkStatus.isOnline){errorHandler.info(L.OfflineMode);networkStatus.setOnline(false)}window.clearTimeout(pingTimer);pingTimer=window.setTimeout(function(){ajax("ping",{},function(){info(L.OnlineMode)},$.noop)},3e3);onError(o)}})};var create=function(onSuccess){ajax("create",{},function(response){onSuccess(response.url)},$.noop)};var read=function(idObj,onSuccess,onError){var success=function(response){if(response.err){info(response.err)}else{onSuccess(response)}};ajax("get",idObj,success,onError)};var update=function(doc,onSuccess,onConflict,onError){var resolve;var reject;var success=function(response){if(response.err){errorHandler.fatal(response.err);reject()}else if(response.ok){resolve();onSuccess()}else{var serverDoc={data:response.data,generation:response.generation,id:response.id};onConflict(serverDoc);reject()}};var error=function(err){resolve();onError(err)};jobQueue.add(function(resolveJob,rejectJob){resolve=resolveJob;reject=rejectJob;ajax("update",doc,success,error)})};var sendmail=function(message){ajax("sendmail",message,$.noop,$.noop)};return{create:create,update:update,read:read,sendmail:sendmail}};var RemoteDoc=function(id,net){var generation;var update=function(updateData,onSuccess,onConflict,onError){if(!generation){}var onConflictInternal=function(conflictDoc){var data=conflictDoc.data;generation=conflictDoc.generation;onConflict(data)};generation++;net.update({id:id,generation:generation,data:updateData},onSuccess,onConflictInternal,onError)};var read=function(onData,onError){net.read({id:id},function(doc){generation=doc.generation;onData(doc.data)},onError)};return{read:read,update:update,isFirstGeneration:function(){return generation==0}}};var LocalDoc=function(id,storage){var supported=function(){return storage!==undefined};var exists=function(key){return supported()&&storage[id+"_"+key]!==undefined};var update=function(key,data){if(supported()){if(data===undefined){delete storage[id+"_"+key]}else{storage[id+"_"+key]=JSON.stringify(data)}}};var read=function(key){if(!exists(key)){throw"local doc does not exist!"}return JSON.parse(storage[id+"_"+key])};return{update:update,read:read,exists:exists}};var DocProxy=function(localDoc,remoteDoc,networkStatus,errorHandler){var isFirstRead=true;var lastServerData;var onData;var onDataInternal=function(data){if(onData){onData(data)}};var update=$.noop;var read=function(){log("Read...");if(isFirstRead){isFirstRead=false;if(localDoc.exists("mine")!=localDoc.exists("theirs")){localDoc.update("mine");localDoc.update("theirs")}if(localDoc.exists("mine")){lastServerData=localDoc.read("theirs");onDataInternal(localDoc.read("mine"))}}if(networkStatus.isOnline){var onRemoteDocData=function(data){logData(data,"Read onData");if(lastServerData){var localDiff=DataDiff(lastServerData,localDoc.read("mine"));var anyLocalChanges=!localDiff.isEmpty();if(anyLocalChanges){if(DataDiff(lastServerData,data).rebaseable()){logData(lastServerData,"Merge base ");logData(data,"Merge their");logData(localDoc.read("mine"),"Merge mine ");data=localDiff.applyTo(data);update(data)}else{errorHandler.info("Internal Error: Could not merge local changes!")}}}if(JSON.stringify(data)!=JSON.stringify(lastServerData)){onDataInternal(data)}lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var onRemoteDocError=function(err){log("Read onError!");if(!lastServerData){errorHandler.fatal("Oooops!")}};remoteDoc.read(onRemoteDocData,onRemoteDocError)}if(!lastServerData&&!networkStatus.isOnline){errorHandler.fatal("Ooooops!")}};update=function(data){logData(data,"Update...");var onOffline=function(){log("Update offline!");if(DataDiff(lastServerData,data).accepted()){localDoc.update("mine",data)}else{errorHandler.info(L.OfflineMode);onDataInternal(localDoc.read("mine"))}};var onSuccess=function(){logData(data,"Update success");lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var updateConflictInternal=function(conflictData){logData(conflictData,"Update conflict!");var serverDiff=DataDiff(lastServerData,conflictData);var localDiff=DataDiff(lastServerData,data);if(serverDiff.rebaseable()&&localDiff.accepted()){var mergeData=localDiff.applyTo(conflictData);localDoc.update("mine",mergeData);localDoc.update("theirs",conflictData);lastServerData=conflictData;update(mergeData);onDataInternal(mergeData)}else{errorHandler.info(L.SomeoneMadeAChangeTryAgain);lastServerData=conflictData;localDoc.update("mine",conflictData);localDoc.update("theirs",conflictData);onDataInternal(conflictData)}};if(networkStatus.isOnline){remoteDoc.update(data,onSuccess,updateConflictInternal,onOffline)}else{onOffline()}};var setOnData=function(f){if(onData){errorHandler.fatal("Internal error: Must not set multiple onData handlers.")}onData=f};return{read:read,update:update,onData:setOnData,isFirstGeneration:function(){return remoteDoc.isFirstGeneration()}}};var PayModel=function(names,payment,allActiveDefault){var persons=[];var eachPerson=function(callback){$.each(names,function(i,name){var updateCallback=$.noop;var p={isActive:allActiveDefault||payment.values[i][0]!==0||payment.values[i][1]!==0,pay:payment.values[i][0],expense:payment.values[i][1],isLocked:false,update:function(){payment.values[i][0]=p.pay;payment.values[i][1]=p.expense;updateCallback(p.isActive,p.pay,p.expense,p.isLocked)}};var onUpdate=function(updateCallback_){updateCallback=updateCallback_;p.update()};var iteratePersons=function(itCallback){for(var j=0;j<persons.length;j++){itCallback(persons[j].internal,j==i)}};var updateAll=function(){iteratePersons(function(it){it.update()})};var otherUnlockedActiveFilter=function(cb){return function(it,isMe){if(!isMe&&it.isActive&&!it.isLocked){cb(it)}}};var unlockedActiveFilter=function(cb){return function(it,isMe){if(it.isActive&&!it.isLocked){cb(it)}}};var distributeExpense=function(contrib,includeMe){var notDistributed=0;var numCandidates=0;var isCandidate=function(it){return contrib>0?it.expense>0:true};var filter=includeMe?unlockedActiveFilter:otherUnlockedActiveFilter;iteratePersons(filter(function(it){if(isCandidate(it)){numCandidates++}}));iteratePersons(filter(function(it){if(isCandidate(it)){it.expense-=contrib/numCandidates;if(it.expense<0){notDistributed-=it.expense;it.expense=0}}}));if(notDistributed>.01){distributeExpense(notDistributed)}};var toggleActive=function(){if(!p.isActive){p.isActive=true;p.update();return}var expense=p.expense;var pay=p.pay;var contrib=pay-expense;p.expense=0;p.pay=0;p.isActive=false;p.isLocked=false;distributeExpense(contrib);updateAll()};var expense=function(value){if(value<0){p.update();return}var numUnlockedOthers=0;var expenseUnlockedOthers=0;iteratePersons(otherUnlockedActiveFilter(function(it){expenseUnlockedOthers+=it.expense;numUnlockedOthers++}));if(numUnlockedOthers===0){p.update();return}value=Math.min(value,p.expense+expenseUnlockedOthers);p.isLocked=true;var contrib=value-p.expense;p.expense=value;distributeExpense(contrib);updateAll()};var pay=function(value){if(value<0){p.update();return}var contrib=p.pay-value;p.pay=value;iteratePersons(function(it){it.isLocked=false});distributeExpense(contrib,true);updateAll()};var lock=function(shouldLock){p.isLocked=shouldLock;p.update()};var external={name:name,onUpdate:onUpdate,toggleActive:toggleActive,expense:expense,pay:pay,lock:lock};persons.push({external:external,internal:p});callback(external)})};return{eachPerson:eachPerson}};var AddWizard=function(model){var Nav=function(onSave,onClose){var $close=$("<span/>").text("(X)").on("click",onClose);var $save=$("<span/>").text("(Save)").on("click",onSave);var $nav=$("<div/>").append($save,$close);return{element:function(){return $nav}}};var $table;var show=function($parent,onClose,paymentIndex){var isNewPayment=paymentIndex===undefined;var dh=model.getDataHelper();var payment=isNewPayment?dh.emptyPayment():dh.payment(paymentIndex);var values=payment.values;var payModel=PayModel(dh.names(),payment,isNewPayment);var onSave=function(){if(isNewPayment){dh.addPayment(payment.text,values)}dh.commit();onClose()};var nav=Nav(onSave,onClose);var editableTitle=editable(payment.text,function(value){payment.text=value});var $title=editableTitle.element().on("click",editableTitle.editMode);$table=$("<table/>");payModel.eachPerson(function(person){var editablePayment=editable(0,function(value){var parsed=toNonNegativeNumber(value);if(parsed===null){alert("ILLEGAL NUMBER!!!.   Todo här att fixa...")}person.pay(parsed)});var editableExpense=editable(0,function(value){var parsed=toNonNegativeNumber(value);if(parsed===null){alert("ILLEGAL NUMBER!!!.   Todo här att fixa...")}person.expense(parsed)});var locked=false;var $active=$("<span/>");var $payment=editablePayment.element();var $expense=editableExpense.element();var $locked=$("<span/>").on("click",function(){person.lock(!locked)});var $label=$("<div/>").append($active,$("<span/>").text(person.name)).on("click",person.toggleActive);person.onUpdate(function(isActiveicipating,payValue,expenseValue,isLocked){if(isActiveicipating){$active.text("(y)");$payment.show();$expense.show();$locked.show()}else{$active.text("(n)");$payment.hide();$expense.hide();$locked.hide()}editablePayment.set(payValue);editableExpense.set(expenseValue);locked=isLocked;$locked.text(isLocked?"(L)":"(N)")});var $row=$("<tr/>").append($("<td/>").append($label),$("<td/>").append($payment),$("<td/>").append($expense),$("<td/>").append($locked));$table.append($row)});$parent.append($title,$table,nav.element())};return{show:show}};var PaymentUI=function(addWizard,model){var $addButton=null;var $history=null;var $addWizard=null;var hideWizard=function(){$history.show();$addButton.show();$addWizard.hide()};var showAddWizard=function(paymentIndex){$addButton.hide();$history.hide();addWizard.show($addWizard.empty().show(),hideWizard,paymentIndex)};var create=function($parent){$history=$("<div/>");$addWizard=$("<div/>");$addButton=$("<span/>").addClass("add-button").text("New payment").on("click",function(){showAddWizard()});$parent.append($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($addButton),$history,$addWizard)};var update=function(){$history.empty();hideWizard();var dh=model.getDataHelper();dh.eachPayment(function(payment){var $p=$("<div/>").addClass("flex-horizontal-container");var $label=$("<span/>").html(payment.text());var $cost=$("<span/>").html("(cost:"+payment.cost()+")");var $remove=$("<span/>").html("(X)").on("click",function(){payment.remove();dh.commit()});$p.on("click",function(){showAddWizard(payment.index)});$history.append($p.append($label.addClass("flex-grow"),$cost,$remove))})};return{create:create,update:update}};var editable=function(text,onChange){onChange=onChange||$.noop;var $e=$("<span/>").html(text);var $input=$("<input/>").hide();var $cont=$("<span/>").append($e,$input);var editMode=function(){$input.val($e.html());$e.hide();$input.show().focus().on("blur",function(){$input.trigger("change")})};var set=function(value){$e.html(value)};$input.on("change",function(){$e.html($input.val());$e.show();$input.hide();onChange($input.val())});$e.on("click",editMode);return{editMode:editMode,element:function(){return $cont},set:set}};var StatsUI=function(addWizard,model){var $addWizard=null;var $stats=null;var $transferPlan=null;var hideWizard=function(){$addWizard.hide();$stats.show();$transferPlan.show()};var editPayment=function(index){$addWizard.show();$stats.hide();$transferPlan.hide();addWizard.show($addWizard.empty(),hideWizard,index)};var update=function(){$stats.empty();$transferPlan.empty();var balances=[];var dh=model.getDataHelper();dh.eachPerson(function(person){balances.push(person.diff);var $details=$("<div/>").css("font-size","0.7em").hide();person.eachPayment(function(payment){var diff=payment.valuePair()[0]-payment.valuePair()[1];var $detail=$("<div/>").append($("<span/>").text(payment.text()),$("<span/>").text("(diff:"+diff+")")).on("click",function(){editPayment(payment.index)});$details.append($detail)});$personSummary=$("<span/>").append($("<span/>").text(person.name),$("<span/>").text(person.diff));var $stat=$("<div/>").append($personSummary,$details);$personSummary.on("click",function(){$details.slideToggle("fast")});$stats.append($stat)});var plan=transferPlan(balances);$.each(plan,function(i,transfer){var $plan=$("<div/>").text(dh.name(transfer.from)+" ska ge "+transfer.amount+" till "+dh.name(transfer.to));$transferPlan.append($plan)})};var create=function($parent){$stats=$("<div/>");$transferPlan=$("<div/>");$addWizard=$("<div/>").hide();$parent.append($addWizard,$stats,$transferPlan)};return{create:create,update:update}};var PeopleUI=function(model){var $names=$();var $add=$();var create=function($parent){$names=$("<div/>");$add=$("<span/>").addClass("add-button").text("(+)").on("click",function(){var dh=model.getDataHelper();dh.addPerson();dh.commit()});$parent.append($names,$add)};var update=function(){$names.empty();var dh=model.getDataHelper();dh.eachPerson(function(person){var $name=$("<div/>");var editableName=editable(person.name,function(newName){person.setName(newName);dh.commit()});var $name=editableName.element();var $edit=$("<span/>").text("(...)").on("click",function(){editableName.editMode()});var $remove=$("<span/>").text("(X)").on("click",function(){person.remove();dh.commit()});$row=$("<div/>").addClass("flex-horizontal-container").append($name.addClass("flex-grow"),$edit,$remove);$names.append($row)})};return{create:create,update:update}};var HeaderUI=function(model){var $header=null;var update=function(){var dataHelper=model.getDataHelper();var editableHeader=editable(dataHelper.title(),function(newValue){dataHelper.title(newValue);dataHelper.commit()});$header.empty();$header.append(editableHeader.element().on("click",function(){editableHeader.editMode()}))};var init=function($headerElem){$header=$headerElem};return{update:update,init:init}};var MainUI=function(statsUI,paymentUI,peopleUI,headerUI){var create=function($parent){var $root=$("<div/>").addClass("ui-root flex-vertical-container");var $header=$("<div/>");var $topNavigation=$("<div/>").addClass("ui-navigation-bar flex-horizontal-container flex-justify-center small-padding");var $statusBar=$("<div/>").addClass("ui-status-bar small-padding").text("status").hide();var $contentContainer=$("<div/>").addClass("scrollable ui-content-container flex-grow small-padding");var $paymentContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $peopleContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $statsContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $headerFlex=$("<div/>").addClass("ui-header small-padding flex-horizontal-container flex-justify-center");var $peopleContent=$("<div/>");var $paymentContent=$("<div/>");var $statsContent=$("<div/>");var $overviewNav=$("<div/>").text("(stats)");var $paymentsNav=$("<div/>").text("(payments)");var $peopleNav=$("<div/>").text("(people)");$overviewNav.on("click",function(){$(".ui-content").hide();$statsContentFlex.show().focus()});$paymentsNav.on("click",function(){$(".ui-content").hide();$paymentContentFlex.show().focus()});$peopleNav.on("click",function(){$(".ui-content").hide();$peopleContentFlex.show().focus()});statsUI.create($statsContent);paymentUI.create($paymentContent);peopleUI.create($peopleContent);headerUI.init($header);$parent.empty().addClass("ui-parent");$parent.append($root.append($headerFlex.append($header),$topNavigation.append($overviewNav,$paymentsNav,$peopleNav),$statusBar,$contentContainer.append($statsContentFlex.append($statsContent),$paymentContentFlex.append($paymentContent),$peopleContentFlex.append($peopleContent))));$paymentsNav.trigger("click")};var update=function(){headerUI.update();statsUI.update();paymentUI.update();peopleUI.update()};return{create:create,update:update}};var addButtonCell=function(onclick){var c=$("<td/>").html("&nbsp;+&nbsp;");c.on("click",onclick);c.css("cursor","pointer");return c};var makeEditable=function($td,currentValue,onNewValue){currentValue=currentValue===null?"":currentValue+"";var $elem=$("<div/>").text(currentValue);$td.html($elem);$elem.off("blur");$elem.off("keydown");$elem.attr("contentEditable",true);$elem.on("blur",function(){var newValue=$(this).text();if(newValue!==currentValue){currentValue=newValue;onNewValue(newValue)}});$elem.on("keydown",function(e){if(e.which==13){e.preventDefault();$elem.blur()}})};var Table=function($header,$table,model,help,paymentWizard){var newRow=function(){return $("<tr/>")};var setup=function(){var $addColumnCell=addButtonCell(function(){model.addColumn();$(this).prev().find("div").text("").focus()});var $addRowCell=addButtonCell(function(){model.addRow();$(this).parent().prev().find("td:first").find("div").text("").focus()});$table.empty().append(newRow().addClass("column-header-row").append($("<td/>").append(help.getShowHelpButton()),$addColumnCell.addClass("add-column-cell")),newRow().addClass("add-row-row").append($addRowCell.addClass("add-row-cell")),newRow().addClass("diff-row").append($("<td/>")));$table.off("keydown");$table.on("keydown",function(e){if(isCtrlY(e)||isCtrlZ(e)){return false}});$(window).off("keydown");$(window).on("keydown",function(e){if(isCtrlY(e)){model.redo();return false}if(isCtrlZ(e)){model.undo();return false}})};var updatePaymentPlan=function(data,plan){$table.find(".transfer-plan").remove();$table.append($("<tr><td>&nbsp;</td></tr>").addClass("transfer-plan"));$.each(plan,function(i,moneyTransfer){var longRow=function(text){var tr=$("<tr/>").addClass("transfer-plan");var td=$("<td colspan="+(data.names.length+1)+"/>");if(text){td.text(text)}else{td.html("&nbsp;")}return tr.append(td)};var mt=moneyTransfer;if(mt.amount>.005){$table.append(longRow(data.names[mt.from]+" "+L.ShouldGive+" "+mt.amount.toFixed(2)+" "+L.To+" "+data.names[mt.to]))}})};var updatePyjamasClasses=function(){$table.find("tr").each(function(i){if(i%2==0){$(this).addClass("even")}else{$(this).removeClass("even")}})};var updateHeader=function(data){makeEditable($header,data.title,function(newTitle){if(newTitle==""){newTitle="..."}model.updateTitle(newTitle)})};var updateTotalDiffRow=function(data){var $diffRow=$table.find(".diff-row");$diffRow.find(".diff-cell").remove();var totalDiffs=new Array(data.names.length);for(var i=0;i<totalDiffs.length;i++)totalDiffs[i]=0;$(data.payments).each(function(i,payment){var rowSum=0;var rowCount=0;$(payment.values).each(function(i,value){if(value!==null){rowSum+=value;rowCount++}});$(payment.values).each(function(i,value){if(value!==null){totalDiffs[i]+=value-rowSum/rowCount}})});for(var i=0;i<totalDiffs.length;i++){var twoDecimals=totalDiffs[i].toFixed(2);$diffRow.append($("<td/>").addClass("diff-cell").text(twoDecimals).css("color",twoDecimals>0?"limegreen":twoDecimals<0?"salmon":""))}$diffRow.append($("<td/>").addClass("diff-cell"));return totalDiffs};var updateNamesAndPayments=function(data){var d3table=d3.select($table[0]);var firstRowCell=d3table.select("tr").selectAll("td.cell").data(data.names);firstRowCell.enter().insert("td",".add-column-cell").attr("class","cell");firstRowCell.each(function(d,i){makeEditable($(this),d,function(newValue){model.updateName(newValue,i)})});firstRowCell.exit().remove();var paymentRow=d3table.select("tbody").selectAll("tr.payment-row").data(data.payments);var paymentRowEnter=paymentRow.enter().insert("tr",".add-row-row").attr("class","payment-row");paymentRowEnter.append("td");paymentRowEnter.append("td").attr("class","tombstone");paymentRow.select("td").attr("class","payment-text").each(function(d,i){makeEditable($(this),d.text,function(newValue){model.updatePaymentText(newValue,i)})});paymentRow.exit().remove();var paymentCell=paymentRow.selectAll("td.cell").data(function(d){return d.values});paymentCell.enter().insert("td",".tombstone");paymentCell.attr("class",function(value){return value===null?"cell nullvalue":"cell"}).style("background-color","").each(function(value,i,j){var $cell=$(this);makeEditable($cell,value,function(newValue){newValue=newValue.replace(/,/g,".");if(isValidCellValue(newValue)){$cell.css("background-color","");model.updatePaymentValue(toValidCellValue(newValue),j,i)}else{$cell.css("background-color","lightsalmon")}})});paymentCell.exit().remove()};var update=function(data){$table.find("*").off("blur");updateHeader(data);updateNamesAndPayments(data);var diffs=updateTotalDiffRow(data);updatePaymentPlan(data,transferPlan(diffs));updatePyjamasClasses()};setup();return{update:update}};var Help=function($helpContainer,net,networkStatus,highlightHelpButtonFunc){$helpContainer.addClass("help-container yellow");var text=function(content){return $("<div/>").addClass("help-text").append($("<span/>").html(content))};var header=function(content){return $("<div/>").addClass("help-header").append($("<span/>").html(content))};$helpContainer.append(header("&nbsp;"),header(L.HelpHeader1),text(L.HelpText1),header(L.HelpHeader2),text(L.HelpText2),header(L.HelpHeader3),text(L.HelpText3),header(L.HelpHeader4),text(L.HelpText4),header(L.HelpHeader5),text(L.HelpText5),text("&nbsp;"));var $comment=$("<span/>");var emailSent=false;var updateSubmitButton;var $textArea=$("<textarea/>").addClass("help-submit").attr("cols",40).attr("rows",8).on("input paste",function(){updateSubmitButton()});var $inputEmail=$("<input/>").addClass("help-submit").attr("placeholder",L.ExampleEmail).on("input paste",function(){updateSubmitButton()});var $submit=$("<button/>").html(L.SubmitFeedback).addClass("help-submit").on("click",function(){net.sendmail({message:$textArea.val(),from:$inputEmail.val()});emailSent=true;updateSubmitButton();$submit.html(L.ThankYou);setTimeout(function(){$textArea.val("");emailSent=false;$submit.html(L.SubmitFeedback);updateSubmitButton()},2e3)});updateSubmitButton=function(){var enabled=networkStatus.isOnline&&$textArea.val()!=""&&!emailSent&&$inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/)>-1;$submit.attr("disabled",!enabled)};networkStatus.onChanged(function(){updateSubmitButton()});$helpContainer.append($comment.append($textArea,$("<br/>"),$inputEmail,$("<br/>"),$submit));updateSubmitButton();var visible=false;var toggle=function(){if(visible){$helpContainer.slideUp()}else{$helpContainer.slideDown()}visible=!visible};var getShowHelpButton=function(){var $highlighter=$("<span/>").html("&nbsp;&nbsp;&nbsp;&#x2190;&nbsp;"+L.Help).hide();var $helpButton=$("<span/>").append($("<span/>").html("&nbsp;&#x2261;&nbsp;"),$highlighter).css("cursor","pointer").on("click",function(){
highlightHelpButtonFunc=function(){return false},toggle()});var toggleHighlight=function(){if(highlightHelpButtonFunc()){$highlighter.fadeToggle("fast")}else{$highlighter.hide()}setTimeout(toggleHighlight,750)};toggleHighlight();return $helpButton};return{getShowHelpButton:getShowHelpButton}};var isCtrlZ=function(e){e=window.event||e;return e.keyCode==90&&e.ctrlKey};var isCtrlY=function(e){e=window.event||e;return e.keyCode==89&&e.ctrlKey};var showMessage=function(message,delay){$(".messagecontainer").empty();var $message=$("<div/>").addClass("message yellow info").text(message).hide();$(".messagecontainer").append($message);var timer=null;var obj={hide:function(){$message.slideUp();obj.hide=$.noop;clearTimeout(timer)}};$message.slideDown("fast");timer=setTimeout(function(){$message.slideUp()},delay||3e3);return obj};var bailout=function(message){showMessage(message||L.UnknownErrorReloadPage);setTimeout(function(){window.location.href=window.location.href},3e3)};var info=function(message,delay){return showMessage(message,delay)};var setOnlineCss=function(isOnline){if(isOnline){$(".root").removeClass("offline")}else{$(".root").addClass("offline")}};var log=function(message){if(false){console.log(message)}};var logData=function(data,message){if(message){log(message)}var str="";for(var i=0;i<data.payments.length;i++){str+=data.payments[i].text+", "}log(" - "+str)};
//# sourceMappingURL=source.js.map