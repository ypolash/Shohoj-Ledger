package com.shohoj.admin.ui.screens.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val currentServerUrl: String = "",
    val showServerDialog: Boolean = false
)

class LoginViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(
        LoginUiState(currentServerUrl = repository.sessionManager.baseUrl)
    )
    val uiState = _uiState.asStateFlow()

    fun onEmailChange(newEmail: String) {
        _uiState.value = _uiState.value.copy(email = newEmail, errorMessage = null)
    }

    fun onPasswordChange(newPassword: String) {
        _uiState.value = _uiState.value.copy(password = newPassword, errorMessage = null)
    }

    fun openServerDialog() {
        _uiState.value = _uiState.value.copy(
            showServerDialog = true,
            currentServerUrl = repository.sessionManager.baseUrl
        )
    }

    fun closeServerDialog() {
        _uiState.value = _uiState.value.copy(showServerDialog = false)
    }

    fun updateServerUrl(url: String) {
        repository.sessionManager.baseUrl = url
        _uiState.value = _uiState.value.copy(
            currentServerUrl = repository.sessionManager.baseUrl,
            showServerDialog = false
        )
    }

    fun login(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter both email and password.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val result = repository.login(state.email, state.password)
            result.fold(
                onSuccess = {
                    _uiState.value = _uiState.value.copy(isLoading = false)
                    onSuccess()
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Login failed. Please check credentials."
                    )
                }
            )
        }
    }
}
