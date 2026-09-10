package com.shohoj.admin.data.repository

import com.shohoj.admin.data.api.ApiClient
import com.shohoj.admin.data.model.*
import org.json.JSONObject

class AdminRepository(private val apiClient: ApiClient) {

    private val api get() = apiClient.getService()
    val sessionManager get() = apiClient.sessionManager

    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email.trim(), password))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && body.token != null && body.user != null && body.company != null) {
                    sessionManager.saveSession(body.token, body.user, body.company)
                    Result.success(body)
                } else {
                    Result.failure(Exception(body.error ?: "Login failed"))
                }
            } else {
                val errorMsg = parseErrorMessage(response.code(), response.errorBody()?.string())
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getDashboard(): Result<DashboardResponse> {
        return try {
            val response = api.getDashboard()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEmployees(search: String? = null, status: String? = null): Result<List<EmployeeItem>> {
        return try {
            val response = api.getEmployees(search, status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.employees)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAttendanceRoster(date: String? = null, status: String? = null): Result<AttendanceRosterResponse> {
        return try {
            val response = api.getAttendanceRoster(date, status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProjects(
        search: String? = null,
        projectCode: String? = null,
        companyName: String? = null,
        status: String? = null
    ): Result<List<ProjectItem>> {
        return try {
            val response = api.getProjects(search, projectCode, companyName, status)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.projects)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLeads(
        search: String? = null,
        status: String? = null,
        priority: String? = null
    ): Result<LeadsResponse> {
        return try {
            val response = api.getLeads(search, status, priority)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getFinancialReport(period: String = "all"): Result<FinancialReportResponse> {
        return try {
            val response = api.getFinancialReport(period)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLeaves(status: String? = null, search: String? = null): Result<LeavesResponse> {
        return try {
            val response = api.getLeaves(status, search)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception(parseErrorMessage(response.code(), response.errorBody()?.string())))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        sessionManager.clearSession()
        apiClient.cookieJar.clear()
        apiClient.invalidate()
    }

    private fun parseErrorMessage(statusCode: Int, errorBody: String?): String {
        if (statusCode == 404) {
            return "Endpoint not found (404). The server at ${sessionManager.baseUrl} does not have the admin mobile API deployed yet."
        }
        if (statusCode == 502 || statusCode == 503) {
            return "Server temporarily unavailable ($statusCode). Please verify that the backend is online."
        }
        if (statusCode == 401) {
            val msg = tryExtractJsonError(errorBody)
            return msg ?: "Invalid credentials. Please verify your email and password."
        }
        if (statusCode == 403) {
            val msg = tryExtractJsonError(errorBody)
            return msg ?: "Access denied. Only CRM Owners and Admins can access this app."
        }
        if (errorBody.isNullOrBlank()) {
            return "Request failed (HTTP $statusCode)."
        }
        val trimmed = errorBody.trim()
        if (trimmed.startsWith("<") || trimmed.contains("<html", ignoreCase = true)) {
            return "Server returned a web page (HTTP $statusCode) instead of API data. Please check server URL or deployment."
        }
        val jsonMsg = tryExtractJsonError(trimmed)
        return jsonMsg ?: "Error ($statusCode): ${trimmed.take(120)}"
    }

    private fun tryExtractJsonError(body: String?): String? {
        if (body.isNullOrBlank()) return null
        return try {
            val json = JSONObject(body)
            if (json.has("error")) json.getString("error")
            else if (json.has("message")) json.getString("message")
            else null
        } catch (e: Exception) {
            null
        }
    }
}
