package com.shohoj.admin.data.model

import com.google.gson.annotations.SerializedName

// --- Authentication ---

data class LoginRequest(
    val email: String = "",
    val password: String = ""
)

data class LoginResponse(
    val success: Boolean = false,
    val token: String? = null,
    val user: AdminUser? = null,
    val company: AdminCompany? = null,
    val error: String? = null
)

data class AdminUser(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val role: String = "",
    val platformRole: String? = null
)

data class AdminCompany(
    val id: String = "",
    val name: String = "",
    val businessType: String = "",
    val logoUrl: String? = null
)

// --- Dashboard ---

data class DashboardResponse(
    val success: Boolean = false,
    val company: AdminCompany? = null,
    val user: AdminUser? = null,
    val attendanceStats: AttendanceStats? = null,
    val financialSummary: FinancialSummary? = null,
    val projectStats: ProjectStats? = null,
    val leadStats: LeadStats? = null,
    val pendingLeavesCount: Int = 0,
    val recentPunches: List<RecentPunch>? = null,
    val error: String? = null
) {
    val safeCompany: AdminCompany get() = company ?: AdminCompany()
    val safeUser: AdminUser get() = user ?: AdminUser()
    val safeAttendanceStats: AttendanceStats get() = attendanceStats ?: AttendanceStats()
    val safeFinancialSummary: FinancialSummary get() = financialSummary ?: FinancialSummary()
    val safeProjectStats: ProjectStats get() = projectStats ?: ProjectStats()
    val safeLeadStats: LeadStats get() = leadStats ?: LeadStats()
    val safeRecentPunches: List<RecentPunch> get() = recentPunches ?: emptyList()
}

data class AttendanceStats(
    val totalActiveEmployees: Int = 0,
    val presentToday: Int = 0,
    val lateToday: Int = 0,
    val absentToday: Int = 0,
    val halfDayToday: Int = 0,
    val unmarkedToday: Int = 0
)

data class FinancialSummary(
    val totalIncome: Double = 0.0,
    val totalExpense: Double = 0.0,
    val netProfit: Double = 0.0
)

data class ProjectStats(
    val total: Int = 0,
    val active: Int = 0,
    val completed: Int = 0
)

data class LeadStats(
    val total: Int = 0,
    val newLeads: Int = 0,
    val wonLeads: Int = 0
)

data class RecentPunch(
    val id: String = "",
    val employeeName: String = "",
    val employeeId: String = "",
    val designation: String = "",
    val status: String = "",
    val isLate: Boolean = false,
    val lateMinutes: Int = 0,
    val checkInTime: String? = null,
    val checkOutTime: String? = null
)

// --- Employees ---

data class EmployeesResponse(
    val success: Boolean = false,
    val count: Int = 0,
    val employees: List<EmployeeItem>? = null,
    val error: String? = null
) {
    val safeEmployees: List<EmployeeItem> get() = employees ?: emptyList()
}

data class EmployeeItem(
    val id: String = "",
    val employeeId: String = "",
    val name: String = "",
    val firstName: String = "",
    val lastName: String = "",
    val email: String = "",
    val phone: String? = null,
    val designation: String = "",
    val department: String = "",
    val status: String = "",
    val basicSalary: Double = 0.0,
    val joiningDate: String? = null,
    val employmentType: String? = null,
    val gender: String? = null,
    val address: String? = null,
    val emergencyContact: String? = null,
    val emergencyPhone: String? = null,
    val reportingManager: String? = null,
    val createdAt: String = ""
)

// --- Attendance Roster ---

data class AttendanceRosterResponse(
    val success: Boolean = false,
    val date: String = "",
    val stats: AttendanceStats? = null,
    val roster: List<AttendanceRosterItem>? = null,
    val error: String? = null
) {
    val safeStats: AttendanceStats get() = stats ?: AttendanceStats()
    val safeRoster: List<AttendanceRosterItem> get() = roster ?: emptyList()
}

data class AttendanceRosterItem(
    val employeeDbId: String = "",
    val employeeId: String = "",
    val name: String = "",
    val designation: String = "",
    val department: String = "",
    val status: String = "",
    val isLate: Boolean = false,
    val lateMinutes: Int = 0,
    val checkInTime: String? = null,
    val checkOutTime: String? = null,
    val locationNote: String? = null
)

// --- Projects ---

data class ProjectsResponse(
    val success: Boolean = false,
    val count: Int = 0,
    val projects: List<ProjectItem>? = null,
    val error: String? = null
) {
    val safeProjects: List<ProjectItem> get() = projects ?: emptyList()
}

