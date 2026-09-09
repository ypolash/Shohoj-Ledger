package com.shohoj.staff.ui.screens.profile

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.DetailedEmployeeProfile
import com.shohoj.staff.data.model.EmployeeDto
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProfileUiState(
    val isLoading: Boolean = false,
    val employeeDto: EmployeeDto? = null,
    val profileDetails: DetailedEmployeeProfile? = null,
    val serverUrl: String = "",
    val showLogoutDialog: Boolean = false,
    val isLoggedOut: Boolean = false,
    val error: String? = null
)

class ProfileViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val authRepo = app.authRepository
    private val profileRepo = app.profileRepository
    private val sessionManager = app.sessionManager

    private val _uiState = MutableStateFlow(
        ProfileUiState(
            employeeDto = authRepo.getCurrentEmployee(),
            serverUrl = sessionManager.baseUrl
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

    fun showLogoutDialog(show: Boolean) {
        _uiState.value = _uiState.value.copy(showLogoutDialog = show)
    }

    fun logout() {
        authRepo.logout()
        _uiState.value = _uiState.value.copy(showLogoutDialog = false, isLoggedOut = true)
    }
}
