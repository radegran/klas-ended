var HelpUI = function(model, net, networkStatus)
{
	var create = function($parent)
	{
		// $helpContainer.addClass("help-container yellow");
		
		// var text = function(content)
		// {
			// return $("<div/>").addClass("help-text").append($("<span/>").html(content));
		// };
		
		// var header = function(content)
		// {
			// return $("<div/>").addClass("help-header").append($("<span/>").html(content));
		// };
		
		// $helpContainer.append(
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
			horizontal().html(L.CopyUrlInfo).addClass("small-text big-margin"),
			horizontal().html(window.location.href).addClass("small-text"),
			div("big-margin").html(whiteSpace(1))
		);
			
		var $container = vertical("flex-justify-center volatile").hide();
		
		var $helpButton = div("help-button").on("click", function(e) { e.stopPropagation(); $container.show(showHideSpeed); });
		
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
			.css("padding", "0.2em")
			.css("border", "1px solid rgb(79,93,115)")
			.attr("placeholder", L.ExampleEmail)
			.on("input paste", function() { updateSubmitButton(); });
		var $submit = $("<button/>").addClass("mail-button big-margin").on("click", function() {
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
			$textArea, 
			$inputEmail, 
			$submit);
		$parent.append(
			horizontal().append($helpButton), 
			horizontal("volatile-container").append($container.addClass("help-container")));
		
		updateSubmitButton();
	};
	
	return {
		"create": create
	};
};