data class ProjectItem(
    val id: String = "",
    val projectCode: String = "",
    val name: String = "",
    val companyName: String = "",
    val clientName: String = "",
    val clientContact: String? = null,
    val clientPhone: String? = null,
    val clientEmail: String? = null,
    val description: String = "",
    val status: String = "",
    val priority: String = "",
    val budget: Double = 0.0,
    val progress: Int = 0,
    val startDate: String? = null,
    val endDate: String? = null,
    val managerName: String = "",
    val teamMembersCount: Int = 0,
    val teamMembers: List<TeamMemberItem>? = null,
    val totalTasks: Int = 0,
    val completedTasks: Int = 0,
    val createdAt: String = ""
) {
    val safeTeamMembers: List<TeamMemberItem> get() = teamMembers ?: emptyList()
}

data class TeamMemberItem(
    val id: String = "",
    val name: String = "",
    val employeeId: String = "",
    val designation: String? = null
)

// --- Leads ---

data class LeadsResponse(
    val success: Boolean = false,
    val counts: LeadCounts? = null,
    val leads: List<LeadItem>? = null,
    val error: String? = null
) {
    val safeCounts: LeadCounts get() = counts ?: LeadCounts()
    val safeLeads: List<LeadItem> get() = leads ?: emptyList()
}

data class LeadCounts(
    val ALL: Int = 0,
    val NEW: Int = 0,
    val CONTACTED: Int = 0,
    val QUALIFIED: Int = 0,
    val PROPOSAL: Int = 0,
    val WON: Int = 0,
    val LOST: Int = 0
)

data class LeadItem(
    val id: String = "",
    val companyName: String = "",
    val contactPerson: String = "",
    val email: String = "",
    val phone: String = "",
    val serviceType: String = "",
    val leadSource: String = "",
    val status: String = "",
    val priority: String = "",
    val estimatedValue: Double = 0.0,
    val assignedTo: String = "",
    val notes: String = "",
    val createdAt: String = "",
    val updatedAt: String = ""
)

// --- Financial Reports ---

data class FinancialReportResponse(
    val success: Boolean = false,
    val period: String = "all",
    val profitAndLoss: ProfitLossReport? = null,
    val balanceSheet: BalanceSheetReport? = null,
    val cashFlow: CashFlowReport? = null,
    val error: String? = null
) {
    val safeProfitAndLoss: ProfitLossReport get() = profitAndLoss ?: ProfitLossReport()
    val safeBalanceSheet: BalanceSheetReport get() = balanceSheet ?: BalanceSheetReport()
    val safeCashFlow: CashFlowReport get() = cashFlow ?: CashFlowReport()
}

data class ProfitLossReport(
    val totalIncome: Double = 0.0,
    val totalExpense: Double = 0.0,
    val netProfit: Double = 0.0,
    val profitMarginPercent: Double = 0.0,
    val isProfitable: Boolean = false,
    val topIncomeCategories: List<CategoryAmount>? = null,
    val topExpenseCategories: List<CategoryAmount>? = null
) {
    val safeTopIncomeCategories: List<CategoryAmount> get() = topIncomeCategories ?: emptyList()
    val safeTopExpenseCategories: List<CategoryAmount> get() = topExpenseCategories ?: emptyList()
}

data class CategoryAmount(
    val category: String = "",
    val amount: Double = 0.0
)

data class BalanceSheetReport(
    val totalAssets: Double = 0.0,
    val totalLiabilities: Double = 0.0,
    val netEquity: Double = 0.0
)

data class CashFlowReport(
    val cashIn: Double = 0.0,
    val cashOut: Double = 0.0,
    val netCashFlow: Double = 0.0
)

// --- Leaves ---

data class LeavesResponse(
    val success: Boolean = false,
    val counts: LeaveCounts? = null,
    val leaves: List<LeaveItem>? = null,
    val error: String? = null
) {
    val safeCounts: LeaveCounts get() = counts ?: LeaveCounts()
    val safeLeaves: List<LeaveItem> get() = leaves ?: emptyList()
}

data class LeaveCounts(
    val ALL: Int = 0,
    val PENDING: Int = 0,
    val APPROVED: Int = 0,
    val REJECTED: Int = 0
)

data class LeaveItem(
    val id: String = "",
    val employeeDbId: String = "",
    val employeeId: String = "",
    val employeeName: String = "",
    val designation: String = "",
    val department: String = "",
    val type: String = "",
    val startDate: String = "",
    val endDate: String = "",
    val durationDays: Int = 0,
    val reason: String = "",
    val status: String = "",
    val appliedAt: String = ""
)
