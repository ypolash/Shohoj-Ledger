package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AttendanceRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun getAttendanceData(): Result<EssAttendanceResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            // 1. Try ESS route first (session-cookie based)
            val response = service.getEssAttendance()
            if (response.isSuccessful && response.body() != null) {
                return@withContext Result.success(response.body()!!)
            }

            // 2. Fallback to mobile attendance endpoints
            val empId = sessionManager.employeeId ?: return@withContext Result.failure(Exception("Not logged in"))
            val historyRes = service.getMobileAttendanceHistory(empId)
            val statusRes = service.getMobileAttendanceStatus(empId)

            val records = if (historyRes.isSuccessful) historyRes.body() ?: emptyList() else emptyList()
            val statusBody = if (statusRes.isSuccessful) statusRes.body() else null

            val todayRecord = if (statusBody != null && (statusBody.checkInTime != null || statusBody.status != null)) {
                AttendanceRecord(
                    employeeId = empId,
                    checkInTime = statusBody.checkInTime,
                    checkOutTime = statusBody.checkOutTime,
                    status = statusBody.status,
                    isCheckedIn = statusBody.checkInTime != null && statusBody.checkOutTime == null
                )
            } else records.firstOrNull()

            val summary = AttendanceSummary(
                present = records.count { it.effectiveStatus == "PRESENT" },
                absent = records.count { it.effectiveStatus == "ABSENT" },
                late = records.count { it.effectiveStatus == "LATE" || it.isLate == true },
                halfDay = records.count { it.effectiveStatus == "HALF_DAY" }
            )

            Result.success(
                EssAttendanceResponse(
                    records = records,
                    today = todayRecord,
                    summary = summary
                )
            )
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun clockAction(
        action: String, // "CLOCK_IN" or "CLOCK_OUT"
        latitude: Double? = null,
        longitude: Double? = null,
        ssid: String? = null,
        bssid: String? = null
    ): Result<ClockActionResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val empId = sessionManager.employeeId

            val request = ClockActionRequest(
                action = action,
                employeeId = empId,
                latitude = latitude,
                longitude = longitude,
                ssid = ssid,
                bssid = bssid,
                wifiSsid = ssid,
                wifiBssid = bssid
            )

            // 1. Try ESS attendance route
            val response = service.submitEssAttendance(request)
            if (response.isSuccessful && response.body() != null) {
                return@withContext Result.success(response.body()!!)
            }

            // 2. Fallback to /api/mobile/attendance/checkin or checkout
            val fallbackResponse = if (action == "CLOCK_IN") {
                service.checkInMobile(request)
            } else {
                service.checkOutMobile(request)
            }

            if (fallbackResponse.isSuccessful && fallbackResponse.body() != null) {
                Result.success(fallbackResponse.body()!!)
            } else {
                val errorText = fallbackResponse.errorBody()?.string() ?: response.errorBody()?.string()
                val message = errorText?.ifBlank { null } ?: "Clock action failed (${response.code()})"
                Result.failure(Exception(message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
