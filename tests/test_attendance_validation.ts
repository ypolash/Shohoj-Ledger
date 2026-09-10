import { parseTimeToMinutes, parseDateTimeInTimezone } from "../lib/attendance";

function runTests() {
  console.log("=== RUNNING ATTENDANCE TESTS ===");

  // 1. Time parsing tests
  console.log("\n1. Testing parseTimeToMinutes:");
  const testTimes = [
    { input: "09:30", expected: 570 },
    { input: "9:30 AM", expected: 570 },
    { input: "09:30 AM", expected: 570 },
    { input: "11:34", expected: 694 },
    { input: "11:34 AM", expected: 694 },
    { input: "13:21", expected: 801 },
    { input: "1:21 PM", expected: 801 },
    { input: "01:21 PM", expected: 801 },
    { input: "18:00", expected: 1080 },
    { input: "6:00 PM", expected: 1080 },
  ];

  for (const { input, expected } of testTimes) {
    const res = parseTimeToMinutes(input);
    const pass = res === expected;
    console.log(`  [${pass ? "PASS" : "FAIL"}] "${input}" => ${res} (expected: ${expected})`);
    if (!pass) throw new Error(`parseTimeToMinutes failed for ${input}`);
  }

  // 2. Wall-clock to UTC parsing in Asia/Dhaka
  console.log("\n2. Testing parseDateTimeInTimezone in Asia/Dhaka:");
  const dateStr1 = "2026-09-10";
  const timeStr1 = "11:34";
  const utcDate1 = parseDateTimeInTimezone(dateStr1, timeStr1, "Asia/Dhaka");
  if (!utcDate1) throw new Error("utcDate1 is null");
  console.log(`  Input: ${dateStr1} ${timeStr1} (Asia/Dhaka) => UTC: ${utcDate1.toISOString()}`);
  const pass1 = utcDate1.toISOString() === "2026-09-10T05:34:00.000Z";
  console.log(`  [${pass1 ? "PASS" : "FAIL"}] Matches 2026-09-10T05:34:00.000Z`);
  if (!pass1) throw new Error("parseDateTimeInTimezone test 1 failed");

  const dateStr2 = "2026-09-09";
  const timeStr2 = "13:21";
  const utcDate2 = parseDateTimeInTimezone(dateStr2, timeStr2, "Asia/Dhaka");
  if (!utcDate2) throw new Error("utcDate2 is null");
  console.log(`  Input: ${dateStr2} ${timeStr2} (Asia/Dhaka) => UTC: ${utcDate2.toISOString()}`);
  const pass2 = utcDate2.toISOString() === "2026-09-09T07:21:00.000Z";
  console.log(`  [${pass2 ? "PASS" : "FAIL"}] Matches 2026-09-09T07:21:00.000Z`);
  if (!pass2) throw new Error("parseDateTimeInTimezone test 2 failed");

  // 3. Late duration calculation math
  console.log("\n3. Testing Late duration logic:");
  const shiftStartMinutes = parseTimeToMinutes("09:30"); // 570
  const gracePeriod = 15; // threshold = 585
  const lateThreshold = shiftStartMinutes + gracePeriod;

  // Case A: 11:34 AM check in
  const checkInMin1 = parseTimeToMinutes("11:34"); // 694
  const isLate1 = checkInMin1 > lateThreshold;
  const lateMinutes1 = checkInMin1 - shiftStartMinutes;
  console.log(`  11:34 check in: isLate=${isLate1} (expected: true), lateMinutes=${lateMinutes1} (expected: 124)`);
  if (!isLate1 || lateMinutes1 !== 124) throw new Error("Case A calculation failed");

  // Case B: 13:21 check in
  const checkInMin2 = parseTimeToMinutes("13:21"); // 801
  const isLate2 = checkInMin2 > lateThreshold;
  const lateMinutes2 = checkInMin2 - shiftStartMinutes;
  console.log(`  13:21 check in: isLate=${isLate2} (expected: true), lateMinutes=${lateMinutes2} (expected: 231)`);
  if (!isLate2 || lateMinutes2 !== 231) throw new Error("Case B calculation failed");

  // Case C: 09:40 check in (within 15 min grace period)
  const checkInMin3 = parseTimeToMinutes("09:40"); // 580
  const isLate3 = checkInMin3 > lateThreshold;
  console.log(`  09:40 check in (within grace): isLate=${isLate3} (expected: false)`);
  if (isLate3) throw new Error("Case C calculation failed");

  console.log("\nALL TESTS PASSED SUCCESSFULLY!");
}

runTests();
