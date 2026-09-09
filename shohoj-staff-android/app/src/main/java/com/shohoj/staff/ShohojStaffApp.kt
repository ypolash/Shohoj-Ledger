package com.shohoj.staff

import android.app.Application
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.repository.*

class ShohojStaffApp : Application() {

    lateinit var sessionManager: SessionManager
        private set

    lateinit var apiClient: ApiClient
        private set

    lateinit var authRepository: AuthRepository
        private set

    lateinit var attendanceRepository: AttendanceRepository
        private set

    lateinit var leaveRepository: LeaveRepository
        private set

    lateinit var payrollRepository: PayrollRepository
        private set

    lateinit var taskRepository: TaskRepository
        private set

    lateinit var announcementRepository: AnnouncementRepository
        private set

    lateinit var profileRepository: ProfileRepository
        private set

    override fun onCreate() {
        super.onCreate()

        sessionManager = SessionManager(this)
        apiClient = ApiClient(this)

        authRepository = AuthRepository(apiClient, sessionManager)
        attendanceRepository = AttendanceRepository(apiClient, sessionManager)
        leaveRepository = LeaveRepository(apiClient, sessionManager)
        payrollRepository = PayrollRepository(apiClient)
        taskRepository = TaskRepository(apiClient, sessionManager)
        announcementRepository = AnnouncementRepository(apiClient)
        profileRepository = ProfileRepository(apiClient, sessionManager)
    }
}
