import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Biometric Hardware & IoT Timeclock Webhook
 * Accepts check-in/check-out punches from ZKTeco, Hikvision, Dahua, or RFID devices.
 */
export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization');
    const body = await request.json();

    // Body can be a single punch or array of batch punches
    const punches = Array.isArray(body) ? body : [body];

    if (punches.length === 0) {
      return NextResponse.json({ error: 'No punch records provided' }, { status: 400 });
    }

    const results = {
      processed: 0,
      errors: [] as string[]
    };

    for (const punch of punches) {
      const { employeeId, timestamp, deviceId, type = 'AUTO', companyId } = punch;

      if (!employeeId || !timestamp) {
        results.errors.push(`Missing employeeId or timestamp for punch: ${JSON.stringify(punch)}`);
        continue;
      }

      // Find employee by employeeId (e.g. EMP-001) or uuid
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { id: employeeId },
            { employeeId: employeeId }
          ],
          ...(companyId ? { companyId } : {})
        },
        include: {
          workShift: true,
          company: true
        }
      });

      if (!employee) {
        results.errors.push(`Employee not found: ${employeeId}`);
        continue;
      }

      const punchDate = new Date(timestamp);
      const dayStart = new Date(punchDate);
      dayStart.setHours(0, 0, 0, 0);

      // Determine shift times
      const shiftStartTimeStr = employee.workShift?.startTime || '09:00';
      const gracePeriod = employee.workShift?.gracePeriod || 15;
      const [shHour, shMin] = shiftStartTimeStr.split(':').map(Number);
      const shiftStart = new Date(dayStart);
      shiftStart.setHours(shHour, shMin, 0, 0);

      // Fetch or create attendance record for this day
      let attendance = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: dayStart
        }
      });

      if (!attendance) {
        // First punch of the day = Check In
        const lateMinutes = Math.max(0, Math.floor((punchDate.getTime() - shiftStart.getTime()) / 60000));
        const isLate = lateMinutes > gracePeriod;

        await prisma.attendance.create({
          data: {
            companyId: employee.companyId,
            employeeId: employee.id,
            date: dayStart,
            checkInTime: punchDate,
            checkInLocation: deviceId ? `Biometric Device (${deviceId})` : 'Hardware Webhook',
            status: isLate ? 'LATE' : 'PRESENT',
            isLate,
            lateMinutes: isLate ? lateMinutes : 0,
            systemSource: 'ERP'
          }
        });
      } else {
        // Subsequent punch = Check Out
        const checkInTime = attendance.checkInTime || punchDate;
        const totalWorkingMinutes = Math.max(0, Math.floor((punchDate.getTime() - new Date(checkInTime).getTime()) / 60000));

        await prisma.attendance.update({
          where: { id: attendance.id },
          data: {
            checkOutTime: punchDate,
            checkOutLocation: deviceId ? `Biometric Device (${deviceId})` : 'Hardware Webhook',
            totalWorkingMinutes
          }
        });
      }

      results.processed++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} punch(es)`,
      results
    });
  } catch (error) {
    console.error('Biometric webhook error:', error);
    return NextResponse.json({ error: 'Failed to process biometric punches' }, { status: 500 });
  }
}
