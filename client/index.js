$(document).ready(function() 
{ 
	var net = Net({}, {}, NetworkStatus());
	
	net.create(function(url) 
	{ 
		window.location.href = url;
	});
});