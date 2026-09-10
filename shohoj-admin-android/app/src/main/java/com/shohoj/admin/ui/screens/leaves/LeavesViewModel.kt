package com.shohoj.admin.ui.screens.leaves

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.LeaveCounts
import com.shohoj.admin.data.model.LeaveItem
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class LeavesUiState(
    val isLoading: Boolean = true,
    val selectedStatus: String = "ALL",
    val searchQuery: String = "",
    val leaves: List<LeaveItem> = emptyList(),
    val counts: LeaveCounts? = null,
    val selectedLeave: LeaveItem? = null,
    val errorMessage: String? = null
)

class LeavesViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(LeavesUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadLeaves()
    }

    fun onStatusFilterChange(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadLeaves()
    }

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadLeaves()
    }

    fun selectLeave(leave: LeaveItem?) {
        _uiState.value = _uiState.value.copy(selectedLeave = leave)
    }

    fun loadLeaves() {
        val status = if (_uiState.value.selectedStatus == "ALL") null else _uiState.value.selectedStatus
        val search = _uiState.value.searchQuery.ifBlank { null }

        viewModelScope.launch {
            val result = repository.getLeaves(status = status, search = search)
            result.fold(
                onSuccess = { response ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        leaves = response.leaves,
                        counts = response.counts,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load leave requests."
                    )
                }
            )
        }
    }
}
