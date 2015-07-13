$(document).ready(function() 
{
	$.ajax({
		type: "POST",
		url: "/create",
		data: JSON.stringify({}),
		contentType: "application/json",
		success: function(d) 
		{ 
			window.location.href = "/" + d.url; 
		}
	});

});