package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class LeaveItem(
    @SerializedName("id") val id: String,
    @SerializedName("type") val type: String, // "CASUAL", "SICK", "ANNUAL", "UNPAID"
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("status") val status: String, // "PENDING", "APPROVED", "REJECTED"
    @SerializedName("createdAt") val createdAt: String? = null
)

data class LeaveApplyRequest(
    @SerializedName("type") val type: String,
    @SerializedName("startDate") val startDate: String,
    @SerializedName("endDate") val endDate: String,
    @SerializedName("reason") val reason: String
)

data class LeaveListResponse(
    @SerializedName("leaves") val leaves: List<LeaveItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class LeaveApplyResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("leave") val leave: LeaveItem? = null,
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
