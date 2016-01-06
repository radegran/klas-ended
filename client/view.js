var editable = function(text, onChange)
{
	onChange = onChange || $.noop;
	
	var $e = div().html(text);
	var $input = $("<input/>").hide();
	var $cont = horizontalFill().append($e, $input);
	
	var beforeFocusVal;
	
	var editMode = function()
	{
		beforeFocusVal = $e.html();
		$input.val("");
		$input.css("width", $e.width() + 5);
		$e.hide(); 
		$input.show().focus().on("blur", function()
		{
			if ($input.val() === "")
			{
				$input.val(beforeFocusVal);
			}
		
			$input.trigger("change");				
		});
	};
	
	var set = function(value)
	{
		$e.html(value);
	};
	
	$input.on("input paste", function()
	{
		var v = $input.val();
		$e.html(v);
		$input.css("width", $e.width() + 5);
	});

	$input.on("submit change", function()
	{
		var v = $input.val();
		$e.html(v);
		$e.show(); $input.hide();
		onChange(v);
	});
	
	return {
		"editMode": editMode,
		"element": function() { return $cont; },
		"set": set
	}
};

var row  = function(colElems)
{
	var $r = horizontalFill("flex-align-center row");
	for (var i = 0; i < colElems.length; i++)
	{
		var $cell = div("col" + i);
		
		if (i==0)
		{
			$cell.addClass("flex-grow");
		}
	
		$r.append($cell.append(colElems[i]));		
	}
	return $r;
};

var whiteSpace = function(count)
{
	var str = "";
	while(count--)
	{
		str += "&nbsp;";
	}
	return str;
};
	
var horizontal = function(classNames)
{
	return $("<div/>").addClass("flex-horizontal-container flex-justify-center " + (classNames || ""));
};
	
var horizontalFill = function(classNames)
{
	return $("<div/>").addClass("flex-horizontal-container " + (classNames || ""));
};

var vertical = function(classNames)
{
	return $("<div/>").addClass("flex-vertical-container " + (classNames || ""));
};

var div = function(classNames)
{
	return $("<div/>").addClass(classNames);
};

var rightArrow = function()
{
	return div("flex-no-shrink small-text small-right-arrow").load("smallrightarrow.svg");
};
var formatMoney = function(value, keepDecimals)
{
	var color = (value > 0) ? "green" : (value < 0 ? "red" : "");
	var fixed = value.toFixed(2);
	var split = ("" + fixed).split(".");
	var isNaturalNumber = (split[1] === "00");
	var ret = "";
	
	if (isNaturalNumber && !keepDecimals)
	{
		ret = parseInt(split[0]);
	}
	else 
	{
		ret = fixed;
	}
	
	return div().css({"color": color}).text(ret);
};

var formatTime = function(t)
{
	if (!t)
	{
		return "";
	}
	
	var months = ["Jan", "Feb", "Mar", "April", "Maj", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
	var time = new Date(t);
	var hours = time.getHours();
	var minutes = time.getMinutes();
	console.log(hours < 10)
	
	var str = time.getDate() + " " + months[time.getMonth()];
	str += " " + ((hours < 10) ? ("-" + hours) : hours);
	str += ":" + ((minutes < 10) ? ("?" + minutes) : minutes);
	
	var nowtime = new Date();
	if (time.getFullYear() != nowtime.getFullYear())
	{
		str += " " + time.getFullYear();
	}
	
	return str;

};

var formatTimeSince = function(t)
{
	if (t === undefined)
	{
		// For old version payments without created time
		return "";
	}
	
	var sec = 1000;
	var min = 60*sec;
	var hour = 60*min;
	
	var now = Date.now();
	var dt = now - t;
	if (dt < 2*min) return "Nyligen";
	if (dt < hour) return Math.round(dt / min) + " minuter sen";
	if (dt >= hour && dt < 2*hour) return "En timme sen";
	if (dt < 24*hour) return Math.round(dt / hour) + " timmar sen";

	return formatTime(t);
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
		.addClass("message yellow info translate-y")
		.text(message);
		
	$(".messagecontainer").append(horizontal().append($message));
	
	var timer = null;
	
	var obj = {"hide": function() 
	{
		$message.addClass("translate-y");
		obj.hide = $.noop;
		clearTimeout(timer);
	}};

	setTimeout(function() {$message.removeClass("translate-y");}, 0);
	timer = setTimeout(function() { $message.addClass("translate-y"); }, delay || 3000);
	
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

var showHideSpeed = undefined;

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
