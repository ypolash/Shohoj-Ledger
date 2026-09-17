package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class LeaveItem(
    @SerializedName("id") val id: String,
    @SerializedName("type") val type: String, // "CASUAL", "SICK", "ANNUAL", "UNPAID", "Short Break"
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("status") val status: String, // "PENDING", "APPROVED", "COMPLETED", "OVERSTAYED", "REJECTED"
    @SerializedName("comments") val comments: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class LeaveApplyRequest(
    @SerializedName("type") val type: String,
    @SerializedName("leaveTypeId") val leaveTypeId: String? = null,
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("employeeId") val employeeId: String? = null
)

data class LeaveCategoryBalance(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("isPaid") val isPaid: Boolean = true,
    @SerializedName("quotaModel") val quotaModel: String? = null,
    @SerializedName("isShortBreak") val isShortBreak: Boolean = false,
    @SerializedName("breakDurationMinutes") val breakDurationMinutes: Int = 30,
    @SerializedName("gracePeriodMinutes") val gracePeriodMinutes: Int = 5,
    @SerializedName("fineAmount") val fineAmount: Double = 50.0,
    @SerializedName("fineType") val fineType: String = "FIXED",
    @SerializedName("autoFine") val autoFine: Boolean = true,
    @SerializedName("total") val total: Int = 0,
    @SerializedName("used") val used: Int = 0,
    @SerializedName("remaining") val remaining: Int = 0
)

data class LeaveTypeItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("description") val description: String? = null,
    @SerializedName("isPaid") val isPaid: Boolean = true,
    @SerializedName("quotaModel") val quotaModel: String? = null,
    @SerializedName("isShortBreak") val isShortBreak: Boolean = false,
    @SerializedName("breakDurationMinutes") val breakDurationMinutes: Int = 30,
    @SerializedName("gracePeriodMinutes") val gracePeriodMinutes: Int = 5,
    @SerializedName("fineAmount") val fineAmount: Double = 50.0,
    @SerializedName("fineType") val fineType: String = "FIXED",
    @SerializedName("autoFine") val autoFine: Boolean = true
)

data class ActiveBreakInfo(
    @SerializedName("leaveId") val leaveId: String = "",
    @SerializedName("type") val type: String = "Short Break",
    @SerializedName("status") val status: String = "APPROVED",
    @SerializedName("startTime") val startTime: String = "",
    @SerializedName("targetEndTime") val targetEndTime: String = "",
    @SerializedName("graceEndTime") val graceEndTime: String = "",
    @SerializedName("durationMinutes") val durationMinutes: Int = 30,
    @SerializedName("gracePeriodMinutes") val gracePeriodMinutes: Int = 5,
    @SerializedName("fineAmount") val fineAmount: Double = 50.0,
    @SerializedName("fineType") val fineType: String = "FIXED",
    @SerializedName("autoFine") val autoFine: Boolean = true,
    @SerializedName("remainingSeconds") val remainingSeconds: Long = 0,
    @SerializedName("isOverstayed") val isOverstayed: Boolean = false,
    @SerializedName("overstayMinutes") val overstayMinutes: Int = 0,
    @SerializedName("estimatedFine") val estimatedFine: Double = 0.0
)

data class LeaveListResponse(
    @SerializedName("leaves") val leaves: List<LeaveItem> = emptyList(),
    @SerializedName("balances") val balances: List<LeaveCategoryBalance> = emptyList(),
    @SerializedName("leaveTypes") val leaveTypes: List<LeaveTypeItem> = emptyList(),
    @SerializedName("activeBreak") val activeBreak: ActiveBreakInfo? = null,
    @SerializedName("hasActiveBreak") val hasActiveBreak: Boolean = false,
    @SerializedName("error") val error: String? = null
)

data class LeaveApplyResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("autoApproved") val autoApproved: Boolean = false,
    @SerializedName("leave") val leave: LeaveItem? = null,
    @SerializedName("activeBreak") val activeBreak: ActiveBreakInfo? = null,
    @SerializedName("hasActiveBreak") val hasActiveBreak: Boolean = false,
    @SerializedName("error") val error: String? = null
)

data class EndBreakRequest(
    @SerializedName("action") val action: String = "END_BREAK",
    @SerializedName("leaveId") val leaveId: String? = null,
    @SerializedName("employeeId") val employeeId: String? = null
)

data class EndBreakResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("message") val message: String? = null,
    @SerializedName("isOverstayed") val isOverstayed: Boolean = false,
    @SerializedName("overstayMinutes") val overstayMinutes: Int = 0,
    @SerializedName("fineApplied") val fineApplied: Boolean = false,
    @SerializedName("fineAmount") val fineAmount: Double = 0.0,
    @SerializedName("error") val error: String? = null
)

data class LeaveBalance(
    val casualTotal: Int = 14,
    val casualUsed: Int = 0,
    val sickTotal: Int = 14,
    val sickUsed: Int = 0,
    val annualTotal: Int = 15,
    val annualUsed: Int = 0
)
