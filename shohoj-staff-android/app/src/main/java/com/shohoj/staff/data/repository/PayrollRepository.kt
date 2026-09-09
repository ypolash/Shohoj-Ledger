package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.model.PayrollResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class PayrollRepository(
    private val apiClient: ApiClient
) {
    suspend fun getPayroll(): Result<PayrollResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiClient.getService().getPayroll()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch payroll (${response.code()})"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
