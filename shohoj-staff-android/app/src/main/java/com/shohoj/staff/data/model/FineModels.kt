package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class FineItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("amount") val amount: Double = 0.0,
    @SerializedName("reason") val reason: String? = null,
    @SerializedName("status") val status: String? = "PENDING", // PENDING, DEDUCTED, CANCELLED, CONSIDERATION_REQUESTED
    @SerializedName("date") val date: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("systemSource") val systemSource: String? = null,
    @SerializedName("appealReason") val appealReason: String? = null
)

data class FineListResponse(
    @SerializedName("fines") val fines: List<FineItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)

data class FineConsiderationRequest(
    @SerializedName("fineId") val fineId: String = "",
    @SerializedName("reason") val reason: String = "",
    @SerializedName("employeeId") val employeeId: String? = null
)

data class FineConsiderationResponse(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("fine") val fine: FineItem? = null,
    @SerializedName("error") val error: String? = null
)
