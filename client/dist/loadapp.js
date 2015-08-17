$(document).ready(function()
{
	var $page = $("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
		$("<div/>").addClass("flex-vertical-container").append(
			$("<div/>").html(L.Welcome1),
			$("<div/>").html(L.Welcome2),
			$("<div/>").html("&nbsp;"),
			$("<div/>").html("&nbsp;"),
			$("<div/>").html("&nbsp;"),
			$("<div/>").addClass("flex-horizontal-container flex-justify-center").append(
				$("<div/>").addClass("nav-payments").on("click", loadApp)
			)
		)
	);
	
	$(document.body).append($page);
	$(document.body).css("margin", "2em");
});