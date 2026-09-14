package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class AppUpdateInfo(
    @SerializedName("appName") val appName: String = "Shohoj Staff",
    @SerializedName("appId") val appId: String? = null,
    @SerializedName("versionCode") val versionCode: Int = 1,
    @SerializedName("versionName") val versionName: String = "1.0.0",
    @SerializedName("minVersion") val minVersion: String? = null,
    @SerializedName("title") val title: String = "Update Available",
    @SerializedName("releaseNotes") val releaseNotes: List<String> = emptyList(),
    @SerializedName("downloadUrl") val downloadUrl: String = "",
    @SerializedName("fileSize") val fileSize: String? = null,
    @SerializedName("isForceUpdate") val isForceUpdate: Boolean = false,
    @SerializedName("publishedAt") val publishedAt: String? = null
)
