package com.shohoj.admin.ui.screens.projects

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shohoj.admin.data.model.ProjectItem
import com.shohoj.admin.data.repository.AdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ProjectsUiState(
    val isLoading: Boolean = true,
    val searchQuery: String = "",
    val selectedStatus: String = "ALL",
    val projects: List<ProjectItem> = emptyList(),
    val selectedProject: ProjectItem? = null,
    val errorMessage: String? = null
)

class ProjectsViewModel(private val repository: AdminRepository) : ViewModel() {

    private val _uiState = MutableStateFlow(ProjectsUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadProjects()
    }

    fun onSearchChange(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadProjects()
    }

    fun onStatusFilterChange(status: String) {
        _uiState.value = _uiState.value.copy(selectedStatus = status)
        loadProjects()
    }

    fun selectProject(project: ProjectItem?) {
        _uiState.value = _uiState.value.copy(selectedProject = project)
    }

    fun loadProjects() {
        val query = _uiState.value.searchQuery.ifBlank { null }
        val status = if (_uiState.value.selectedStatus == "ALL") null else _uiState.value.selectedStatus

        viewModelScope.launch {
            val result = repository.getProjects(search = query, status = status)
            result.fold(
                onSuccess = { list ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        projects = list,
                        errorMessage = null
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = error.message ?: "Failed to load projects."
                    )
                }
            )
        }
    }
}
