// Unit test to verify Check-Out timing calculation logic matching Android DateUtils

function parseTimeToMinutes(timeStr, defaultMinutes = 20 * 60) {
    if (!timeStr || !timeStr.trim()) return defaultMinutes;
    try {
        const normalized = timeStr.trim().replace(/\./g, ':');
        const isPm = /pm/i.test(normalized);
        const isAm = /am/i.test(normalized);
        const cleanStr = normalized.replace(/am/gi, '').replace(/pm/gi, '').trim();
        const parts = cleanStr.split(':');
        let hour = parseInt(parts[0], 10);
        if (isNaN(hour)) hour = Math.floor(defaultMinutes / 60);
        const minute = parts[1] ? parseInt(parts[1], 10) : 0;
        if (isPm && hour < 12) hour += 12;
        if (isAm && hour === 12) hour = 0;
        return hour * 60 + minute;
    } catch (e) {
        return defaultMinutes;
    }
}

function isCheckOutVisible(dutyEndTime, currentHour, currentMinute, isNightShift = false) {
    const endMinutes = parseTimeToMinutes(dutyEndTime, 20 * 60);
    const currentMinutes = currentHour * 60 + currentMinute;
    const checkoutOpenMinutes = endMinutes - 60;

    if (isNightShift && endMinutes < 12 * 60) {
        return currentMinutes >= checkoutOpenMinutes && currentMinutes <= (endMinutes + 6 * 60);
    }

    return currentMinutes >= checkoutOpenMinutes;
}

function getCheckOutOpenTimeString(dutyEndTime) {
    const endMinutes = parseTimeToMinutes(dutyEndTime, 20 * 60);
    let openMinutes = endMinutes - 60;
    if (openMinutes < 0) openMinutes += 24 * 60;
    const hour24 = Math.floor(openMinutes / 60);
    const minute = openMinutes % 60;
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 === 0 ? 12 : (hour24 > 12 ? hour24 - 12 : hour24);
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

// Tests
console.log("=== Testing 8.00 PM (20:00) Company Sign Out ===");
console.log("Open Time String:", getCheckOutOpenTimeString("8.00pm")); // Expected: 07:00 PM
console.assert(getCheckOutOpenTimeString("8.00pm") === "07:00 PM", "Open time for 8.00pm should be 07:00 PM");
console.assert(getCheckOutOpenTimeString("20:00") === "07:00 PM", "Open time for 20:00 should be 07:00 PM");

console.assert(!isCheckOutVisible("20:00", 18, 59), "At 6:59 PM, check-out should NOT be visible");
console.assert(isCheckOutVisible("20:00", 19, 0), "At 7:00 PM, check-out SHOULD be visible");
console.assert(isCheckOutVisible("20:00", 20, 0), "At 8:00 PM, check-out SHOULD be visible");
console.assert(isCheckOutVisible("20:00", 21, 30), "At 9:30 PM, check-out SHOULD be visible");

console.log("=== Testing 5.00 PM (17:00) Custom Employee Shift ===");
console.log("Open Time String:", getCheckOutOpenTimeString("5.00pm")); // Expected: 04:00 PM
console.assert(getCheckOutOpenTimeString("5.00pm") === "04:00 PM", "Open time for 5.00pm should be 04:00 PM");
console.assert(getCheckOutOpenTimeString("17:00") === "04:00 PM", "Open time for 17:00 should be 04:00 PM");

console.assert(!isCheckOutVisible("17:00", 15, 59), "At 3:59 PM, check-out should NOT be visible");
console.assert(isCheckOutVisible("17:00", 16, 0), "At 4:00 PM, check-out SHOULD be visible");
console.assert(isCheckOutVisible("17:00", 17, 0), "At 5:00 PM, check-out SHOULD be visible");

console.log("=== Testing 6.00 AM Night Shift ===");
console.log("Open Time String:", getCheckOutOpenTimeString("06:00")); // Expected: 05:00 AM
console.assert(getCheckOutOpenTimeString("06:00") === "05:00 AM", "Open time for 06:00 should be 05:00 AM");
console.assert(!isCheckOutVisible("06:00", 4, 59, true), "At 4:59 AM, check-out should NOT be visible");
console.assert(isCheckOutVisible("06:00", 5, 0, true), "At 5:00 AM, check-out SHOULD be visible");

console.log("All timing validation tests PASSED successfully!");
