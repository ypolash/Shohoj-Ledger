package com.shohoj.staff.ui.screens.login

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.local.SessionManager
import com.shohoj.staff.data.model.EmployeeDto
import com.shohoj.staff.data.repository.AuthRepository
import com.shohoj.staff.util.LocationHelper
import com.shohoj.staff.util.WifiHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val employeeId: String = "EMP-1001",
    val password: String = "password123",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false,
    val serverUrl: String = "",
    val showServerDialog: Boolean = false
)

class LoginViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val authRepository = app.authRepository
    private val sessionManager = app.sessionManager

    private val _uiState = MutableStateFlow(
        LoginUiState(serverUrl = sessionManager.baseUrl)
    )
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun onEmployeeIdChange(value: String) {
        _uiState.value = _uiState.value.copy(employeeId = value, error = null)
    }

    fun onPasswordChange(value: String) {
        _uiState.value = _uiState.value.copy(password = value, error = null)
    }

    fun showServerDialog(show: Boolean) {
        _uiState.value = _uiState.value.copy(showServerDialog = show)
    }

    fun updateServerUrl(url: String) {
        sessionManager.baseUrl = url
        app.apiClient.invalidate()
        _uiState.value = _uiState.value.copy(serverUrl = sessionManager.baseUrl, showServerDialog = false)
    }

    fun setLiveServer() {
        updateServerUrl(SessionManager.LIVE_BASE_URL)
    }

    fun setEmulatorLocalhost() {
        updateServerUrl(SessionManager.EMULATOR_BASE_URL)
    }

    fun login() {
        val currentState = _uiState.value
        if (currentState.employeeId.isBlank() || currentState.password.isBlank()) {
            _uiState.value = currentState.copy(error = "Please enter Employee ID and Password")
            return
        }

        viewModelScope.launch {
            _uiState.value = currentState.copy(isLoading = true, error = null)

            // Try to acquire location & wifi for network/location validation
            val location = LocationHelper.getCurrentLocation(getApplication())
            val wifi = WifiHelper.getWifiDetails(getApplication())

            val result = authRepository.login(
                employeeId = currentState.employeeId,
                password = currentState.password,
                latitude = location?.latitude,
                longitude = location?.longitude,
                ssid = wifi.ssid,
                bssid = wifi.bssid
            )

            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true)
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Invalid Employee ID or Password"
                    )
                }
            )
        }
    }
}
