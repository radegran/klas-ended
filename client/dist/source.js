var initialize=function(docProxy,net,networkStatus,errorHandler){var ui;var model=Model(function(newdata){ui.update();docProxy.update(newdata)});var $uiRoot=div("ui-root");var paymentWizard=PaymentWizard(model,errorHandler,$uiRoot);ui=UI(TitleUI(model,HelpUI(model,net,networkStatus,$uiRoot)),MainContentUI(StatsUI(paymentWizard,model),PaymentUI(paymentWizard,model)),AddPaymentButtonUI(paymentWizard,model));ui.create($uiRoot);$(document.body).append($uiRoot);var onData=function(data){model.reset(data);ui.update()};docProxy.onData(onData);docProxy.read()};var preloadImages=function(){for(var i=0;i<arguments.length;i++){$(document.body).append($("<img />").attr("src",arguments[i]).css("display","none"))}};var startApp=function(){FastClick.attach(document.body);var errorHandler={fatal:bailout,info:info};var networkStatus=NetworkStatus();var net=Net(JobQueue(),errorHandler,networkStatus);var id=window.location.pathname.substring(1);var docProxy=DocProxy(LocalDoc(id,window.localStorage||{}),RemoteDoc(id,net),networkStatus,errorHandler);networkStatus.onChanged(setOnlineCss);networkStatus.onChanged(function(isOnline){if(isOnline){docProxy.read()}});initialize(docProxy,net,networkStatus,errorHandler);var ajaxTimer=null;var messageObj={hide:$.noop};nonbounceSetup();$(window).on("click",function(e){var $inTopMostVolatileContainer=$(e.target).parents(".volatile-container").last().find(".volatile");$(e.target).parents(".ui-root").find(".volatile").not($inTopMostVolatileContainer).hide(showHideSpeed)});$(document).ajaxStart(function(){if(networkStatus.isOnline){ajaxTimer=setTimeout(function(){messageObj=showMessage(L.Saving)},2e3)}});$(document).ajaxStop(function(){clearTimeout(ajaxTimer);messageObj.hide()})};var loadApp=function(){var net=Net({},{},NetworkStatus());net.create(function(url){window.location.href=url})};var TitleUI=function(model,helpUI){var $title=null;var update=function(){var dh=model.getDataHelper();var title=dh.title();title=title==""?"...":title;document.title=title;var editableTitle=editable(title,function(newValue){document.title=newValue;dh.title(newValue);dh.commit()});$title.empty();$title.append(editableTitle.element().on("click",function(){editableTitle.editMode()}))};var create=function($parent){var $help=div("flex-no-shrink").css("font-size","0.5em");helpUI.create($help);$title=horizontal("");var $indent=div("flex-grow").css({"max-width":"1.6em"});$parent.append(horizontalFill("flex-align-center").append($indent,div("flex-grow"),$title,div("flex-grow"),$help))};return{update:update,create:create}};var AddPaymentButtonUI=function(paymentWizard,model){var $addPaymentButton=null;var $addPaymentHelp=null;var $parentElem=null;var update=function(){var dh=model.getDataHelper();if(dh.payment(0)==null){$addPaymentHelp.show()}else{$addPaymentHelp.hide()}if(dh.names().length==0){$parentElem.slideUp()}else{$parentElem.slideDown()}};var create=function($parent){$parentElem=$parent;$addPaymentHelp=div().html("Lägg till nya betalningar här").css("cursor","pointer");$addPaymentButton=horizontal().append(div("payment-add").load("plus.svg"),$addPaymentHelp).on("click",function(){paymentWizard.show()});$parent.append(horizontal().append($addPaymentButton))};return{update:update,create:create}};var HelpUI=function(model,net,networkStatus,$uiRoot){var create=function($parent){var $urlContainer=div("big-margin").append(horizontal().html(L.CopyUrlInfo).addClass("small-text unselectable"),horizontal().append($("<a/>").attr("href",window.location.href).html(window.location.href).addClass("small-text big-margin")),div("big-margin unselectable").html(whiteSpace(1)));var $container=vertical();var emailSent=false;var updateSubmitButton;var $textArea=$("<textarea/>").addClass("big-margin small-text").val(L.CommentSample).css("width","15em").attr("rows",6).on("focus",function(){if($textArea.val()==L.CommentSample)$textArea.val("")}).on("input paste",function(){updateSubmitButton()});var $inputEmail=$("<input/>").addClass("big-margin small-text").css("width","15em").css("background-color","transparent").css("padding","6px").css("border","1px solid rgb(79,93,115)").attr("placeholder",L.ExampleEmail).on("input paste",function(){updateSubmitButton()});var $submit=$("<button/>").addClass("mail-button big-margin").load("mail.svg").on("click",function(){net.sendmail({message:$textArea.val(),from:$inputEmail.val()});emailSent=true;updateSubmitButton();$textArea.val(L.ThankYou);setTimeout(function(){emailSent=false;updateSubmitButton()},2e3)});updateSubmitButton=function(){var enabled=networkStatus.isOnline&&$textArea.val()!=""&&!emailSent&&$inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/)>-1;$submit.attr("disabled",!enabled);if(enabled){$submit.removeClass("transparent")}else{$submit.addClass("transparent")}};networkStatus.onChanged(function(){updateSubmitButton()});$container.append($urlContainer,horizontal().append($textArea),horizontal().append($inputEmail),horizontal().append($submit));updateSubmitButton();var $helpButton=div("help-button").load("help.svg");var $closeButton=div("payment-back").load("back.svg");$parent.append(horizontal().append($helpButton));var $helpContainer=vertical("ui-root").append(div("ui-content-container flex-grow nonbounce").append(vertical("ui-content small-padding").append($container.addClass("flex-grow"))),horizontal("ui-footer small-padding").append($closeButton));$helpContainer.css("left","100%").hide();$(document.body).append($helpContainer);$helpButton.on("click",function(e){$helpContainer.show();setTimeout(function(){$helpContainer.addClass("translate");$uiRoot.addClass("translate")},0)});$closeButton.on("click",function(){$helpContainer.removeClass("translate");$uiRoot.removeClass("translate");setTimeout(function(){$helpContainer.hide()},500)});nonbounceSetup()};return{create:create}};var toNonNegativeNumber=function(str){str=str.trim().replace(",",".");var parsed=parseFloat(str);if(str.search(/[^0-9\.]/)>-1||isNaN(parsed)){return null}return parsed};var makeArray=function(length,defaultValue){var a=new Array(length);for(var i=0;i<a.length;i++){a[i]=defaultValue}return a};var transferPlan=function(balances){var MoneyTransfer=function(fromIndex,toIndex,amount){return{from:fromIndex,to:toIndex,amount:amount}};var IndexedBalance=function(i,balance){return{index:i,balance:balance}};var positives=[];var negatives=[];$.each(balances,function(i,value){if(value>0){positives.push(IndexedBalance(i,value))}else if(value<0){negatives.push(IndexedBalance(i,-value))}});var plan=[];var n=negatives.pop();var p=positives.pop();while(p&&n){var pReceived=0;var pIsSatisfied=false;do{var pRemains=p.balance-pReceived;pIsSatisfied=n.balance>=pRemains;var amount=pIsSatisfied?pRemains:n.balance;plan.push(MoneyTransfer(n.index,p.index,amount));pReceived+=amount;if(!pIsSatisfied){n=negatives.pop()}else{n.balance-=amount}}while(!pIsSatisfied&&n);p=positives.pop()}for(var i=0;i<plan.length;i++){plan[i].key=plan[i].from+"_"+plan[i].to+"_"+plan[i].amount}return plan};var testTransfer=function(balances){var sum=balances.reduce(function(a,b){return a+b});var normBalances=balances.map(function(v){return v-sum/balances.length});var plan=transferPlan(normBalances);var p=plan.pop();while(p){normBalances[p.from]+=p.amount;normBalances[p.to]-=p.amount;console.log(p.from+" -> "+p.to+": "+p.amount);p=plan.pop()}console.log(normBalances)};var isValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return trimmed===""||parseFloat(trimmed)==trimmed};var toValidCellValue=function(text){var trimmed=text.replace(/ /g,"");return isNaN(parseFloat(trimmed))?null:parseFloat(trimmed)};var DataDiff=function(serverData,localData){var sameNamesAndPayments=function(){var acc=true;$.each(serverData.names,function(i,name){if(name!=localData.names[i]){acc=false;return false}});$.each(serverData.payments,function(i,payment){if(payment.text!=localData.payments[i].text){acc=false;return false}$.each(payment.values,function(j,valuePair){var localValuePair=localData.payments[i].values[j];if(valuePair[0]!==localValuePair[0]||valuePair[1]!==localValuePair[1]){acc=false;return false}})});return acc};var accepted=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length<serverData.payments.length){return false}return sameNamesAndPayments()};var isEmpty=function(){if(serverData.title!=localData.title||localData.names.length!=serverData.names.length||localData.payments.length!=serverData.payments.length){return false}return sameNamesAndPayments()};var paymentStats=function(index){return{localOnly:index<localData.payments.length&&index+1>serverData.payments.length}};var nameStats=function(index){return{localOnly:index<localData.names.length&&index+1>serverData.names.length}};var rebaseable=function(){var serverNewData=localData;if(serverData.names.length!=serverNewData.names.length){return false}for(var i=0;i<serverData.names.length;i++){if(serverData.names[i]!=serverNewData.names[i]){return false}}return true};var applyTo=function(otherData){var serverDiff=DataDiff(serverData,otherData);if(!serverDiff.rebaseable()){return null}var mergedData=otherData;var m=Model(function(d){mergedData=d});m.reset(otherData);var dh=m.getDataHelper();for(var i=serverData.payments.length;i<localData.payments.length;i++){var p=localData.payments[i];var newP=dh.newPayment();newP.text=p.text;newP.values=p.values}dh.commit();return mergedData};return{accepted:accepted,rebaseable:rebaseable,isEmpty:isEmpty,payment:paymentStats,name:nameStats,applyTo:applyTo}};var DataHelper=function(data,onChange,onCommit){var eachPerson=function(callback){var makePerson=function(name,diff,nameIndex){var eachPayment=function(callback2){var makePayment=function(paymentIndex){var text=function(str){if(str===undefined){return data.payments[paymentIndex].text}data.payments[paymentIndex].text=str};var valuePair=function(pair){if(pair===undefined){return data.payments[paymentIndex].values[nameIndex]}data.payments[paymentIndex].values[nameIndex]=pair};return{text:text,valuePair:valuePair,index:paymentIndex}};for(var j=0;j<data.payments.length;j++){var v=data.payments[j].values[nameIndex];callback2(makePayment(j))}};var setName=function(newName){if(data.names[nameIndex]!==newName){data.names[nameIndex]=newName;onChange()}};var remove=function(){$.each(data.payments,function(j,p){var payModel=PayModel(data.names,p,true);var i=nameIndex;var pmp;payModel.eachPerson(function(it){if(i--==0){pmp=it}});pmp.toggleActive()});data.names.splice(nameIndex,1);$.each(data.payments,function(j,p){p.values.splice(nameIndex,1)});onChange()};callback({key:nameIndex,name:name,diff:diff,eachPayment:eachPayment,setName:setName,remove:remove})};for(var i=0;i<data.names.length;i++){var name=data.names[i];var diff=0;for(var j=0;j<data.payments.length;j++){diff+=data.payments[j].values[i][0];diff-=data.payments[j].values[i][1]}makePerson(name,diff,i)}};var name=function(index){return data.names[index]};var addPerson=function(name){data.names.push(name||"XXX");$.each(data.payments,function(i,p){p.values.push([0,0])});onChange()};var title=function(value){if(value===undefined){return data.title}data.title=value;onChange()};var eachPayment=function(callback){var cleanupPayments=function(){data.payments=data.payments.filter(function(p){return!p.remove})};var stillEnumerating=true;var makePayment=function(index){var payment=data.payments[index];var cost=function(){var c=0;for(var i=0;i<payment.values.length;i++){c+=payment.values[i][0]}return c};var text=function(str){if(str===undefined){return payment.text}payment.text=str;onChange()};var remove=function(){payment.remove=true;if(!stillEnumerating){cleanupPayments()}};callback({cost:cost,text:text,remove:remove,index:index})};for(var j=0;j<data.payments.length;j++){makePayment(j)}stillEnumerating=false;cleanupPayments()};var newPayment=function(){var p={text:"",values:[]};for(var i=0;i<data.names.length;i++){p.values.push([0,0])}data.payments.push(p);return p};var paymentByIndex=function(index){if(index<data.payments.length){return data.payments[index]}return null};var removePaymentByIndex=function(index){data.payments.splice(index,1);onChange()};var commit=function(){(onCommit||$.noop)()};return{eachPerson:eachPerson,eachPayment:eachPayment,name:name,payment:paymentByIndex,removePayment:removePaymentByIndex,addPerson:addPerson,title:title,names:function(){return data.names},newPayment:newPayment,commit:commit}};var Model=function(onChangedCallback){var undoStack;var undoStackCursor;var gen=0;var currentData=function(){return $.extend(true,{},undoStack[undoStackCursor])};var onChanged=function(newData){undoStack=undoStack.slice(0,undoStackCursor+1);undoStack.push(newData);undoStackCursor++;onChangedCallback(newData)};var undo=function(){undoStackCursor=Math.max(0,undoStackCursor-1);gen++;onChangedCallback(undoStack[undoStackCursor])};var redo=function(){undoStackCursor=Math.min(undoStack.length-1,undoStackCursor+1);gen++;onChangedCallback(undoStack[undoStackCursor])};var reset=function(data){undoStack=[data];undoStackCursor=0;gen++};var getDataHelper=function(onDataHelperChange){var current=currentData();var validAtGen=gen;var onCommit=function(){if(validAtGen!==gen){throw"Tried to commit from an old dataHelper"}onChanged(current)};return DataHelper(current,onDataHelperChange||$.noop,onCommit)};return{undo:undo,redo:redo,reset:reset,getDataHelper:getDataHelper}};var JobQueue=function(){var previous=(new $.Deferred).resolve();var add=function(fn){var wrap=function(){var d=new $.Deferred;fn(function(){d.resolve()},function(){d.reject();previous=(new $.Deferred).resolve()});return d};previous=previous.then(wrap,function(){})};return{add:add}};var NetworkStatus=function(){var listeners=[];var obj={isOnline:true,setOnline:function(isOnline){if(obj.isOnline!=isOnline){obj.isOnline=isOnline;$.each(listeners,function(i,l){l(isOnline)})}},onChanged:function(listener){listeners.push(listener)}};return obj};var Net=function(jobQueue,errorHandler,networkStatus){var pingTimer=null;var ajax=function(url,data,onSuccess,onError){$.ajax({type:"POST",url:"/"+url,data:JSON.stringify(data),contentType:"application/json",success:function(o){networkStatus.setOnline(true);onSuccess(o)},error:function(o){if(networkStatus.isOnline){errorHandler.info(L.OfflineMode);networkStatus.setOnline(false)}window.clearTimeout(pingTimer);pingTimer=window.setTimeout(function(){ajax("ping",{},function(){info(L.OnlineMode)},$.noop)},3e3);onError(o)}})};var create=function(onSuccess){ajax("create",{},function(response){onSuccess(response.url)},$.noop)};var read=function(idObj,onSuccess,onError){var success=function(response){if(response.err){info(response.err)}else{onSuccess(response)}};ajax("get",idObj,success,onError)};var update=function(doc,onSuccess,onConflict,onError){var resolve;var reject;var success=function(response){if(response.err){errorHandler.fatal(response.err);reject()}else if(response.ok){resolve();onSuccess()}else{var serverDoc={data:response.data,generation:response.generation,id:response.id};onConflict(serverDoc);reject()}};var error=function(err){resolve();onError(err)};jobQueue.add(function(resolveJob,rejectJob){resolve=resolveJob;reject=rejectJob;ajax("update",doc,success,error)})};var sendmail=function(message){ajax("sendmail",message,$.noop,$.noop)};return{create:create,update:update,read:read,sendmail:sendmail}};var RemoteDoc=function(id,net){var generation;var update=function(updateData,onSuccess,onConflict,onError){if(!generation){}var onConflictInternal=function(conflictDoc){var data=conflictDoc.data;generation=conflictDoc.generation;onConflict(data)};generation++;net.update({id:id,generation:generation,data:updateData},onSuccess,onConflictInternal,onError)};var read=function(onData,onError){net.read({id:id},function(doc){generation=doc.generation;onData(doc.data)},onError)};return{read:read,update:update,isFirstGeneration:function(){return generation==0}}};var LocalDoc=function(id,storage){var supported=function(){return storage!==undefined};var exists=function(key){return supported()&&storage[id+"_"+key]!==undefined};var update=function(key,data){if(supported()){if(data===undefined){delete storage[id+"_"+key]}else{storage[id+"_"+key]=JSON.stringify(data)}}};var read=function(key){if(!exists(key)){throw"local doc does not exist!"}return JSON.parse(storage[id+"_"+key])};return{update:update,read:read,exists:exists}};var DocProxy=function(localDoc,remoteDoc,networkStatus,errorHandler){var isFirstRead=true;var lastServerData;var onData;var onDataInternal=function(data){if(onData){onData(data)}};var update=$.noop;var read=function(){log("Read...");if(isFirstRead){isFirstRead=false;if(localDoc.exists("mine")!=localDoc.exists("theirs")){localDoc.update("mine");localDoc.update("theirs")}if(localDoc.exists("mine")){lastServerData=localDoc.read("theirs");onDataInternal(localDoc.read("mine"))}}if(networkStatus.isOnline){var onRemoteDocData=function(data){logData(data,"Read onData");if(lastServerData){var localDiff=DataDiff(lastServerData,localDoc.read("mine"));var anyLocalChanges=!localDiff.isEmpty();if(anyLocalChanges){if(DataDiff(lastServerData,data).rebaseable()){logData(lastServerData,"Merge base ");logData(data,"Merge their");logData(localDoc.read("mine"),"Merge mine ");data=localDiff.applyTo(data);update(data)}else{errorHandler.info("Internal Error: Could not merge local changes!")}}}if(JSON.stringify(data)!=JSON.stringify(lastServerData)){onDataInternal(data)}lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var onRemoteDocError=function(err){log("Read onError!");if(!lastServerData){errorHandler.fatal("Oooops!")}};remoteDoc.read(onRemoteDocData,onRemoteDocError)}if(!lastServerData&&!networkStatus.isOnline){errorHandler.fatal("Ooooops!")}};update=function(data){logData(data,"Update...");var onOffline=function(){log("Update offline!");if(DataDiff(lastServerData,data).accepted()){localDoc.update("mine",data)}else{errorHandler.info(L.OfflineMode);onDataInternal(localDoc.read("mine"))}};var onSuccess=function(){logData(data,"Update success");lastServerData=data;localDoc.update("mine",data);localDoc.update("theirs",data)};var updateConflictInternal=function(conflictData){logData(conflictData,"Update conflict!");var serverDiff=DataDiff(lastServerData,conflictData);var localDiff=DataDiff(lastServerData,data);if(serverDiff.rebaseable()&&localDiff.accepted()){var mergeData=localDiff.applyTo(conflictData);localDoc.update("mine",mergeData);localDoc.update("theirs",conflictData);lastServerData=conflictData;update(mergeData);onDataInternal(mergeData)}else{errorHandler.info(L.SomeoneMadeAChangeTryAgain);lastServerData=conflictData;localDoc.update("mine",conflictData);localDoc.update("theirs",conflictData);onDataInternal(conflictData)}};if(networkStatus.isOnline){remoteDoc.update(data,onSuccess,updateConflictInternal,onOffline)}else{onOffline()}};var setOnData=function(f){if(onData){errorHandler.fatal("Internal error: Must not set multiple onData handlers.")}onData=f};return{read:read,update:update,onData:setOnData,isFirstGeneration:function(){return remoteDoc.isFirstGeneration()}}};var nonbounceSetup=function(){"use strict";var startY;var defaults={$these:[],touchstartInit:false,touchmoveInit:false};$(".nonbounce").each(function(){defaults.$these.push($(this))});var initTouchHandling=function(){if(!defaults.touchstartInit){defaults.touchstartInit=true;$(window).off("touchstart").on("touchstart",touchstart)}if(!defaults.touchmoveInit){defaults.touchmoveInit=true;$(window).off("touchmove").on("touchmove",touchmove)}};var compareElem=function($elem,i,target){return!!$(target).closest($elem).length};var hasCorrectBounds=function(evt){var y=evt.originalEvent.touches?evt.originalEvent.touches[0].screenY:evt.originalEvent.screenY;var nonbounce=$(evt.target).closest(".nonbounce")[0];if(!nonbounce){return true}if(nonbounce.scrollTop===0&&startY<=y){return false}if(nonbounce.scrollHeight-nonbounce.offsetHeight===nonbounce.scrollTop&&startY>=y){return false}return true};var touchstart=function(evt){evt=evt.originalEvent||evt;startY=evt.touches?evt.touches[0].screenY:evt.screenY};var touchmove=function(evt){if(!(evt.originalEvent.touches&&evt.originalEvent.touches.length>1)){var mapped=$.map(defaults.$these,compareElem,evt.target);if(!~$.inArray(true,mapped)){evt.preventDefault()}if(!hasCorrectBounds(evt)){evt.preventDefault()}}};$.fn.nonbounce=function(){initTouchHandling();return this.each(function(){defaults.$these.push($(this))})};$.nonbounce=function(){initTouchHandling()};$.nonbounce()};var PaymentUI=function(paymentWizard,model){var $historyContainer=null;var create=function($parent){var $historyHeader=div().html(L.PreviousPayments).css({"font-style":"italic",color:"#666666",margin:"1em 0 0.5em 0"});$pastPayments=vertical();$historyContainer=vertical();$parent.append($historyContainer.append(horizontal().append($historyHeader),$pastPayments))};var update=function(){$pastPayments.empty();$historyContainer.hide();var dh=model.getDataHelper();var paymentList=[];dh.eachPayment(function(payment){paymentList.push(payment)});paymentList=paymentList.reverse();$.each(paymentList,function(i,payment){var $p=horizontal("volatile-container");var $clickable=$("<div/>").addClass("flex-horizontal-container flex-grow flex-justify-center clickable-payment");var $label=div("flex-grow").html(payment.text());var $cost=div().html(formatMoney(payment.cost()));$clickable.on("click",function(){paymentWizard.show(payment.index)});$pastPayments.append($p.append($clickable.append($label.addClass("flex-grow"),$cost,rightArrow())));$historyContainer.show()})};return{create:create,update:update}};var PayModel=function(names,payment,allActiveDefault){var persons=[];var onAllUpdateCallback=$.noop;var onAllUpdate=function(cb){onAllUpdateCallback=cb};var triggerAllUpdate=function(triggerPersonsUpdate){var anyActive=false;var anyLocked=false;var totalPay=0;for(var i=0;i<persons.length;i++){var it=persons[i].internal;anyActive|=it.isActive;anyLocked|=it.isLocked;totalPay+=it.pay;if(triggerPersonsUpdate){it.update()}}onAllUpdateCallback(anyActive,anyLocked,totalPay>0)};var eachPerson=function(callback){$.each(names,function(i,name){var updateCallback=$.noop;var p={isActive:allActiveDefault||payment.values[i][0]!==0||payment.values[i][1]!==0,pay:payment.values[i][0],expense:payment.values[i][1],isLocked:false,update:function(){payment.values[i][0]=p.pay;payment.values[i][1]=p.expense;updateCallback(p.isActive,p.pay,p.expense,p.isLocked)}};var onUpdate=function(updateCallback_){updateCallback=updateCallback_};var iteratePersons=function(itCallback){for(var j=0;j<persons.length;j++){itCallback(persons[j].internal,j==i)}};var updateAll=function(){iteratePersons(function(it){it.update()});triggerAllUpdate()};var otherUnlockedActiveFilter=function(cb){return function(it,isMe){if(!isMe&&it.isActive&&!it.isLocked){cb(it)}}};var otherActiveFilter=function(cb){return function(it,isMe){if(!isMe&&it.isActive){cb(it)}}};var unlockedActiveFilter=function(cb){return function(it,isMe){if(it.isActive&&!it.isLocked){cb(it)}}};var activeFilter=function(cb){return function(it,isMe){if(it.isActive){cb(it)}}};var distributeExpense=function(contrib,includeMe){var notDistributed=0;var numCandidates=0;var isCandidate=function(it){return contrib>0?it.expense>0:true};var filter=includeMe?unlockedActiveFilter:otherUnlockedActiveFilter;iteratePersons(filter(function(it){if(isCandidate(it)){numCandidates++}}));iteratePersons(filter(function(it){if(isCandidate(it)){it.expense-=contrib/numCandidates;if(it.expense<0){notDistributed-=it.expense;it.expense=0}}}));if(notDistributed>.01){distributeExpense(notDistributed)}};var computeGap=function(filter){var unlockedCount=0;var lockedGap=0;iteratePersons(filter(function(it){lockedGap+=it.pay;if(it.isLocked){lockedGap-=it.expense}else{unlockedCount+=1}}));return{amount:lockedGap,unlockedCount:unlockedCount}};var distributeExpenseOnUnlocked=function(totalAmount,numUnlocked,filter){iteratePersons(filter(function(it){it.expense=totalAmount/numUnlocked}))};var activate=function(){if(p.isActive){return}p.isActive=true;var gap=computeGap(activeFilter);distributeExpenseOnUnlocked(gap.amount,gap.unlockedCount,unlockedActiveFilter)};var toggleActive=function(){if(!p.isActive){activate();updateAll();return}var contrib=p.pay-p.expense;var gap=computeGap(otherActiveFilter);if(contrib>0){if(gap.unlockedCount>0&&contrib<=gap.amount+p.pay){distributeExpenseOnUnlocked(gap.amount,gap.unlockedCount,otherUnlockedActiveFilter)}else{p.update();return}}else if(contrib<0){if(gap.unlockedCount>0){distributeExpenseOnUnlocked(gap.amount,gap.unlockedCount,otherUnlockedActiveFilter)}else{p.update();return}}p.expense=0;p.pay=0;p.isActive=false;p.isLocked=false;updateAll()};var expense=function(value){if(value<0){p.update();return}activate();var numUnlockedOthers=0;var expenseUnlockedOthers=0;iteratePersons(otherUnlockedActiveFilter(function(it){expenseUnlockedOthers+=it.expense;numUnlockedOthers++}));if(numUnlockedOthers===0){p.update();return}value=Math.min(value,p.expense+expenseUnlockedOthers);p.isLocked=true;var contrib=value-p.expense;p.expense=value;distributeExpense(contrib);updateAll()};var pay=function(value){if(value<0){p.update();return}activate();var gap=computeGap(activeFilter);if(gap.unlockedCount==0){p.update();return}var contrib=p.pay-value;if(contrib>0){if(gap.amount<contrib){p.update();return}}p.pay=value;distributeExpenseOnUnlocked(gap.amount-contrib,gap.unlockedCount,unlockedActiveFilter);updateAll()};var lock=function(shouldLock){p.isLocked=shouldLock;if(!p.isLocked){var gap=computeGap(activeFilter);distributeExpenseOnUnlocked(gap.amount,gap.unlockedCount,unlockedActiveFilter)}updateAll()};var external={name:name,onUpdate:onUpdate,toggleActive:toggleActive,expense:expense,pay:pay,lock:lock};persons.push({external:external,internal:p});callback(external)});var iterateKLAS=function(itCallback){for(var j=0;j<persons.length;j++){var it=persons[j].internal;if(it.isActive){itCallback(it)}}};var initLocks=function(){var dict={};var uniqueExpenses=[];iterateKLAS(function(it){if(!dict.hasOwnProperty(it.expense)){dict[it.expense]=0;uniqueExpenses.push(it.expense)}dict[it.expense]++});var maxCount=0;var maxOccuredExpense=-1;for(var i=0;i<uniqueExpenses.length;i++){var expense=uniqueExpenses[i];if(dict[expense]>maxCount){maxOccuredExpense=expense;maxCount=dict[expense]}}iterateKLAS(function(it){if(it.expense!==maxOccuredExpense){it.isLocked=true}})};initLocks()};return{eachPerson:eachPerson,onUpdate:onAllUpdate,triggerUpdate:function(){triggerAllUpdate(true)}}};var PersonPayment=function(person){var $name=div("clickable-person").html(person.name);var moneyInput=function(onChanged){var beforeFocusValue;var $m=$("<input type='number' pattern='[0-9]+([.|,][0-9]+)?' step='none'/>").addClass("money-input").on("focus",function(){beforeFocusValue=$(this).val();$(this).val("")}).on("blur",function(){if($(this).val()==="")$(this).val(beforeFocusValue)}).on("change paste",function(){var parsed=toNonNegativeNumber($m.val());var isNull=parsed===null;if(!isNull){onChanged(parsed)}$payInput.css("background-color",isNull?"lightsalmon":"")});return $m};var $payInput=moneyInput(function(newValue){person.pay(newValue)}).css("color","green");var $expenseInput=moneyInput(function(newValue){person.expense(newValue)}).css("color","red");var $activator=div("input-match activator").on("click",person.toggleActive).append(div("small-text").html("Lägg till"));$name.on("click",person.toggleActive);var $locked=$("<div/>");var $lockedIndent=div("lock-indent");var $expenseInputContainer=horizontal().append($expenseInput,$activator);var $lockedContainer=horizontal().append($locked,$lockedIndent);var isLockedState;var isActiveState=true;$locked.on("click",function(){person.lock(!isLockedState)});person.onUpdate(function(isActive,payValue,expenseValue,isLocked){isLockedState=isLocked;isActiveState=isActive;if(isActive){$activator.hide(showHideSpeed);$expenseInput.show(showHideSpeed);$name.removeClass("inactive");$locked.show(showHideSpeed);$lockedIndent.hide(showHideSpeed)}else{$activator.show(showHideSpeed);$expenseInput.hide(showHideSpeed);$name.addClass("inactive");$locked.hide(showHideSpeed);$lockedIndent.show(showHideSpeed)}if(isLocked){$locked.removeClass("payment-unlocked transparent");$locked.addClass("payment-locked").load("locked.svg")}else{$locked.removeClass("payment-locked");$locked.addClass("payment-unlocked transparent").load("unlocked.svg")}$payInput.val(formatMoney(payValue).text());$payInput.css("background-color","");$expenseInput.val(formatMoney(expenseValue).text());$expenseInput.css("background-color","")});var $row=row([horizontalFill().append($name),$payInput,$expenseInputContainer,$lockedContainer]);return{element:function(){return $row}}};var PaymentWizard=function(model,errorHandler,$uiRoot){var show=function(paymentIndex){var isNewPayment=paymentIndex===undefined;var dh=model.getDataHelper();var payment=isNewPayment?dh.newPayment():dh.payment(paymentIndex);var values=payment.values;var payModel=PayModel(dh.names(),payment,false);var $selectActiveLabel=div();payModel.onUpdate(function(anyActive,anyLocked,anyPay){if(!anyPay){$(".col2").hide(showHideSpeed)}else{$(".col2").show(showHideSpeed)}if(anyLocked){$(".col3").show(showHideSpeed)}else{$(".col3").hide(showHideSpeed)}});var $wizElem;if(isNewPayment){payment.text="Beskriv betalningen här"}var editableTitle=editable(payment.text,function(newValue){payment.text=newValue});var $paymentTitle=editableTitle.element().on("click",function(){editableTitle.editMode()});var close=function(){$wizElem.removeClass("translate");$uiRoot.removeClass("translate");setTimeout(function(){$wizElem.remove()},500)};var save=function(){errorHandler.info('Sparar "'+payment.text+'"');dh.commit();close()};var $paymentClose=div("payment-close").load("x.svg").on("click",close);var $paymentSave=div("payment-save").load("save.svg").on("click",save);var $paymentNavigation=vertical().append(horizontal().append($paymentClose,$paymentSave));var $table=vertical();$table.append(row([$selectActiveLabel,div("input-match").text("Betalat"),horizontal().append(div("input-match").text("Skuld")),div("lock-indent")]));payModel.eachPerson(function(person){var pp=PersonPayment(person);$table.append(pp.element())});var $confirm=div("confirm-remove volatile").hide().html("Är du säker?").on("click",function(){dh.removePayment(paymentIndex);dh.commit();close()});var $remove=div("payment-remove").html("TA BORT").on("click",function(e){$confirm.show(showHideSpeed);e.stopPropagation()});var $contentContainer=div("ui-content-container flex-grow nonbounce");$wizElem=vertical("ui-root").append(horizontal("ui-header small-padding").append($paymentTitle),$contentContainer.append(vertical("ui-content").append(horizontalFill().append(div("flex-grow"),horizontalFill().append(div("flex-grow").append($table)),div("flex-grow")),!isNewPayment?horizontal().append($confirm,$remove):$())),horizontal("ui-footer small-padding").append($paymentNavigation));$(document.body).append($wizElem);$wizElem.css("left","100%");setTimeout(function(){$wizElem.addClass("translate");$uiRoot.addClass("translate")},0);payModel.triggerUpdate();nonbounceSetup()};return{show:show}};var StatsUI=function(paymentWizard,model){var $stats=null;var $transferPlan=null;var $transfers=null;var $addPerson=null;var $addPersonHelp=null;var editPayment=function(index){paymentWizard.show(index)};var update=function(){$stats.empty();$transfers.empty();$transferPlan.hide();var balances=[];var persons=[];var dh=model.getDataHelper();$addPerson.off().on("click",function(){dh.addPerson(L.Name);dh.commit()});dh.eachPerson(function(person){balances.push(person.diff);persons.push(person)});persons=persons.sort(function(p1,p2){return p1.diff-p2.diff});if(persons.length>0){$addPersonHelp.hide()}else{$addPersonHelp.show()}$.each(persons,function(i,person){var $details=div("person-history").hide();
var isRemoveable=true;person.eachPayment(function(payment){var diff=payment.valuePair()[0]-payment.valuePair()[1];if(diff===0){return}isRemoveable=false;var $detail=horizontal("clickable-payment").append(div().html(payment.text()),div("flex-grow"),div("flex-no-shrink").html(formatMoney(diff,true)),rightArrow()).on("click",function(e){e.stopPropagation();editPayment(payment.index)});$detail.css("background-color",diff>0?"#F0FFF0":diff<0?"#FFF0F0":"transparent");$detail.css("border-color",diff>0?"#B0FFB0":diff<0?"#FFB0B0":"lightgray");$details.append($detail)});var $removeButton=div("volatile people-remove").load("x.svg").hide();var $confirm=div("volatile confirm-remove").text(L.Remove).hide();var editableName=editable(person.name,function(newValue){person.setName(newValue);dh.commit()});var $name=editableName.element();$personSummary=vertical("person-summary volatile-container").append(horizontalFill("flex-align-center").append($confirm,$name,div("flex-grow").on("click",function(e){if($details.is(":visible")){$(".volatile").hide();e.stopPropagation()}}),div("flex-no-shrink").html(formatMoney(person.diff,true)),$removeButton),$details.addClass("volatile"));$removeButton.on("click",function(e){$removeButton.hide(showHideSpeed);$confirm.show(showHideSpeed);e.stopPropagation()});$name.on("click",function(e){editableName.editMode();$removeButton.hide(showHideSpeed);$confirm.hide(showHideSpeed);e.stopPropagation()});$confirm.on("click",function(){person.remove();dh.commit()});$personSummary.on("click",function(e){if($details.is(":visible")){$(".volatile").hide();e.stopPropagation();return}$("person-summary").not(this).find(".volatile").hide(showHideSpeed);if(isRemoveable){$removeButton.show(showHideSpeed)}else{$details.show(showHideSpeed)}});$stats.append($personSummary)});var plan=transferPlan(balances);$.each(plan,function(i,transfer){var $plan=horizontal("transfer-div").append(div().html(dh.name(transfer.from)),div("flex-no-shrink").append(horizontal().append(div().html(whiteSpace(1)+L.ShouldGive+whiteSpace(1)),div().append(formatMoney(transfer.amount).css("padding",0)),div().html(whiteSpace(1)+L.To+whiteSpace(1)))),div().html(dh.name(transfer.to)));$transfers.append($plan);$transferPlan.show()})};var create=function($parent){var $transferHeader=div("small-text").html(whiteSpace(1));$stats=vertical();$transferPlan=vertical();$transfers=vertical();$addPersonHelp=div().html("Lägg till personer här").css("cursor","pointer").hide();$addPerson=horizontal().append(div("person-add").load("plus.svg"),$addPersonHelp);$parent.append($stats,horizontal().append($addPerson),horizontal().append($transferPlan.append(div("small-text").html(whiteSpace(1)),horizontal().append($transferHeader),div("small-text").html(whiteSpace(1)),$transfers)))};return{create:create,update:update}};var MainContentUI=function(statsUI,paymentUI){var create=function($parent){var $stats=vertical();var $payments=vertical();statsUI.create($stats);paymentUI.create($payments);$parent.append($stats,div().html(whiteSpace(1)),$payments)};var update=function(){statsUI.update();paymentUI.update()};return{create:create,update:update}};var UI=function(headerUI,contentUI,footerUI){var create=function($parent){var $root=vertical("ui-root");var $header=div("ui-header small-padding");var $statusBar=div("ui-status-bar messagecontainer");var $contentVertical=vertical("ui-content");var $contentContainer=div("ui-content-container flex-grow nonbounce");var $footer=div("ui-footer small-padding");headerUI.create($header);contentUI.create($contentVertical);footerUI.create($footer);$parent.append($root.append($header,$statusBar,$contentContainer.append($contentVertical),$footer))};var update=function(){headerUI.update();footerUI.update();contentUI.update()};return{create:create,update:update}};var editable=function(text,onChange){onChange=onChange||$.noop;var $e=div().html(text);var $input=$("<input/>").hide();var $cont=horizontalFill().append($e,$input);var beforeFocusVal;var editMode=function(){beforeFocusVal=$e.html();$input.val("");$input.css("width",$e.width()+5);$e.hide();$input.show().focus().on("blur",function(){if($input.val()===""){$input.val(beforeFocusVal)}$input.trigger("change")})};var set=function(value){$e.html(value)};$input.on("input paste",function(){var v=$input.val();$e.html(v);$input.css("width",$e.width()+5)});$input.on("submit change",function(){var v=$input.val();$e.html(v);$e.show();$input.hide();onChange(v)});return{editMode:editMode,element:function(){return $cont},set:set}};var row=function(colElems){var $r=horizontalFill("flex-align-center row");for(var i=0;i<colElems.length;i++){var $cell=div("col"+i);if(i==0){$cell.addClass("flex-grow")}$r.append($cell.append(colElems[i]))}return $r};var whiteSpace=function(count){var str="";while(count--){str+="&nbsp;"}return str};var horizontal=function(classNames){return $("<div/>").addClass("flex-horizontal-container flex-justify-center "+(classNames||""))};var horizontalFill=function(classNames){return $("<div/>").addClass("flex-horizontal-container "+(classNames||""))};var vertical=function(classNames){return $("<div/>").addClass("flex-vertical-container "+(classNames||""))};var div=function(classNames){return $("<div/>").addClass(classNames)};var rightArrow=function(){return div("flex-no-shrink small-text small-right-arrow").load("smallrightarrow.svg")};var formatMoney=function(value,keepDecimals){var color=value>0?"green":value<0?"red":"";var fixed=value.toFixed(2);var split=(""+fixed).split(".");var isNaturalNumber=split[1]==="00";var ret="";if(isNaturalNumber&&!keepDecimals){ret=parseInt(split[0])}else{ret=fixed}return div().css({color:color}).text(ret)};var isCtrlZ=function(e){e=window.event||e;return e.keyCode==90&&e.ctrlKey};var isCtrlY=function(e){e=window.event||e;return e.keyCode==89&&e.ctrlKey};var showMessage=function(message,delay){$(".messagecontainer").empty();var $message=$("<div/>").addClass("message yellow info").text(message).hide();$(".messagecontainer").append(horizontal().append($message));var timer=null;var obj={hide:function(){$message.slideUp();obj.hide=$.noop;clearTimeout(timer)}};$message.slideDown("fast");timer=setTimeout(function(){$message.slideUp()},delay||3e3);return obj};var bailout=function(message){showMessage(message||L.UnknownErrorReloadPage);setTimeout(function(){window.location.href=window.location.href},3e3)};var info=function(message,delay){return showMessage(message,delay)};var showHideSpeed=undefined;var setOnlineCss=function(isOnline){if(isOnline){$(".ui-root").removeClass("offline")}else{$(".ui-root").addClass("offline")}};var log=function(message){if(false){console.log(message)}};var logData=function(data,message){if(message){log(message)}var str="";for(var i=0;i<data.payments.length;i++){str+=data.payments[i].text+", "}log(" - "+str)};
//# sourceMappingURL=source.js.map