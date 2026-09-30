package com.shohoj.staff.data.repository

import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ProductRepository(
    private val apiClient: ApiClient,
    private val sessionManager: SessionManager
) {
    suspend fun getProducts(search: String? = null, status: String? = null): Result<StaffProductsResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val empId = sessionManager.employeeId
            val response = service.getStaffProducts(
                search = if (search.isNullOrBlank()) null else search,
                status = if (status == "ALL" || status.isNullOrBlank()) null else status,
                employeeId = empId
            )
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to fetch products"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun confirmReturn(
        projectId: String,
        returnDate: String,
        returnMethod: String,
        returnReceiver: String,
        returnNotes: String?
    ): Result<UpdateProductResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val emp = sessionManager.getEmployee()
            val req = UpdateProductRequest(
                projectId = projectId,
                action = "RETURN",
                managerId = emp?.id ?: sessionManager.employeeId,
                managerName = if (emp != null) "${emp.firstName} ${emp.lastName}".trim() else null,
                returnData = ProductReturnData(
                    returnDate = returnDate,
                    returnMethod = returnMethod,
                    returnReceiver = returnReceiver,
                    returnNotes = returnNotes
                )
            )
            val response = service.updateStaffProduct(req)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to confirm product return"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun receiveProduct(projectId: String): Result<UpdateProductResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val emp = sessionManager.getEmployee()
            val req = UpdateProductRequest(
                projectId = projectId,
                action = "RECEIVE",
                managerId = emp?.id ?: sessionManager.employeeId,
                managerName = if (emp != null) "${emp.firstName} ${emp.lastName}".trim() else null
            )
            val response = service.updateStaffProduct(req)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to receive product"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun revertReturn(projectId: String): Result<UpdateProductResponse> = withContext(Dispatchers.IO) {
        try {
            val service = apiClient.getService()
            val req = UpdateProductRequest(
                projectId = projectId,
                action = "REVERT_RETURN"
            )
            val response = service.updateStaffProduct(req)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val err = response.errorBody()?.string() ?: "Failed to revert return status"
                Result.failure(Exception(err))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
