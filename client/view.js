var Help = function($helpContainer, net, networkStatus, highlightHelpButtonFunc)
{
	$helpContainer.addClass("help-container yellow");
	
	var text = function(content)
	{
		return $("<div/>").addClass("help-text").append($("<span/>").html(content));
	};
	
	var header = function(content)
	{
		return $("<div/>").addClass("help-header").append($("<span/>").html(content));
	};
	
	$helpContainer.append(
		header("&nbsp;"),
		header(L.HelpHeader1),
		text(L.HelpText1),
		header(L.HelpHeader2),
		text(L.HelpText2),
		header(L.HelpHeader3),
		text(L.HelpText3),
		header(L.HelpHeader4),
		text(L.HelpText4),
		header(L.HelpHeader5),
		text(L.HelpText5),
		text("&nbsp;"));
	
	var $comment = $("<span/>");
	var emailSent = false;
	var updateSubmitButton;
	
	var $textArea = $("<textarea/>")
		.addClass("help-submit")
		.attr("cols", 40)
		.attr("rows", 8)
		.on("input paste", function() { updateSubmitButton(); });
	var $inputEmail = $("<input/>")
		.addClass("help-submit")
		.attr("placeholder", L.ExampleEmail)
		.on("input paste", function() { updateSubmitButton(); });
	var $submit = $("<button/>").html(L.SubmitFeedback).addClass("help-submit").on("click", function() {
		net.sendmail({"message": $textArea.val(), "from": $inputEmail.val()});
		emailSent = true;
		updateSubmitButton();
		$submit.html(L.ThankYou);
		
		setTimeout(function() 
		{ 				
			$textArea.val("");
			emailSent = false;
			$submit.html(L.SubmitFeedback);
			updateSubmitButton();
		}, 2000);
	});
	
	updateSubmitButton = function()
	{
		var enabled =(networkStatus.isOnline && $textArea.val() != "" && !emailSent && $inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/) > -1)
		$submit.attr("disabled", !enabled);
	};
	
	networkStatus.onChanged(function() { updateSubmitButton(); });
	$helpContainer.append($comment.append($textArea, $("<br/>"), $inputEmail, $("<br/>"), $submit));
	updateSubmitButton();
	
	var visible = false;

	var toggle = function()
	{
		if (visible)
		{
			$helpContainer.slideUp();			
		}
		else
		{
			$helpContainer.slideDown();
		}
		
		visible = !visible;
	};
	
	var getShowHelpButton = function()
	{	
		var $highlighter = $("<span/>").html("&nbsp;&nbsp;&nbsp;&#x2190;&nbsp;" + L.Help).hide();
	
		var $helpButton = $("<span/>").append(
			$("<span/>").html("&nbsp;&#x2261;&nbsp;"),
			$highlighter
		).css("cursor", "pointer").on("click", function() {
			highlightHelpButtonFunc = function() { return false; },
			toggle();
		});
		
		var toggleHighlight = function()
		{
			if (highlightHelpButtonFunc())
			{
				$highlighter.fadeToggle('fast');
			}
			else
			{
				$highlighter.hide();
			}

			setTimeout(toggleHighlight, 750);
		}
		
		toggleHighlight();
		
		return $helpButton;
	};
	
	return {
		"getShowHelpButton": getShowHelpButton
	};
};

var isCtrlZ = function(e)
{
	e = window.event || e;
    return (e.keyCode == 90 && e.ctrlKey);
};

var isCtrlY = function(e)
{
	e = window.event || e;
    return (e.keyCode == 89 && e.ctrlKey);
};

var showMessage = function(message, delay)
{
	$(".messagecontainer").empty();
	
	var $message = $("<div/>")
		.addClass("message yellow info")
		.text(message).hide();
		
	$(".messagecontainer").append($message);
	
	var timer = null;
	
	var obj = {"hide": function() 
	{
		$message.slideUp();
		obj.hide = $.noop;
		clearTimeout(timer);
	}};

	$message.slideDown('fast');
	timer = setTimeout(function() { $message.slideUp() }, delay || 3000);
	
	return obj;
};

var bailout = function(message)
{
	showMessage(message || L.UnknownErrorReloadPage)
	setTimeout(function() { window.location.href = window.location.href;}, 3000)
};

var info = function(message, delay)
{
	return showMessage(message, delay);
};

var setOnlineCss = function(isOnline) 
{
	if (isOnline)
	{
		$(".ui-root").removeClass("offline");
	}
	else
	{
		$(".ui-root").addClass("offline");
	}
};

var log = function(message)
{
	if (false)
	{
		console.log(message);
	}
};

var logData = function(data, message)
{
	if (message)
	{
		log(message);
	}
	
	var str = "";
	for (var i = 0; i < data.payments.length; i++)
	{
		str += data.payments[i].text + ", ";
	}
	log(" - " + str);
};
