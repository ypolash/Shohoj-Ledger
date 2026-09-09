package com.shohoj.staff.data.api

import com.shohoj.staff.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ShohojApiService {

    // --- Authentication ---

    @POST("api/mobile/login")
    suspend fun loginMobile(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("api/mobile/auth/login")
    suspend fun loginMobileAuth(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("api/auth/login")
    suspend fun loginAuth(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    // --- Attendance (ESS & Mobile) ---

    @GET("api/ess/attendance")
    suspend fun getEssAttendance(
        @Query("limit") limit: Int = 30
    ): Response<EssAttendanceResponse>

    @POST("api/ess/attendance")
    suspend fun submitEssAttendance(
        @Body request: ClockActionRequest
    ): Response<ClockActionResponse>

    @GET("api/mobile/attendance/status")
    suspend fun getMobileAttendanceStatus(
        @Query("employeeId") employeeId: String
    ): Response<MobileAttendanceStatusResponse>

    @POST("api/mobile/attendance/checkin")
    suspend fun checkInMobile(
        @Body request: ClockActionRequest
    ): Response<ClockActionResponse>

    @POST("api/mobile/attendance/checkout")
    suspend fun checkOutMobile(
        @Body request: ClockActionRequest
    ): Response<ClockActionResponse>

    @GET("api/mobile/attendance/history")
    suspend fun getMobileAttendanceHistory(
        @Query("employeeId") employeeId: String
    ): Response<List<AttendanceRecord>>

    // --- Leave Management ---

    @GET("api/ess/leave")
    suspend fun getLeaves(): Response<LeaveListResponse>

    @POST("api/ess/leave")
    suspend fun applyLeave(
        @Body request: LeaveApplyRequest
    ): Response<LeaveApplyResponse>

    // --- Payroll ---

    @GET("api/ess/payroll")
    suspend fun getPayroll(): Response<PayrollResponse>

    // --- Tasks ---

    @GET("api/ess/tasks")
    suspend fun getTasks(): Response<TaskListResponse>

    @GET("api/mobile/tasks")
    suspend fun getMobileTasks(
        @Query("employeeId") employeeId: String
    ): Response<List<TaskItem>>

    @PATCH("api/mobile/tasks/{id}/status")
    suspend fun updateTaskStatus(
        @Path("id") taskId: String,
        @Body request: TaskStatusUpdateRequest
    ): Response<TaskItem>

    // --- Announcements ---

    @GET("api/ess/announcements")
    suspend fun getAnnouncements(): Response<AnnouncementResponse>

    // --- Profile ---

    @GET("api/ess/profile")
    suspend fun getEssProfile(): Response<ProfileResponse>

    @GET("api/mobile/profile")
    suspend fun getMobileProfile(
        @Query("employeeId") employeeId: String
    ): Response<DetailedEmployeeProfile>
}
