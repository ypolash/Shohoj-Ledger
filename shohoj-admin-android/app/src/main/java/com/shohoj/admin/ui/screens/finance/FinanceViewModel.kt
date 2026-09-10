package com.shohoj.admin.ui.screens.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.FinancialReportResponse
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class FinanceUiState(
    val isLoading: Boolean = true,
    val selectedPeriod: String = "all", // "month", "quarter", "year", "all"
    val reportData: FinancialReportResponse? = null,
    val errorMessage: String? = null
)

class FinanceViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(FinanceUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadReport()
    }

    fun onPeriodChange(period: String) {
        _uiState.value = _uiState.value.copy(selectedPeriod = period)
        loadReport()
    }

    fun loadReport() {
        val period = _uiState.value.selectedPeriod

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            val result = repository.getFinancialReport(period = period)
            result.fold(
                onSuccess = { data ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        reportData = data,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load financial report."
                    )
                }
            )
        }
    }
}
