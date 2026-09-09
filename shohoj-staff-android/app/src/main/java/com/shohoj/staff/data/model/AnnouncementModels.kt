package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class AnnouncementItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("type") val type: String? = "INFO", // "INFO", "PAYROLL", "HOLIDAY", "URGENT"
    @SerializedName("author") val author: String? = "HR Department",
    @SerializedName("createdAt") val createdAt: String? = null
)

data class AnnouncementResponse(
    @SerializedName("announcements") val announcements: List<AnnouncementItem> = emptyList(),
    @SerializedName("error") val error: String? = null
)
