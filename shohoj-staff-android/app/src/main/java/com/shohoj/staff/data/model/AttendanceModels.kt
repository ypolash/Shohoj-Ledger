package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class ClockActionRequest(
    @SerializedName("action") val action: String, // "CLOCK_IN" or "CLOCK_OUT"
    @SerializedName("employeeId") val employeeId: String? = null,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("ssid") val ssid: String? = null,
    @SerializedName("bssid") val bssid: String? = null,
    @SerializedName("wifiSsid") val wifiSsid: String? = null,
    @SerializedName("wifiBssid") val wifiBssid: String? = null,
    @SerializedName("location") val location: String? = null
)

data class ClockActionResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null,
    @SerializedName("code") val code: String? = null,
    @SerializedName("record") val record: AttendanceRecord? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("lateMinutes") val lateMinutes: Int? = null,
    @SerializedName("serverTime") val serverTime: String? = null
)

data class AttendanceRecord(
    @SerializedName("id") val id: String? = null,
    @SerializedName("employeeId") val employeeId: String? = null,
    @SerializedName("date") val date: String? = null,
    @SerializedName("checkInTime") val checkInTime: String? = null,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("checkIn") val checkIn: String? = null,
    @SerializedName("checkOut") val checkOut: String? = null,
    @SerializedName("status") val status: String? = null, // "PRESENT", "LATE", "ABSENT", "HALF_DAY"
    @SerializedName("lateMinutes") val lateMinutes: Int? = 0,
    @SerializedName("totalWorkingMinutes") val totalWorkingMinutes: Int? = null,
    @SerializedName("isCheckedIn") val isCheckedIn: Boolean? = null,
    @SerializedName("isLate") val isLate: Boolean? = false
) {
    val displayCheckIn: String?
        get() = checkInTime ?: checkIn

    val displayCheckOut: String?
        get() = checkOutTime ?: checkOut

    val effectiveStatus: String
        get() = status ?: if (isLate == true) "LATE" else "PRESENT"
}

data class AttendanceSummary(
    @SerializedName("present") val present: Int = 0,
    @SerializedName("absent") val absent: Int = 0,
    @SerializedName("late") val late: Int = 0,
    @SerializedName("halfDay") val halfDay: Int = 0
)

data class EssAttendanceResponse(
    @SerializedName("records") val records: List<AttendanceRecord> = emptyList(),
    @SerializedName("today") val today: AttendanceRecord? = null,
    @SerializedName("summary") val summary: AttendanceSummary? = null,
    @SerializedName("error") val error: String? = null
)

data class MobileAttendanceStatusResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("checkInTime") val checkInTime: String? = null,
    @SerializedName("checkOutTime") val checkOutTime: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("lateMinutes") val lateMinutes: Int? = null,
    @SerializedName("isLate") val isLate: Boolean? = null,
    @SerializedName("record") val record: AttendanceRecord? = null,
    @SerializedName("message") val message: String? = null
)

