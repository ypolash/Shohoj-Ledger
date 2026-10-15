package com.shohoj.staff.ui.screens.fines

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.FineItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FineUiState(
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val fines: List<FineItem> = emptyList(),
    val selectedFineForConsideration: FineItem? = null,
    val error: String? = null,
    val successMessage: String? = null
)

class FineViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as ShohojStaffApp
    private val fineRepo = app.fineRepository

    private val _uiState = MutableStateFlow(FineUiState())
    val uiState: StateFlow<FineUiState> = _uiState.asStateFlow()

    init {
        loadFines()
    }

    fun loadFines() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            val result = fineRepo.getFines()

            result.fold(
                onSuccess = { finesList ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        fines = finesList
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = ex.localizedMessage ?: "Failed to fetch fine records"
                    )
                }
            )
        }
    }

    fun selectFineForConsideration(fine: FineItem?) {
        _uiState.value = _uiState.value.copy(selectedFineForConsideration = fine)
    }

    fun submitConsiderationRequest(fineId: String, reason: String) {
        if (reason.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "Please provide a reason for consideration")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, error = null)
            val result = fineRepo.requestConsideration(fineId, reason.trim())

            result.fold(
                onSuccess = { updatedFine ->
                    val updatedList = _uiState.value.fines.map {
                        if (it.id == updatedFine.id) updatedFine else it
                    }
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        fines = updatedList,
                        selectedFineForConsideration = null,
                        successMessage = "Consideration request submitted successfully"
                    )
                },
                onFailure = { ex ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = ex.localizedMessage ?: "Failed to submit consideration request"
                    )
                }
            )
        }
    }

    fun clearMessages() {
        _uiState.value = _uiState.value.copy(error = null, successMessage = null)
    }
}
