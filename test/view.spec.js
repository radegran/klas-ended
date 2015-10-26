describe("Format time since", function()
{
	it("various tests", function()
	{
		expect(formatTimeSince(Date.now() - 1000*60*1)).toBe("Nyligen");
		expect(formatTimeSince(Date.now() - 1000*60*3.5)).toBe("4 minuter sen");
		expect(formatTimeSince(Date.now() - 1000*60*59)).toBe("59 minuter sen");
		expect(formatTimeSince(Date.now() - 1000*60*60 - 1)).toBe("En timme sen");
		expect(formatTimeSince(Date.now() - 1000*60*60*2.5)).toBe("3 timmar sen");
		expect(formatTimeSince(Date.now() - 1000*60*60*23)).toBe("23 timmar sen");
		expect(formatTimeSince(Date.now() - 1000*60*60*24 -1)).not.toBe("24 timmar sen"); // Date mode
	})
});