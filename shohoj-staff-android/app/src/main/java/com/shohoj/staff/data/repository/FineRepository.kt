package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.FineConsiderationRequest
import com.shohoj.staff.data.model.FineItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class FineRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun getFines(): Result<List<FineItem>> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            // 1. Try ESS route first
            val essRes = service.getEssFines()
            if (essRes.isSuccessful && essRes.body() != null) {
                return@withContext Result.success(essRes.body()!!.fines)
            }

            // 2. Fallback to /api/mobile/fines
            val empId = sessionManager.employeeId
            val mobRes = service.getMobileFines(empId)
            if (mobRes.isSuccessful && mobRes.body() != null) {
                Result.success(mobRes.body()!!.fines)
            } else {
                val err = mobRes.errorBody()?.string() ?: "Failed to fetch fines"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestConsideration(fineId: String, reason: String): Result<FineItem> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager.employeeId
            val response = apiClient.getService().requestFineConsideration(
                FineConsiderationRequest(
                    fineId = fineId,
                    reason = reason,
                    employeeId = empId
                )
            )
            if (response.isSuccessful && response.body() != null && response.body()!!.fine != null) {
                Result.success(response.body()!!.fine!!)
            } else {
                val err = response.errorBody()?.string() ?: response.body()?.error ?: "Failed to submit consideration request"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
