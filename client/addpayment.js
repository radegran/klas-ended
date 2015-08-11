var toNonNegativeNumber = function(str)
{
	str = str.trim().replace(",", ".");
	var parsed = parseFloat(str);
	
	if (str.search(/[^0-9\.]/) > -1 || isNaN(parsed))
	{
		return null;
	}
	
	return parsed;
};

var Wizard = function($container)
{
    var self;
    var stepStack = [];
    
    var setup = function()
    {
        $container.empty();
        $container.append(
            $("<div/>").addClass("wiz-question"),
            $("<div/>").addClass("wiz-selectables"),
            $("<div/>").addClass("wiz-inputs"),
            $("<div/>").addClass("wiz-buttons")
        );
    };
    
    var showTip = function()
    {
        setup();
        var step = stepStack[stepStack.length - 1];
        step.show(self);
    };
    
    var next = function(step)
    {
        stepStack.push(step);
        showTip();
    };
    
    ////////////
    var append = function(className, $elem)
    {
        $container.find(className).append($elem);
    };
    
    var question = function(text)
    {
        append(".wiz-question", $("<span/>").text(text));
    };
    
    var button = function(innerHtml, onclick)
    {
        var $button =  $("<button/>").html(innerHtml)
            .on("click", onclick);
        append(".wiz-buttons", $button);
        return $button;
    };
    
    var selectable = function(text, onselected)
    {
        var $s = $("<button/>")
            .html(text)
            .on("click", function() 
            { 
                $s.toggleClass("wiz-selected"); 
                onselected($s.hasClass("wiz-selected"));
            });
        
        append(".wiz-selectables", $s);
    };
    
    var input = function(description, defaultValue, onchange)
    {
		var $input = $("<input/>")
			.val(defaultValue)
			.on("input paste", function() 
			{ 
				var value = $input.val();
				var parsed = toNonNegativeNumber(value);
				
				if (parsed !== null)
				{
					$input.removeClass("wiz-invalid-input");
				}
				else
				{
					$input.addClass("wiz-invalid-input");
				}	
			
				onchange(parsed); 
			});
		
        append(".wiz-inputs", $("<div/>").append(
            $("<span/>").text(description),
            $input));
			
		return $input;
    };

    self = {
        "next": next,
        "question": question,
        "button": button,
        "selectable": selectable,
        "input": input
    };

    return self;
};

var WTransactionAmount = function(transactionState)
{
    var show = function(wizard)
    {
        wizard.question("Hur mycket?");
        
        var onChange = function(value) 
        {
            transactionState.amount = value;
        };
        
        wizard.input('', '', onChange);                
    };
    
    return  {"show": show};
};

var WTransactionTo = function(wTransactionAmount, transactionState)
{
    var names = transactionState.names;
    
    var show = function(wizard)
    {
        wizard.question("Till vem?");
        
        var makeButton = function(name, index)
        {
            if (transactionState.fromIndex != i)
            {
                var onTo = function() 
                {
                    transactionState.toIndex = index;
                    wizard.next(wTransactionAmount);
                };
                wizard.button(name, onTo);                
            }
        };
        
        for (var i = 0; i < names.length; i++)
        {
            makeButton(names[i], i);
        }
    };
    
    return  {"show": show};
};

var WTransactionFrom = function(wTransactionTo, transactionState)
{   
    var names = transactionState.names;
    
    var show = function(wizard)
    {
        wizard.question("Från vem?");
        
        var makeButton = function(name, index)
        {
            var onFrom = function() 
            {
                transactionState.fromIndex = index;
                wizard.next(wTransactionTo);
            };

            wizard.button(name, onFrom);
        };
        
        for (var i = 0; i < names.length; i++)
        {
            makeButton(names[i], i);
        }
    };
    
    return  {
        "show": show
    };
};

var WWhat = function(wPayment, wTransaction)
{    
    var show = function(wizard)
    {
        var onChoosePayment = function() { wizard.next(wPayment); };
        var onChooseTransaction = function() { wizard.next(wTransaction); };
        
        wizard.question("Vad är det för nåt?");
        wizard.button("Betalning", onChoosePayment);
        wizard.button("Överföring", onChooseTransaction);
    };
    
    return {"show": show};
};

