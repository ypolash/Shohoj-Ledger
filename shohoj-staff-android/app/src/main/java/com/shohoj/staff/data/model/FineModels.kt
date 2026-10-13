package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class FineItem(
    @SerializedName("id") val id: String = "",
    @SerializedName("amount") val amount: Double = 0.0,
    @SerializedName("reason") val reason: String? = null,
    @SerializedName("status") val status: String? = "PENDING", // PENDING, DEDUCTED, CANCELLED
    @SerializedName("date") val date: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("systemSource") val systemSource: String? = null
)

data class FineListResponse(
    @SerializedName("fines") val fines: List<FineItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)
