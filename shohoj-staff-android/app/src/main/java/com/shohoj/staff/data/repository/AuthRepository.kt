package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.EmployeeDto
import com.shohoj.staff.data.model.LoginRequest
import com.shohoj.staff.data.model.LoginResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun login(
        employeeId: String,
        password: String,
        latitude: Double? = null,
        longitude: Double? = null,
        ssid: String? = null,
        bssid: String? = null
    ): Result<EmployeeDto> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val request = LoginRequest(
                employeeId = employeeId.trim(),
                password = password,
                latitude = latitude,
                longitude = longitude,
                ssid = ssid,
                bssid = bssid,
                source = "APP"
            )

            // 1. Try mobile login endpoint first
            var response = service.loginMobile(request)
            if (!response.isSuccessful || response.body()?.success != true) {
                // Fallback to /api/auth/login
                response = service.loginAuth(request)
            }

            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && body.success) {
                    // Extract or build employee DTO
                    val employee = body.employee ?: EmployeeDto(
                        id = body.userId ?: employeeId,
                        employeeId = employeeId,
                        name = body.user?.name,
                        email = body.user?.email,
                        designation = body.user?.role ?: "Employee"
                    )

                    body.token?.let { sessionManager.token = it }
                    sessionManager.saveEmployee(employee)
                    return@withContext Result.success(employee)
                } else {
                    val errMsg = body?.message ?: "Invalid Employee ID or Password"
                    return@withContext Result.failure(Exception(errMsg))
                }
            } else {
                val errorBody = response.errorBody()?.string()
                val message = if (!errorBody.isNullOrBlank() && errorBody.contains("message")) {
                    errorBody
                } else {
                    "Authentication failed with status ${response.code()}"
                }
                return@withContext Result.failure(Exception(message))
            }
        } catch (e: Exception) {
            return@withContext Result.failure(e)
        }
    }

    fun isLoggedIn(): Boolean = sessionManager.isLoggedIn

    fun getCurrentEmployee(): EmployeeDto? = sessionManager.getEmployee()

    fun logout() {
        sessionManager.clearSession()
        apiClient.cookieJar.clear()
    }
}
