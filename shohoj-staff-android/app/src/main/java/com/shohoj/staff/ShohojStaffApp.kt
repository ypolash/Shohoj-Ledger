package com.shohoj.staff

import android.app.Application
import com.shohoj.staff.data.api.ApiClient
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.repository.*
import com.shohoj.staff.util.NotificationSyncManager
import com.shohoj.staff.util.SoundNotificationHelper
import kotlinx.coroutines.*

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

    lateinit var communityRepository: CommunityRepository
        private set

    lateinit var appUpdateRepository: AppUpdateRepository
        private set

    private val appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var livePollerJob: Job? = null

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
        communityRepository = CommunityRepository(apiClient)
        appUpdateRepository = AppUpdateRepository(apiClient, sessionManager, this)

        // Initialize system notification channels (Tasks, Notices, Chat)
        SoundNotificationHelper.initNotificationChannels(this)

        // If user is already logged in, initialize background WorkManager & live poller
        if (sessionManager.isLoggedIn) {
            NotificationSyncManager.scheduleBackgroundSync(this)
            startLiveNotificationPoller()
        }
    }

    fun startLiveNotificationPoller() {
        livePollerJob?.cancel()
        livePollerJob = appScope.launch {
            while (isActive) {
                try {
                    if (sessionManager.isLoggedIn) {
                        NotificationSyncManager.syncAll(this@ShohojStaffApp)
                    }
                } catch (e: Exception) {
                    // Ignore live loop transient errors
                }
                // Live sync cycle every 12 seconds when app process is alive
                delay(12000L)
            }
        }
    }

    fun stopLiveNotificationPoller() {
        livePollerJob?.cancel()
        livePollerJob = null
    }
}

