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

    @GET("api/mobile/leave")
    suspend fun getMobileLeaves(
        @Query("employeeId") employeeId: String? = null
    ): Response<LeaveListResponse>

    @GET("api/ess/leave")
    suspend fun getLeaves(
        @Query("employeeId") employeeId: String? = null
    ): Response<LeaveListResponse>

    @POST("api/ess/leave")
    suspend fun applyLeave(
        @Body request: LeaveApplyRequest
    ): Response<LeaveApplyResponse>

    @POST("api/mobile/leave")
    suspend fun applyLeaveMobile(
        @Body request: LeaveApplyRequest
    ): Response<LeaveApplyResponse>

    @POST("api/mobile/leave/break")
    suspend fun requestBreak(
        @Body request: RequestBreakRequest
    ): Response<StartBreakResponse>

    @POST("api/mobile/leave/break")
    suspend fun endBreak(
        @Body request: EndBreakRequest
    ): Response<EndBreakResponse>

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

    // --- Community & Chat ---

    @GET("api/community/channels")
    suspend fun getCommunityChannels(): Response<ChannelListResponse>

    @POST("api/community/channels")
    suspend fun createCommunityChannel(
        @Body request: CreateChannelRequest
    ): Response<ChannelDetailResponse>

    @PATCH("api/community/channels/{id}")
    suspend fun markChannelRead(
        @Path("id") channelId: String,
        @Body request: MarkChannelReadRequest = MarkChannelReadRequest()
    ): Response<SimpleActionResponse>

    @GET("api/community/members")
    suspend fun getCommunityMembers(): Response<CommunityDirectoryResponse>

    @GET("api/community/messages")
    suspend fun getCommunityMessages(
        @Query("channelId") channelId: String,
        @Query("since") since: String? = null
    ): Response<MessageListResponse>

    @POST("api/community/messages")
    suspend fun sendCommunityMessage(
        @Body request: SendMessageRequest
    ): Response<SendMessageResponse>

    @POST("api/community/direct-messages")
    suspend fun createOrGetDirectMessage(
        @Body request: CreateDirectMessageRequest
    ): Response<ChannelDetailResponse>

    @POST("api/community/messages/{id}/reactions")
    suspend fun toggleMessageReaction(
        @Path("id") messageId: String,
        @Body request: ReactionRequest
    ): Response<SimpleActionResponse>

    @POST("api/community/messages/{id}/pin")
    suspend fun toggleMessagePin(
        @Path("id") messageId: String
    ): Response<SimpleActionResponse>

    @Multipart
    @POST("api/community/upload")
    suspend fun uploadCommunityAttachment(
        @Part file: okhttp3.MultipartBody.Part
    ): Response<CommunityUploadResponse>

    // --- App Updates ---

    @GET("api/mobile/version")
    suspend fun getAppVersion(
        @Query("app") app: String = "staff"
    ): Response<AppUpdateInfo>
}
