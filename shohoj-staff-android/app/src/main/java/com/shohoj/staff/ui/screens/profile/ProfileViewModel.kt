package com.shohoj.staff.ui.screens.profile

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.AppUpdateInfo
import com.shohoj.staff.data.model.DetailedEmployeeProfile
import com.shohoj.staff.data.model.EmployeeDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

import com.shohoj.staff.service.NotificationSyncForegroundService
import com.shohoj.staff.util.BackgroundPermissionHelper
import com.shohoj.staff.util.SoundNotificationHelper

data class ProfileUiState(
    val isLoading: Boolean = false,
    val employeeDto: EmployeeDto? = null,
    val profileDetails: DetailedEmployeeProfile? = null,
    val serverUrl: String = "",
    val showLogoutDialog: Boolean = false,
    val isLoggedOut: Boolean = false,
    val error: String? = null,
    val isCheckingUpdate: Boolean = false,
    val updateDialogInfo: AppUpdateInfo? = null,
    val appVersionName: String = "1.0.0",
    val updateMessage: String? = null,
    val isPersistentSyncEnabled: Boolean = true,
    val isBatteryOptimizedIgnored: Boolean = true,
    val canScheduleExactAlarms: Boolean = true,
    val isNotificationGranted: Boolean = true,
    val showBackgroundSetupDialog: Boolean = false
)

class ProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val authRepo = app.authRepository
    private val profileRepo = app.profileRepository
    private val sessionManager = app.sessionManager
    private val updateRepo = app.appUpdateRepository

    private val _uiState = MutableStateFlow(
        ProfileUiState(
            employeeDto = authRepo.getCurrentEmployee(),
            serverUrl = sessionManager.baseUrl,
            appVersionName = updateRepo.getCurrentAppVersion().second,
            isPersistentSyncEnabled = sessionManager.isPersistentBackgroundSyncEnabled,
            isBatteryOptimizedIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(app),
            canScheduleExactAlarms = BackgroundPermissionHelper.canScheduleExactAlarms(app),
            isNotificationGranted = BackgroundPermissionHelper.isNotificationPermissionGranted(app)
        )
    )
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = profileRepo.getProfile()

            result.fold(
                onSuccess = { profile ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        profileDetails = profile
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage
                    )
                }
            )
        }
    }

    fun checkForUpdate() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingUpdate = true, updateMessage = null)
            val result = updateRepo.checkForUpdate()
            val checkResult = result.getOrNull()

            if (checkResult != null) {
                if (checkResult.isUpdateAvailable && checkResult.updateInfo != null) {
                    _uiState.value = _uiState.value.copy(
                        isCheckingUpdate = false,
                        updateDialogInfo = checkResult.updateInfo,
                        appVersionName = checkResult.currentVersionName
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCheckingUpdate = false,
                        appVersionName = checkResult.currentVersionName,
                        updateMessage = "You are using the latest version (v${checkResult.currentVersionName})"
                    )
                }
            } else {
                _uiState.value = _uiState.value.copy(
                    isCheckingUpdate = false,
                    updateMessage = "Unable to check updates. Please check your connection."
                )
            }
        }
    }

    fun dismissUpdateDialog() {
        _uiState.value = _uiState.value.copy(updateDialogInfo = null)
    }

    fun dismissUpdateMessage() {
        _uiState.value = _uiState.value.copy(updateMessage = null)
    }

    fun downloadUpdate(downloadUrl: String) {
        updateRepo.downloadAndInstallApk(downloadUrl)
    }

    fun refreshBackgroundPermissions() {
        _uiState.value = _uiState.value.copy(
            isBatteryOptimizedIgnored = BackgroundPermissionHelper.isIgnoringBatteryOptimizations(app),
            canScheduleExactAlarms = BackgroundPermissionHelper.canScheduleExactAlarms(app),
            isNotificationGranted = BackgroundPermissionHelper.isNotificationPermissionGranted(app),
            isPersistentSyncEnabled = sessionManager.isPersistentBackgroundSyncEnabled
        )
    }

    fun togglePersistentSync(enabled: Boolean) {
        sessionManager.isPersistentBackgroundSyncEnabled = enabled
        _uiState.value = _uiState.value.copy(isPersistentSyncEnabled = enabled)
        if (enabled && sessionManager.isLoggedIn) {
            NotificationSyncForegroundService.start(app)
        } else {
            NotificationSyncForegroundService.stop(app)
        }
    }

    fun showBackgroundSetupDialog(show: Boolean) {
        _uiState.value = _uiState.value.copy(showBackgroundSetupDialog = show)
        if (!show) {
            refreshBackgroundPermissions()
        }
    }

    fun sendTestNotification() {
        SoundNotificationHelper.sendTestNotification(app)
        _uiState.value = _uiState.value.copy(
            updateMessage = "Test notification sent! Check notification tray."
        )
    }

    fun showLogoutDialog(show: Boolean) {
        _uiState.value = _uiState.value.copy(showLogoutDialog = show)
    }

    fun logout() {
        authRepo.logout()
        _uiState.value = _uiState.value.copy(showLogoutDialog = false, isLoggedOut = true)
    }
}
