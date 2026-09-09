package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.LeaveApplyRequest
import com.shohoj.staff.data.model.LeaveBalance
import com.shohoj.staff.data.model.LeaveItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class LeaveRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager? = null
) {
    suspend fun getLeaves(): Result<List<LeaveItem>> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager?.employeeId ?: sessionManager?.getEmployee()?.employeeId ?: sessionManager?.getEmployee()?.id
            val response = apiClient.getService().getLeaves(empId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.leaves)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to load leaves (${response.code()})"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun applyLeave(
        type: String,
        startDate: String,
        endDate: String,
        reason: String
    ): Result<LeaveItem> = withContext(Dispatchers.IO) {
        try {
            val empId = sessionManager?.employeeId ?: sessionManager?.getEmployee()?.employeeId ?: sessionManager?.getEmployee()?.id
            val request = LeaveApplyRequest(
                type = type,
                startDate = startDate,
                endDate = endDate,
                reason = reason,
                employeeId = empId
            )

            // 1. Try standard ESS endpoint
            val response = apiClient.getService().applyLeave(request)
            if (response.isSuccessful && response.body()?.leave != null) {
                return@withContext Result.success(response.body()!!.leave!!)
            }

            // 2. Try mobile dedicated leave endpoint as fallback
            val mobileResponse = apiClient.getService().applyLeaveMobile(request)
            if (mobileResponse.isSuccessful && mobileResponse.body()?.leave != null) {
                return@withContext Result.success(mobileResponse.body()!!.leave!!)
            }

            val err = response.body()?.error
                ?: mobileResponse.body()?.error
                ?: response.errorBody()?.string()
                ?: "Failed to submit leave"
            Result.failure(Exception(err))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun calculateBalance(leaves: List<LeaveItem>): LeaveBalance {
        val approvedLeaves = leaves.filter { it.status == "APPROVED" }
        var casualUsed = 0
        var sickUsed = 0
        var annualUsed = 0

        for (leave in approvedLeaves) {
            when (leave.type.uppercase()) {
                "CASUAL" -> casualUsed += 1
                "SICK" -> sickUsed += 1
                "ANNUAL" -> annualUsed += 1
            }
        }

        return LeaveBalance(
            casualTotal = 14,
            casualUsed = casualUsed,
            sickTotal = 14,
            sickUsed = sickUsed,
            annualTotal = 15,
            annualUsed = annualUsed
        )
    }
}