var WInvolved = function(wWhoPay, paymentState)
{
    var show = function(wizard)
    {
        wizard.question("Vilka gäller det?");
        
        paymentState.each({}, function(p) 
        {
            wizard.selectable(p.val("name"), function(isSelected)
            {
                p.val("involved", isSelected);
            });
        });
        
        wizard.button("(>)", function() { wizard.next(wWhoPay); });
    };
    
    return {"show": show};
};

var WWhoPay = function(wAllSpentSame, paymentState)
{
    var names = paymentState.names;
    
    var show = function(wizard)
    {
        wizard.question("Vem/Vilka betalar?");
        var $nextButton = wizard.button("(>)", function() { wizard.next(wAllSpentSame); });
        
        var updateNextButton = function()
        {
            $nextButton.attr("disabled", false);
            var p = paymentState.paying;
			var allZeroes = true;
			
            for (var i = 0; i < p.length; i++)
            {
                if (p[i] === null)
                {
                    $nextButton.attr("disabled", true);
					return;
                }
				else if (p[i] !== 0)
				{
					allZeroes = false;
				}
            }
			
			$nextButton.attr("disabled", allZeroes);
        };
        
        updateNextButton();
        
        $.each(names, function(i, name) 
        {
            if (!paymentState.involved[i])
            {
                return;
            }
            
            var $input = wizard.input(name, paymentState.paying[i], function(value)
            {
				paymentState.paying[i] = value;
				updateNextButton();						
            });
        });        
    };
    
    return {"show": show};
};

var WConfirm = function(paymentState)
{
    var show = function(wizard) 
    {
        wizard.question("Ser det bra ut?");
        wizard.button("Ja", function() { wizard.next(wConfirm); });
    };
    
    return {"show": show};
};

var WWhoSpent = function(wDone, paymentState)
{
    var names = paymentState.names;
    
    var show = function(wizard) 
    {
        // init
        var totalSpent = 0;
        var totalInvolved = 0;
        
        $.each(paymentState.paying, function(i, amount)
        {
            totalSpent += amount;
            if (paymentState.involved[i])
            {
                totalInvolved++;
            }
        });
        
        wizard.question("Hur mycket har var och en spenderat?");
        wizard.button("(Done)", function() { wizard.next(wDone); });
        
        $.each(paymentState.names, function(i, name) 
        {
            if (!paymentState.involved[i]) 
            {
                return; // continue
            }

            paymentState.spending[i] = totalSpent/totalInvolved;
            
            wizard.input(name, paymentState.spending[i], function(value)
            {
                
            });
        });
    };
    
    return {"show": show};
};

// Use it                       
var names = ["Klas", "Opel", "Apa"];

var makeArray = function(value, count)
{
    var list = [];
    for (var i=0; i<count; i++)
    {
        list.push(value);
    }
    return list;
};

var transactionState = {
    "names": names
};
var PaymentState = function(names)
{
	var list = [];
	
	for (var i = 0; i < names.length; i++)
	{
		list.push({"name": names[i], "index": i});
	}
	
	var val = function(elem, key, value)
	{
		if (value === undefined)
		{
			return elem[key];
		}
		else
		{
			elem[key] = value;
		}
	}
	
	var each = function(filter, callback)
	{
		var i, elem;
		
		var validateFilter = function(elem)
		{
			for (var key in filter)
			{
				if (filter.hasOwnProperty(key) && filter[key] !== elem[key])
				{
					return false;
				}
			}	
			return true;
		};
		
		for (i = 0; i < list.length; i++)
		{
			elem = list[i];
			
			if (!validateFilter(elem))
			{
				continue;
			}
			
			callback({
				"val": function(key, value) { return val(elem, key, value); }
			});
		}
	};
	
	return {
		"each": each
	};
};

var paymentState = PaymentState(names);

$(document).ready(function() 
{
	var w = Wizard($("#container"));
	w.next(
		WWhat(
			WInvolved(
				WWhoPay(
					WWhoSpent(
						WConfirm(),
						paymentState),
					paymentState),
				paymentState),
			WTransactionFrom(
				WTransactionTo(
					WTransactionAmount(
						transactionState),
					transactionState),
				transactionState)));	
});
