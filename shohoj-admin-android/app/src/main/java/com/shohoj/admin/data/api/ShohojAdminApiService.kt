package com.shohoj.admin.data.api

import com.shohoj.admin.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ShohojAdminApiService {

    // --- Authentication ---
    @POST("api/mobile/admin/auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    // --- Dashboard ---
    @GET("api/mobile/admin/dashboard")
    suspend fun getDashboard(): Response<DashboardResponse>

    // --- Employees ---
    @GET("api/mobile/admin/employees")
    suspend fun getEmployees(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): Response<EmployeesResponse>

    // --- Attendance (Today & Roster) ---
    @GET("api/mobile/admin/attendance")
    suspend fun getAttendanceRoster(
        @Query("date") date: String? = null,
        @Query("status") status: String? = null
    ): Response<AttendanceRosterResponse>

    // --- Projects (Search by Project Code or Company Name) ---
    @GET("api/mobile/admin/projects")
    suspend fun getProjects(
        @Query("search") search: String? = null,
        @Query("projectCode") projectCode: String? = null,
        @Query("companyName") companyName: String? = null,
        @Query("status") status: String? = null
    ): Response<ProjectsResponse>

    // --- Leads ---
    @GET("api/mobile/admin/leads")
    suspend fun getLeads(
        @Query("search") search: String? = null,
        @Query("status") status: String? = null,
        @Query("priority") priority: String? = null
    ): Response<LeadsResponse>

    // --- Financial Report ---
    @GET("api/mobile/admin/financial-report")
    suspend fun getFinancialReport(
        @Query("period") period: String = "all"
    ): Response<FinancialReportResponse>

    // --- Leave Requests ---
    @GET("api/mobile/admin/leaves")
    suspend fun getLeaves(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null
    ): Response<LeavesResponse>
}
