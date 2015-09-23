var HelpUI = function(model, net, networkStatus, $uiRoot)
{
	var create = function($parent)
	{
		// $showHideSpeed.addClass("help-container yellow");
		
		// var text = function(content)
		// {
			// return $("<div/>").addClass("help-text").append($("<span/>").html(content));
		// };
		
		// var header = function(content)
		// {
			// return $("<div/>").addClass("help-header").append($("<span/>").html(content));
		// };
		
		// $showHideSpeed.append(
			// header("&nbsp;"),
			// header(L.HelpHeader1),
			// text(L.HelpText1),
			// header(L.HelpHeader2),
			// text(L.HelpText2),
			// header(L.HelpHeader3),
			// text(L.HelpText3),
			// header(L.HelpHeader4),
			// text(L.HelpText4),
			// header(L.HelpHeader5),
			// text(L.HelpText5),
			// text("&nbsp;"));
			
		var $urlContainer = div("big-margin").append(
			horizontal().html(L.CopyUrlInfo).addClass("small-text unselectable"),
			horizontal().append($("<a/>").attr("href", window.location.href).html(window.location.href).addClass("small-text big-margin")),
			div("big-margin unselectable").html(whiteSpace(1))
		);
			
		var $container = vertical();
		
		var emailSent = false;
		var updateSubmitButton;
		
		var $textArea = $("<textarea/>").addClass("big-margin small-text")
			.val(L.CommentSample)
			.css("width", "15em")
			.attr("rows", 6)
			.on("focus", function() { if ($textArea.val() == L.CommentSample) $textArea.val("");})
			.on("input paste", function() { updateSubmitButton(); });
		
		var $inputEmail = $("<input/>").addClass("big-margin small-text")
			.css("width", "15em")
			.css("background-color", "transparent")
			.css("padding", "6px")
			.css("border", "1px solid rgb(79,93,115)")
			.attr("placeholder", L.ExampleEmail)
			.on("input paste", function() { updateSubmitButton(); });
			
		var $submit = $("<button/>").addClass("mail-button big-margin").load("mail.svg").on("click", function() 
		{
			net.sendmail({"message": $textArea.val(), "from": $inputEmail.val()});
			emailSent = true;
			updateSubmitButton();
			$textArea.val(L.ThankYou);
			
			setTimeout(function() 
			{ 				
				emailSent = false;
				updateSubmitButton();
			}, 2000);
		});
		
		updateSubmitButton = function()
		{
			var enabled =(networkStatus.isOnline && $textArea.val() != "" && !emailSent && $inputEmail.val().search(/^[a-zA-Z0-9\.]+@[a-zA-Z0-9]+\.[a-zA-Z]+$/) > -1)
			$submit.attr("disabled", !enabled);
			if (enabled)
			{
				$submit.removeClass("transparent");
			}
			else
			{
				$submit.addClass("transparent");
			}
		};
		
		networkStatus.onChanged(function() { updateSubmitButton(); });
		
		$container.append(
			$urlContainer, 
			horizontal().append($textArea), 
			horizontal().append($inputEmail), 
			horizontal().append($submit)
		);
	
		updateSubmitButton();

		var $helpButton = div("help-button").load("help.svg");
		var $closeButton = div("payment-back").load("back.svg");
					
		$parent.append(
			horizontal().append(
				$helpButton
			)
		);
		
		var $helpContainer = vertical("ui-root").append(
			div("ui-content-container flex-grow nonbounce").append(
				vertical("ui-content small-padding").append(
					$container.addClass("flex-grow")			
				)
			),
			horizontal("ui-footer small-padding").append($closeButton)	
		);	
		
		// for transitions
		$helpContainer.css("left", "100%").hide();
		$(document.body).append($helpContainer);
		
		$helpButton.on("click", function(e) 
		{ 
			$helpContainer.show();
			setTimeout(function() { $helpContainer.addClass("translate"); $uiRoot.addClass("translate"); }, 0);
		});
		$closeButton.on("click", function() 
		{
			$helpContainer.removeClass("translate"); 
			$uiRoot.removeClass("translate");			
			setTimeout(function() { $helpContainer.hide(); }, 500);
		});
		
		nonbounceSetup();
	};
	
	return {
		"create": create
	};
};