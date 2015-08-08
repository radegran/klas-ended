var gogogo = function(toCollection, modifyLive) 
{
	db[toCollection].drop();
	db.createCollection(toCollection);
	
	// Clone collection
	db.docs.find().forEach( function(x){db[toCollection].insert(x)} );
	
	var currentCollection = modifyLive ? "docs" : toCollection;
	var cursor = db[currentCollection].find();

	var migrate = function(doc)
	{
		var ps = doc.data.payments;
		var newPs = [];
		
		// for each payment
		for (var i = 0; i < ps.length; i++)
		{
			var vs = ps[i].values;
			var newVs = [];
			var sum = 0;
			var count = 0;
			
			// values sum/count
			for (var j = 0; j < vs.length; j++)
			{
				if (vs[j] != null)
				{
					sum += vs[j];
					count++;
				}
			}
			
			var average = sum/count;
			
			for (var j = 0; j < vs.length; j++)
			{
				var v = vs[j];
				var plus = 0;
				var minus = 0;

				if (v != null)
				{
					if (v >= 0)
					{
						plus = v;
						minus = -average;
					}
					else
					{
						if (average > 0.001 || average < -0.001)
						{
							print("Fail!!!");
							return false;
						}
						
						plus = 0;
						minus = -average;
					}
				}
				
				newVs.push([plus, minus]);
			}
			
			ps[i].values = newVs;
			//printjson(newVs);
		}
		
		//printjson(doc.data.payments);
		//print("-------------");
		
		return doc;
	};

	while (cursor.hasNext())
	{
		 var doc = migrate(cursor.next());
		 if (!doc)
		 {
			 print("No doc!");
			 return;
		 }
		 
		 db[currentCollection].save(doc);
	}	
};
