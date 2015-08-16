var initialize=function(docProxy,net,networkStatus){var ui;var hasSetStartPage=false;var model=Model(function(newdata){ui.update();docProxy.update(newdata)});var addWizard=AddWizard(model);var ui=MainUI(StatsUI(addWizard,model),PaymentUI(addWizard,model),PeopleUI(model),HeaderUI(model));ui.create($(document.body));var onData=function(data){model.reset(data);if(!hasSetStartPage){setStartPage(ui,model);hasSetStartPage=true}ui.update()};docProxy.onData(onData);docProxy.read()};var startApp=function(){FastClick.attach(document.body);var errorHandler={fatal:bailout,info:info};var networkStatus=NetworkStatus();var net=Net(JobQueue(),errorHandler,networkStatus);var id=window.location.pathname.substring(1);var docProxy=DocProxy(LocalDoc(id,window.localStorage||{}),RemoteDoc(id,net),networkStatus,errorHandler);networkStatus.onChanged(setOnlineCss);networkStatus.onChanged(function(isOnline){if(isOnline){docProxy.read()}});initialize(docProxy,net,networkStatus);var ajaxTimer=null;var messageObj={hide:$.noop};$(document).ajaxStart(function(){if(networkStatus.isOnline){ajaxTimer=setTimeout(function(){messageObj=showMessage(L.Saving)},2e3)}});$(document).ajaxStop(function(){clearTimeout(ajaxTimer);messageObj.hide()})};var loadApp=function(){var net=Net({},{},NetworkStatus());net.create(function(url){window.location.href=url})};var toNonNegativeNumber=function(str){str=str.trim().replace(",",".");var parsed=parseFloat(str);if(str.search(/[^0-9\.]/)>-1||isNaN(parsed)){return null}return parsed};var makeArray=function(length,defaultValue){var a=new Array(length);for(var i=0;i<a.length;i++){a[i]=defaultValue}return a};var transferPlan=function(balances){var MoneyTransfer=function(fromIndex,toIndex,amount){return{from:fromIndex,to:toIndex,amount:amount}};var IndexedBalance=function(i,balance){return{index:i,balance:balance}};var positives=[];var negatives=[];$.each(balances,function(i,value){if(value>0){positives.push(IndexedBalance(i,value))}else if(value<0){negatives.push(IndexedBalance(i,-value))}});var plan=[];var n=negatives.pop();var p=positives.pop();while(p&&n){var pReceived=0;var pIsSatisfied=false;do{var pRemains=p.balance-pReceived;pIsSatisfied=n.balance>=pRemains;var amount=pIsSatisfied?pRemains:n.balance;plan.push(MoneyTransfer(n.index,p.index,amount));pReceived+=amount;if(!pIsSatisfied){n=negatives.pop()}else{n.balance-=amount}}while(!pIsSatisfied&&n);p=positives.pop()}for(var i=0;i<plan.length;i++){plan[i].key=plan[i].from+"_"+plan[i].to+"_"+plan[i].amount}return plan};var testTransfer=function(balances){var sum=balances.reduce(function(a,b){return a+b});var normBalances=balances.map(function(v){return v-sum/balances.length});var plan=transferPlan(normBalances);var p=plan.pop();while(p){normBalances[p.from]+=p.amount;normBalances[p.to]-=p.amount;console.log(p.from+" -> "+p.to+": "+p.amount);p=plan.pop()}console.log(normBalances)};var isValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return trimmed===""||parseFloat(trimmed)==trimmed};var toValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return isNaN(parseFloat(trimmed))?null:parseFloat(trimmed)};var DataDiff=function(serverData,localData){var sameNamesAndPayments=function(){var acc=true;$.each(serverData.names,function(i,name){if(name!=localData.names[i]){acc=false;return false}});$.each(serverData.payments,function(i,payment){if(payment.text!=localData.payments[i].text){acc=false;return false}$.each(payment.values,function(j,valuePair){var localValuePair=localData.payments[i].values[j];if(valuePair[0]!==localValuePair[0]||valuePair[1]!==localValuePair[1]){acc=false;return false}})});return acc};var accepted=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length<serverData.payments.length){return false}return sameNamesAndPayments()};var isEmpty=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length!=serverData.payments.length){return false}return sameNamesAndPayments()};var paymentStats=function(index){return{localOnly:index<localData.payments.length&&index+1>serverData.payments.length}};var nameStats=function(index){return{localOnly:index<localData.names.length&&index+1>serverData.names.length}};var rebaseable=function(){var serverNewData=localData;if(serverData.names.length!=serverNewData.names.length){return false}for(var i=0;i<serverData.names.length;i++){if(serverData.names[i]!=serverNewData.names[i]){return false}}return true};var applyTo=function(otherData){var serverDiff=DataDiff(serverData,otherData);if(!serverDiff.rebaseable()){return null}var mergedData=otherData;var m=Model(function(d){mergedData=d});m.reset(otherData);var dh=m.getDataHelper();for(var i=serverData.payments.length;i<localData.payments.length;i++){var p=localData.payments[i];dh.addPayment(p.text,p.values)}dh.commit();return mergedData};return{accepted:accepted,rebaseable:rebaseable,isEmpty:isEmpty,payment:paymentStats,name:nameStats,applyTo:applyTo}};var DataHelper=function(data,onChange,onCommit){var eachPerson=function(callback){var makePerson=function(name,diff,nameIndex){var eachPayment=function(callback2){var makePayment=function(paymentIndex){var text=function(str){if(str===undefined){return data.payments[paymentIndex].text}data.payments[paymentIndex].text=str};var valuePair=function(pair){if(pair===undefined){return data.payments[paymentIndex].values[nameIndex]}data.payments[paymentIndex].values[nameIndex]=pair};return{text:text,valuePair:valuePair,index:paymentIndex}};for(var j=0;j<data.payments.length;j++){var v=data.payments[j].values[nameIndex];callback2(makePayment(j))}};var setName=function(newName){if(data.names[nameIndex]!==newName){data.names[nameIndex]=newName;onChange()}};var remove=function(){alert("not implemented!");return};callback({key:nameIndex,name:name,diff:diff,eachPayment:eachPayment,setName:setName,remove:remove})};for(var i=0;i<data.names.length;i++){var name=data.names[i];var diff=0;for(var j=0;j<data.payments.length;j++){diff+=data.payments[j].values[i][0];diff-=data.payments[j].values[i][1]}makePerson(name,diff,i)}};var name=function(index){return data.names[index]};var addPerson=function(name){data.names.push(name||"XXX");$.each(data.payments,function(i,p){p.values.push([0,0])});onChange()};var addPayment=function(text,values){data.payments.push({text:text||"...",values:values||makeArray(data.names.length,[0,0])})};var title=function(value){if(value===undefined){return data.title}data.title=value;onChange()};var eachPayment=function(callback){var cleanupPayments=function(){data.payments=data.payments.filter(function(p){return!p.remove})};var stillEnumerating=true;var makePayment=function(index){var payment=data.payments[index];var cost=function(){var c=0;for(var i=0;i<payment.values.length;i++){c+=payment.values[i][0]}return c};var text=function(str){if(str===undefined){return payment.text}payment.text=str;onChange()};var remove=function(){payment.remove=true;if(!stillEnumerating){cleanupPayments()}};callback({cost:cost,text:text,remove:remove,index:index})};for(var j=0;j<data.payments.length;j++){makePayment(j)}stillEnumerating=false;cleanupPayments()};var emptyPayment=function(){var p={text:"Beskrivning...",values:[]};for(var i=0;i<data.names.length;i++){p.values.push([0,0])}return p};var paymentByIndex=function(index){return data.payments[index]};var commit=function(){(onCommit||$.noop)()};return{eachPerson:eachPerson,eachPayment:eachPayment,name:name,payment:paymentByIndex,addPerson:addPerson,addPayment:addPayment,title:title,names:function(){return data.names},emptyPayment:emptyPayment,commit:commit}};var Model=function(onChangedCallback){var undoStack;var undoStackCursor;var gen=0;var currentData=function(){return $.extend(true,{},undoStack[undoStackCursor])};var onChanged=function(newData){undoStack=undoStack.slice(0,undoStackCursor+1);undoStack.push(newData);undoStackCursor++;onChangedCallback(newData)};var undo=function(){undoStackCursor=Math.max(0,undoStackCursor-1);gen++;onChangedCallback(undoStack[undoStackCursor])};var redo=function(){undoStackCursor=Math.min(undoStack.length-1,undoStackCursor+1);gen++;onChangedCallback(undoStack[undoStackCursor])};var reset=function(data){undoStack=[data];undoStackCursor=0;gen++};var getDataHelper=function(onDataHelperChange){var current=currentData();var validAtGen=gen;var onCommit=function(){if(validAtGen!==gen){throw"Tried to commit from an old dataHelper"}onChanged(current)};return DataHelper(current,onDataHelperChange||$.noop,onCommit)};return{undo:undo,redo:redo,reset:reset,getDataHelper:getDataHelper}};var JobQueue=function(){var previous=(new $.Deferred).resolve();var add=function(fn){var wrap=function(){var d=new $.Deferred;fn(function(){d.resolve()},function(){d.reject();previous=(new $.Deferred).resolve()});return d};previous=previous.then(wrap,function(){})};return{add:add}};var NetworkStatus=function(){var listeners=[];var obj={isOnline:true,setOnline:function(isOnline){if(obj.isOnline!=isOnline){obj.isOnline=isOnline;$.each(listeners,function(i,l){l(isOnline)})}},onChanged:function(listener){listeners.push(listener)}};return obj};var Net=function(jobQueue,errorHandler,networkStatus){var pingTimer=null;var ajax=function(url,data,onSuccess,onError){$.ajax({type:"POST",url:"/"+url,data:JSON.stringify(data),contentType:"application/json",success:function(o){networkStatus.setOnline(true);onSuccess(o)},error:function(o){if(networkStatus.isOnline){errorHandler.info(L.OfflineMode);networkStatus.setOnline(false)}window.clearTimeout(pingTimer);pingTimer=window.setTimeout(function(){ajax("ping",{},function(){info(L.OnlineMode)},$.noop)},3e3);onError(o)}})};var create=function(onSuccess){ajax("create",{},function(response){onSuccess(response.url)},$.noop)};var read=function(idObj,onSuccess,onError){var success=function(response){if(response.err){info(response.err)}else{onSuccess(response)}};ajax("get",idObj,success,onError)};var update=function(doc,onSuccess,onConflict,onError){var resolve;var reject;var success=function(response){if(response.err){errorHandler.fatal(response.err);reject()}else if(response.ok){resolve();onSuccess()}else{var serverDoc={data:response.data,generation:response.generation,id:response.id};onConflict(serverDoc);reject()}};var error=function(err){resolve();onError(err)};jobQueue.add(function(resolveJob,rejectJob){resolve=resolveJob;reject=rejectJob;ajax("update",doc,success,error)})};var sendmail=function(message){ajax("sendmail",message,$.noop,$.noop)};return{create:create,update:update,read:read,sendmail:sendmail}};var RemoteDoc=function(id,net){var generation;var update=function(updateData,onSuccess,onConflict,onError){if(!generation){}var onConflictInternal=function(conflictDoc){var data=conflictDoc.data;generation=conflictDoc.generation;onConflict(data)};generation++;net.update({id:id,generation:generation,data:updateData},onSuccess,onConflictInternal,onError)};var read=function(onData,onError){net.read({id:id},function(doc){generation=doc.generation;onData(doc.data)},onError)};return{read:read,update:update,isFirstGeneration:function(){return generation==0}}};var LocalDoc=function(id,storage){var supported=function(){return storage!==undefined};var exists=function(key){return supported()&&storage[id+"_"+key]!==undefined};var update=function(key,data){if(supported()){if(data===undefined){delete storage[id+"_"+key]}else{storage[id+"_"+key]=JSON.stringify(data)}}};var read=function(key){if(!exists(key)){throw"local doc does not exist!"}return JSON.parse(storage[id+"_"+key])};return{update:update,read:read,exists:exists}};var DocProxy=function(localDoc,remoteDoc,networkStatus,errorHandler){var isFirstRead=true;var lastServerData;var onData;var onDataInternal=function(data){if(onData){onData(data)}};var update=$.noop;var read=function(){log("Read...");if(isFirstRead){isFirstRead=false;if(localDoc.exists("mine")!=localDoc.exists("theirs")){localDoc.update("mine");localDoc.update("theirs")}if(localDoc.exists("mine")){lastServerData=localDoc.read("theirs");onDataInternal(localDoc.read("mine"))}}if(networkStatus.isOnline){var onRemoteDocData=function(data){logData(data,"Read onData");if(lastServerData){var localDiff=DataDiff(lastServerData,localDoc.read("mine"));var anyLocalChanges=!localDiff.isEmpty();if(anyLocalChanges){if(DataDiff(lastServerData,data).rebaseable()){logData(lastServerData,"Merge base ");logData(data,"Merge their");logData(localDoc.read("mine"),"Merge mine ");data=localDiff.applyTo(data);update(data)}else{errorHandler.info("Internal Error: Could not merge local changes!")}}}if(JSON.stringify(data)!=JSON.stringify(lastServerData)){onDataInternal(data)}lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var onRemoteDocError=function(err){log("Read onError!");if(!lastServerData){errorHandler.fatal("Oooops!")}};remoteDoc.read(onRemoteDocData,onRemoteDocError)}if(!lastServerData&&!networkStatus.isOnline){errorHandler.fatal("Ooooops!")}};update=function(data){logData(data,"Update...");var onOffline=function(){log("Update offline!");if(DataDiff(lastServerData,data).accepted()){localDoc.update("mine",data)}else{errorHandler.info(L.OfflineMode);onDataInternal(localDoc.read("mine"))}};var onSuccess=function(){logData(data,"Update success");lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var updateConflictInternal=function(conflictData){logData(conflictData,"Update conflict!");var serverDiff=DataDiff(lastServerData,conflictData);var localDiff=DataDiff(lastServerData,data);if(serverDiff.rebaseable()&&localDiff.accepted()){var mergeData=localDiff.applyTo(conflictData);localDoc.update("mine",mergeData);localDoc.update("theirs",conflictData);lastServerData=conflictData;update(mergeData);onDataInternal(mergeData)}else{errorHandler.info(L.SomeoneMadeAChangeTryAgain);lastServerData=conflictData;localDoc.update("mine",conflictData);localDoc.update("theirs",conflictData);onDataInternal(conflictData)}};if(networkStatus.isOnline){remoteDoc.update(data,onSuccess,updateConflictInternal,onOffline)}else{onOffline()}};var setOnData=function(f){if(onData){errorHandler.fatal("Internal error: Must not set multiple onData handlers.")}onData=f};return{read:read,update:update,onData:setOnData,isFirstGeneration:function(){return remoteDoc.isFirstGeneration()}}};var PaymentUI=function(addWizard,model){var $addButton=null;var $historyContainer=null;var $addWizard=null;var $note=null;var hideWizard=function(){$historyContainer.show();$addButton.show();$addWizard.hide();$note.show()};var showAddWizard=function(paymentIndex){$addButton.hide();$historyContainer.hide();$note.hide();addWizard.show($addWizard.empty().show(),hideWizard,paymentIndex)};var create=function($parent){var $historyHeader=$("<div/>").text("Tidigare betalningar");$pastPayments=$("<div/>");$historyContainer=$("<div/>");$note=$("<div/>");$addWizard=$("<div/>");$addButton=$("<div/>").addClass("payment-add").on("click",function(){showAddWizard()});$parent.append($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($addButton),$note,$historyContainer.append($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($historyHeader),$("<div/>").html(whiteSpace(1)),$pastPayments),$addWizard)};var update=function(){$pastPayments.empty();hideWizard();$historyContainer.hide();$note.hide();var dh=model.getDataHelper();dh.eachPayment(function(payment){var $p=$("<div/>").addClass("flex-horizontal-container flex-justify-center");var $clickable=$("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment small-text");var $label=$("<span/>").html(payment.text()+whiteSpace(3));var $cost=$("<span/>").html(formatMoney(payment.cost()));var $confirm=$("<div/>").hide().addClass("confirm-remove").text("Ta bort").on("click",function(){payment.remove();dh.commit()});var $remove=$("<div/>").addClass("payment-remove").on("click",function(e){$confirm.toggle("fast");e.stopPropagation()});$p.on("click",function(){showAddWizard(payment.index)});$pastPayments.append($p.append($confirm,$clickable.append($label.addClass("flex-grow"),$cost),$remove));$historyContainer.show()});var note=function(text){$note.html($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($("<span/>").html(text))).show()};var noNamesYet=dh.names().length==0;if(noNamesYet){$addButton.hide();note("Lägg först till några personer");return}$addButton.show();var noPaymentsYet=$pastPayments.find("*").length==0;if(noPaymentsYet){note("Lägg till betalningar här")}};return{create:create,update:update}};var PayModel=function(names,payment,allActiveDefault){var persons=[];var eachPerson=function(callback){$.each(names,function(i,name){var updateCallback=$.noop;var p={isActive:allActiveDefault||payment.values[i][0]!==0||payment.values[i][1]!==0,pay:payment.values[i][0],expense:payment.values[i][1],isLocked:false,update:function(){payment.values[i][0]=p.pay;payment.values[i][1]=p.expense;updateCallback(p.isActive,p.pay,p.expense,p.isLocked)}};var onUpdate=function(updateCallback_){updateCallback=updateCallback_;p.update()};var iteratePersons=function(itCallback){for(var j=0;j<persons.length;j++){itCallback(persons[j].internal,j==i)}};var updateAll=function(){iteratePersons(function(it){it.update()})};var otherUnlockedActiveFilter=function(cb){return function(it,isMe){if(!isMe&&it.isActive&&!it.isLocked){cb(it)}}};var unlockedActiveFilter=function(cb){return function(it,isMe){if(it.isActive&&!it.isLocked){cb(it)}}};var distributeExpense=function(contrib,includeMe){var notDistributed=0;var numCandidates=0;var isCandidate=function(it){return contrib>0?it.expense>0:true};var filter=includeMe?unlockedActiveFilter:otherUnlockedActiveFilter;iteratePersons(filter(function(it){if(isCandidate(it)){numCandidates++}}));iteratePersons(filter(function(it){if(isCandidate(it)){it.expense-=contrib/numCandidates;if(it.expense<0){notDistributed-=it.expense;it.expense=0}}}));if(notDistributed>.01){distributeExpense(notDistributed)}};var toggleActive=function(){if(!p.isActive){p.isActive=true;p.update();return}iteratePersons(function(p){p.isLocked=false});var expense=p.expense;var pay=p.pay;var contrib=pay-expense;p.expense=0;p.pay=0;p.isActive=false;p.isLocked=false;distributeExpense(contrib);updateAll()};var expense=function(value){if(value<0){p.update();return}var numUnlockedOthers=0;var expenseUnlockedOthers=0;iteratePersons(otherUnlockedActiveFilter(function(it){expenseUnlockedOthers+=it.expense;numUnlockedOthers++}));if(numUnlockedOthers===0){p.update();return}value=Math.min(value,p.expense+expenseUnlockedOthers);p.isLocked=true;var contrib=value-p.expense;p.expense=value;distributeExpense(contrib);updateAll()};var pay=function(value){if(value<0){p.update();return}var contrib=p.pay-value;p.pay=value;iteratePersons(function(it){it.isLocked=false});distributeExpense(contrib,true);updateAll()};var lock=function(shouldLock){p.isLocked=shouldLock;p.update()};var external={name:name,onUpdate:onUpdate,toggleActive:toggleActive,expense:expense,pay:pay,lock:lock};persons.push({external:external,internal:p});callback(external)})};return{eachPerson:eachPerson}};var PersonPayment=function(person){var $container=$("<div/>").addClass("payment-person-container");var $nameRow=$("<div/>").addClass("flex-horizontal-container");var $inputRow=$("<div/>").addClass("flex-horizontal-container");var $indent=$("<div/>").addClass("payment-indent");var $name=$("<div/>").addClass("clickable-person flex-grow").text(person.name);var $payLabel=$("<div/>").text("Betalat").addClass("flex-grow pay-label");var $expenseLabel=$("<div/>").text("Spenderat").addClass("flex-grow expense-label");var moneyInput=function(){return $("<input type='number' pattern='[0-9]+([.|,][0-9]+)?' step='none'/>").css("width","4em").on("focus",function(){$(this).val("")})};var $payInput=moneyInput();var $expenseInput=moneyInput();var $locked=$("<div/>");var isLockedState;$container.append($nameRow.append($name),$inputRow.append($indent.clone(),$("<div/>").addClass("flex-vertical-container").append($("<div/>").addClass("flex-horizontal-container").append($payLabel,$payInput,$indent.clone()),$("<div/>").addClass("flex-horizontal-container").append($expenseLabel,$expenseInput,$locked))));$name.on("click",function(){person.toggleActive()});$payInput.on("change paste",function(){var parsed=toNonNegativeNumber($payInput.val());var isNull=parsed===null;if(!isNull){person.pay(parsed)}$payInput.css("background-color",isNull?"lightsalmon":"")});$expenseInput.on("change paste",function(){var parsed=toNonNegativeNumber($expenseInput.val());var isNull=parsed===null;if(!isNull){person.expense(parsed)}$expenseInput.css("background-color",isNull?"lightsalmon":"")});$locked.on("click",function(){person.lock(!isLockedState)});person.onUpdate(function(isActive,payValue,expenseValue,isLocked){isLockedState=isLocked;if(isActive){$name.removeClass("inactive")}else{$name.addClass("inactive")}if(isLocked){$locked.removeClass("payment-unlocked transparent");$locked.addClass("payment-locked")}else{$locked.removeClass("payment-locked");$locked.addClass("payment-unlocked transparent")}$payInput.val(formatMoney(payValue).text());$expenseInput.val(formatMoney(expenseValue).text())});return{element:function(){return $container}}};var AddWizard=function(model){var Nav=function(onSave,onClose){var $close=$("<span/>").addClass("payment-back").on("click",onClose);var $save=$("<span/>").addClass("payment-save").on("click",onSave);var $dummy=$("<div/>").addClass("flex-grow");var $nav=$("<div/>").addClass("flex-horizontal-container").append($dummy.clone(),$close,$save,$dummy.clone());return{element:function(){return $nav}}};var $items;var show=function($parent,onClose,paymentIndex){var isNewPayment=paymentIndex===undefined;var dh=model.getDataHelper();var payment=isNewPayment?dh.emptyPayment():dh.payment(paymentIndex);var values=payment.values;var payModel=PayModel(dh.names(),payment,isNewPayment);var onSave=function(){if(isNewPayment){dh.addPayment(payment.text,values)}dh.commit();onClose()};var nav=Nav(onSave,onClose);var editableTitle=editable(payment.text,function(value){if(value==""){payment.text="...";editableTitle.set("...")}else{payment.text=value}});var $title=editableTitle.element().addClass("payment-title-wizard").one("click",function(){if(isNewPayment){editableTitle.set("")}}).on("click",editableTitle.editMode);$items=$("<div/>");var personPayments=[];payModel.eachPerson(function(person){personPayments.push(PersonPayment(person))});$.each(personPayments,function(i,pp){$items.append(pp.element())});$parent.append($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($title),$items,nav.element())};return{show:show}};var editable=function(text,onChange){onChange=onChange||$.noop;var $e=$("<span/>").html(text);var $input=$("<input/>").hide();var $cont=$("<span/>").append($e,$input);var editMode=function(){$input.val("");$input.css("width",$e.width()+5);$e.hide();$input.show().focus().on("blur",function(){$input.trigger("change")})};var set=function(value){$e.html(value)};$input.on("input paste",function(){var v=$input.val();$e.html(v);$input.css("width",$e.width()+5)});$input.on("submit change",function(){var v=$input.val();$e.html(v);$e.show();$input.hide();onChange(v)});$e.on("click",editMode);return{editMode:editMode,element:function(){return $cont},set:set}};var whiteSpace=function(count){var str="";while(count--){str+="&nbsp;"}return str};var formatMoney=function(value,keepDecimals){var color=value>0?"green":value<0?"red":"";var fixed=value.toFixed(2);var split=(""+fixed).split(".");var isNaturalNumber=split[1]==="00";var ret="";if(isNaturalNumber&&!keepDecimals){ret=parseInt(split[0])}else{ret=fixed}return $("<span/>").css("color",color).text(ret)};var StatsUI=function(addWizard,model){var $note=null;var $addWizard=null;var $stats=null;var $transferPlan=null;var $transfers=null;var hideWizard=function(){$addWizard.hide();$stats.show();$transferPlan.show();$note.show()};var editPayment=function(index){$addWizard.show();$stats.hide();$transferPlan.hide();$note.hide();addWizard.show($addWizard.empty(),hideWizard,index)};var update=function(){$stats.empty();$transfers.empty();$transferPlan.hide();$note.hide();var balances=[];var persons=[];var dh=model.getDataHelper();dh.eachPerson(function(person){balances.push(person.diff);persons.push(person)});persons=persons.sort(function(p1,p2){return p1.diff-p2.diff});$.each(persons,function(i,person){var $details=$("<div/>").addClass("small-text").hide();person.eachPayment(function(payment){var diff=payment.valuePair()[0]-payment.valuePair()[1];if(diff===0){return}var $detail=$("<div/>").addClass("clickable-payment flex-horizontal-container flex-justify-center").append($("<div/>").html(payment.text()+whiteSpace(3)).addClass("flex-grow"),$("<div/>").html(formatMoney(diff,true))).on("click",function(){editPayment(payment.index)});$details.append($detail)});$personSummary=$("<div/>").addClass("flex-horizontal-container person-summary").append($("<span/>").html(person.name+whiteSpace(3)).addClass("flex-grow"),$("<span/>").html(formatMoney(person.diff,true)));var $stat=$("<div/>").append($personSummary,$details);$personSummary.on("click",function(){$details.slideToggle("fast")});$stats.append($stat)});var plan=transferPlan(balances);$.each(plan,function(i,transfer){var $plan=$("<div/>").append($("<span/>").html(dh.name(transfer.from)+" ska ge "),formatMoney(transfer.amount),$("<span/>").html(" till "+dh.name(transfer.to)));$transfers.append($plan);$transferPlan.show()});var note=function(text){$note.html($("<div/>").addClass("flex-horizontal-container flex-justify-center").append($("<span/>").html(text))).show()};if(dh.names().length==0){note("Lägg först till några personer");return}};var create=function($parent){var $transferHeader=$("<div/>").text("Utjämnande överföringar");$stats=$("<div/>");$note=$("<note/>");$transferPlan=$("<div/>");$transfers=$("<div/>").addClass("small-text");$addWizard=$("<div/>").hide();$parent.append($note,$addWizard,$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($stats),$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($transferPlan.append($("<div/>").html(whiteSpace(1)),$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($transferHeader),$("<div/>").html(whiteSpace(1)),$transfers)))};return{create:create,update:update}};var PeopleUI=function(model){var $names=$();var create=function($parent){$names=$("<div/>");var $add=$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($("<div/>").addClass("people-add").on("click",function(){var dh=model.getDataHelper();dh.addPerson("Namn");dh.commit()}));$parent.append($add,$names)};var update=function(){$names.empty();var dh=model.getDataHelper();dh.eachPerson(function(person){var $name=$("<div/>");var editableName=editable(person.name,function(newName){person.setName(newName);dh.commit()});var $name=editableName.element();var $confirm=$("<div/>").hide().addClass("confirm-remove").text("Ta bort").on("click",function(){person.remove();dh.commit()});var $remove=$("<div/>").addClass("people-remove").on("click",function(e){$confirm.toggle("fast");e.stopPropagation()});$row=$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($confirm,$name.addClass("flex-grow"),$("<span/>").html(whiteSpace(3)),$remove);$names.append($row)});var noNamesYet=$names.find("*").length==0;if(noNamesYet){var $info=$("<div/>").addClass("flex-horizontal-container flex-justify-center").append($("<span/>").text("Lägg till personer här"));$names.append($info)}};return{create:create,update:update}};var HeaderUI=function(model){var $header=null;var update=function(){var dataHelper=model.getDataHelper();var title=dataHelper.title();title=title==""?"...":title;var editableHeader=editable(title,function(newValue){dataHelper.title(newValue);dataHelper.commit()});$header.empty();$header.append(editableHeader.element().on("click",function(){editableHeader.editMode()}))};var init=function($headerElem){$header=$headerElem};return{update:update,init:init}};var MainUI=function(statsUI,paymentUI,peopleUI,headerUI){var $overviewNav;var $paymentsNav;var $peopleNav;var create=function($parent){var $root=$("<div/>").addClass("ui-root flex-vertical-container");var $header=$("<div/>");var $topNavigation=$("<div/>").addClass("ui-navigation-bar flex-horizontal-container flex-justify-center small-padding");var $statusBar=$("<div/>").addClass("ui-status-bar flex-horizontal-container flex-justify-center messagecontainer");var $contentContainer=$("<div/>").addClass("scrollable ui-content-container flex-grow small-padding");var $paymentContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $peopleContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $statsContentFlex=$("<div/>").addClass("ui-content flex-horizontal-container flex-justify-center");var $headerFlex=$("<div/>").addClass("ui-header small-padding flex-horizontal-container flex-justify-center");var $peopleContent=$("<div/>");var $paymentContent=$("<div/>");var $statsContent=$("<div/>");$overviewNav=$("<div/>").addClass("nav nav-stats");$paymentsNav=$("<div/>").addClass("nav nav-payments");$peopleNav=$("<div/>").addClass("nav nav-people");var navClick=function(){$(".ui-content").hide();$(".nav").addClass("transparent");$(this).removeClass("transparent")};$overviewNav.on("click",function(){navClick.call(this);$statsContentFlex.show().focus()});$paymentsNav.on("click",function(){navClick.call(this);$paymentContentFlex.show().focus()});$peopleNav.on("click",function(){navClick.call(this);$peopleContentFlex.show().focus()});statsUI.create($statsContent);paymentUI.create($paymentContent);peopleUI.create($peopleContent);headerUI.init($header);$parent.empty().addClass("ui-parent");$parent.append($root.append($headerFlex.append($header),$topNavigation.append($peopleNav,$paymentsNav,$overviewNav),$statusBar,$contentContainer.append($statsContentFlex.append($statsContent),$paymentContentFlex.append($paymentContent),$peopleContentFlex.append($peopleContent))));$paymentsNav.trigger("click");$(window).on("click",function(){$(".confirm-remove").hide("fast")})};var update=function(){headerUI.update();statsUI.update();paymentUI.update();peopleUI.update()};return{create:create,update:update,navPeople:function(){$peopleNav.trigger("click")},navPayments:function(){$paymentsNav.trigger("click")},navStats:function(){$overviewNav.trigger("click")}}};var setStartPage=function(mainUi,model){var dh=model.getDataHelper();if(dh.names().length==0){mainUi.navPeople()}else{mainUi.navPayments()}};var Help=function($helpContainer,net,networkStatus,highlightHelpButtonFunc){$helpContainer.addClass("help-container yellow");var text=function(content){return $("<div/>").addClass("help-text").append($("<span/>").html(content))};var header=function(content){return $("<div/>").addClass("help-header").append($("<span/>").html(content))};$helpContainer.append(header("&nbsp;"),header(L.HelpHeader1),text(L.HelpText1),header(L.HelpHeader2),text(L.HelpText2),header(L.HelpHeader3),text(L.HelpText3),header(L.HelpHeader4),text(L.HelpText4),header(L.HelpHeader5),text(L.HelpText5),text("&nbsp;"));var $comment=$("<span/>");var emailSent=false;var updateSubmitButton;var $textArea=$("<textarea/>").addClass("help-submit").attr("cols",40).attr("rows",8).on("input paste",function(){updateSubmitButton()});var $inputEmail=$("<input/>").addClass("help-submit").attr("placeholder",L.ExampleEmail).on("input paste",function(){updateSubmitButton()});var $submit=$("<button/>").html(L.SubmitFeedback).addClass("help-submit").on("click",function(){net.sendmail({message:$textArea.val(),from:$inputEmail.val()});emailSent=true;updateSubmitButton();$submit.html(L.ThankYou);setTimeout(function(){
$textArea.val("");emailSent=false;$submit.html(L.SubmitFeedback);updateSubmitButton()},2e3)});updateSubmitButton=function(){var enabled=networkStatus.isOnline&&$textArea.val()!=""&&!emailSent&&$inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/)>-1;$submit.attr("disabled",!enabled)};networkStatus.onChanged(function(){updateSubmitButton()});$helpContainer.append($comment.append($textArea,$("<br/>"),$inputEmail,$("<br/>"),$submit));updateSubmitButton();var visible=false;var toggle=function(){if(visible){$helpContainer.slideUp()}else{$helpContainer.slideDown()}visible=!visible};var getShowHelpButton=function(){var $highlighter=$("<span/>").html("&nbsp;&nbsp;&nbsp;&#x2190;&nbsp;"+L.Help).hide();var $helpButton=$("<span/>").append($("<span/>").html("&nbsp;&#x2261;&nbsp;"),$highlighter).css("cursor","pointer").on("click",function(){highlightHelpButtonFunc=function(){return false},toggle()});var toggleHighlight=function(){if(highlightHelpButtonFunc()){$highlighter.fadeToggle("fast")}else{$highlighter.hide()}setTimeout(toggleHighlight,750)};toggleHighlight();return $helpButton};return{getShowHelpButton:getShowHelpButton}};var isCtrlZ=function(e){e=window.event||e;return e.keyCode==90&&e.ctrlKey};var isCtrlY=function(e){e=window.event||e;return e.keyCode==89&&e.ctrlKey};var showMessage=function(message,delay){$(".messagecontainer").empty();var $message=$("<div/>").addClass("message yellow info").text(message).hide();$(".messagecontainer").append($message);var timer=null;var obj={hide:function(){$message.slideUp();obj.hide=$.noop;clearTimeout(timer)}};$message.slideDown("fast");timer=setTimeout(function(){$message.slideUp()},delay||3e3);return obj};var bailout=function(message){showMessage(message||L.UnknownErrorReloadPage);setTimeout(function(){window.location.href=window.location.href},3e3)};var info=function(message,delay){return showMessage(message,delay)};var setOnlineCss=function(isOnline){if(isOnline){$(".root").removeClass("offline")}else{$(".root").addClass("offline")}};var log=function(message){if(false){console.log(message)}};var logData=function(data,message){if(message){log(message)}var str="";for(var i=0;i<data.payments.length;i++){str+=data.payments[i].text+", "}log(" - "+str)};
//# sourceMappingURL=source.js.map