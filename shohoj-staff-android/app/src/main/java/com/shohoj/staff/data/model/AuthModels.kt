package com.shohoj.staff.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("employeeId") val employeeId: String,
    @SerializedName("password") val password: String,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("ssid") val ssid: String? = null,
    @SerializedName("bssid") val bssid: String? = null,
    @SerializedName("source") val source: String = "APP"
)

data class LoginResponse(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("employee") val employee: EmployeeDto? = null,
    @SerializedName("user") val user: UserDto? = null
)

data class EmployeeDto(
    @SerializedName("id") val id: String,
    @SerializedName("employeeId") val employeeId: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("firstName") val firstName: String? = null,
    @SerializedName("lastName") val lastName: String? = null,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("designation") val designation: String? = null,
    @SerializedName("department") val department: String? = null,
    @SerializedName("status") val status: String? = null,
    @SerializedName("companyId") val companyId: String? = null
) {
    val displayName: String
        get() = name ?: "${firstName ?: ""} ${lastName ?: ""}".trim().ifEmpty { employeeId }
}

data class UserDto(
    @SerializedName("id") val id: String,
    @SerializedName("email") val email: String,
    @SerializedName("name") val name: String? = null,
    @SerializedName("role") val role: String? = null
)
