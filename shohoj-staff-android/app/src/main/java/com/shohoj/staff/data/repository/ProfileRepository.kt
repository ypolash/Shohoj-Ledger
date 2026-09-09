package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.DetailedEmployeeProfile
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ProfileRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun getProfile(): Result<DetailedEmployeeProfile> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            // 1. Try ESS profile
            val essRes = service.getEssProfile()
            if (essRes.isSuccessful && essRes.body()?.employee != null) {
                return@withContext Result.success(essRes.body()!!.employee!!)
            }

            // 2. Fallback to /api/mobile/profile?employeeId=...
            val empId = sessionManager.employeeId ?: return@withContext Result.failure(Exception("Not logged in"))
            val mobRes = service.getMobileProfile(empId)
            if (mobRes.isSuccessful && mobRes.body() != null) {
                Result.success(mobRes.body()!!)
            } else {
                val err = mobRes.errorBody()?.string() ?: "Failed to fetch profile"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
