package com.shohoj.admin.ui.screens.leads

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.LeadCounts
import com.shohoj.admin.data.model.LeadItem
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LeadsUiState(
    val isLoading: Boolean = true,
    val searchQuery: String = "",
    val selectedStatus: String = "ALL",
    val leads: List<LeadItem> = emptyList(),
    val counts: LeadCounts? = null,
    val selectedLead: LeadItem? = null,
    val errorMessage: String? = null
)

class LeadsViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(LeadsUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadLeads()
    }

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadLeads()
    }

    fun onStatusFilterChange(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadLeads()
    }

    fun selectLead(lead: LeadItem?) {
        _uiState.value = _uiState.value.copy(selectedLead = lead)
    }

    fun loadLeads() {
        val query = _uiState.value.searchQuery.ifBlank { null }
        val status = if (_uiState.value.selectedStatus == "ALL") null else _uiState.value.selectedStatus

        viewModelScope.launch {
            val result = repository.getLeads(search = query, status = status)
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        leads = response.leads,
                        counts = response.counts,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load leads."
                    )
                }
            )
        }
    }
}
