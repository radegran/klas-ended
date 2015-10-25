$(document).ready(function()
{
	var $page = vertical().css("height", "100%").append(
		horizontal("ui-header").css("font-size", "1.2em").append(
			vertical().css("padding", "1.5em").append(
				div().css("white-space", "normal").html(L.Welcome1),
				div().css("white-space", "normal").html(L.Welcome2)		
			)
		),
		horizontal("flex-grow").css("padding", "2em").append(
			div("nav-payments").load("creditcard.svg").on("click", loadApp)
		)
	);
	
	$(document.body).append($page);
});