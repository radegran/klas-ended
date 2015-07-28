$(document).ready(function() 
{ 
	var net = Net({}, {});
	
	net.create(function(url) 
	{ 
		window.location.href = url;
	});
});