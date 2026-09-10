package com.shohoj.admin.data.model

import com.google.gson.annotations.SerializedName

// --- Authentication ---

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val token: String?,
    val user: AdminUser?,
    val company: AdminCompany?,
    val error: String?
)

data class AdminUser(
    val id: String,
    val name: String,
    val email: String,
    val role: String,
    val platformRole: String?
)

data class AdminCompany(
    val id: String,
    val name: String,
    val businessType: String,
    val logoUrl: String?
)

// --- Dashboard ---

data class DashboardResponse(
    val success: Boolean,
    val company: AdminCompany,
    val user: AdminUser,
    val attendanceStats: AttendanceStats,
    val financialSummary: FinancialSummary,
    val projectStats: ProjectStats,
    val leadStats: LeadStats,
    val pendingLeavesCount: Int,
    val recentPunches: List<RecentPunch>,
    val error: String?
)

data class AttendanceStats(
    val totalActiveEmployees: Int,
    val presentToday: Int,
    val lateToday: Int,
    val absentToday: Int,
    val halfDayToday: Int,
    val unmarkedToday: Int
)

data class FinancialSummary(
    val totalIncome: Double,
    val totalExpense: Double,
    val netProfit: Double
)

data class ProjectStats(
    val total: Int,
    val active: Int,
    val completed: Int
)

data class LeadStats(
    val total: Int,
    val newLeads: Int,
    val wonLeads: Int
)

data class RecentPunch(
    val id: String,
    val employeeName: String,
    val employeeId: String,
    val designation: String,
    val status: String,
    val isLate: Boolean,
    val lateMinutes: Int,
    val checkInTime: String?,
    val checkOutTime: String?
)

// --- Employees ---

data class EmployeesResponse(
    val success: Boolean,
    val count: Int,
    val employees: List<EmployeeItem>,
    val error: String?
)

data class EmployeeItem(
    val id: String,
    val employeeId: String,
    val name: String,
    val firstName: String,
    val lastName: String,
    val email: String,
    val phone: String?,
    val designation: String,
    val department: String,
    val status: String,
    val basicSalary: Double,
    val joiningDate: String?,
    val employmentType: String?,
    val gender: String?,
    val address: String?,
    val emergencyContact: String?,
    val emergencyPhone: String?,
    val reportingManager: String?,
    val createdAt: String
)

// --- Attendance Roster ---

data class AttendanceRosterResponse(
    val success: Boolean,
    val date: String,
    val stats: AttendanceStats,
    val roster: List<AttendanceRosterItem>,
    val error: String?
)

data class AttendanceRosterItem(
    val employeeDbId: String,
    val employeeId: String,
    val name: String,
    val designation: String,
    val department: String,
    val status: String,
    val isLate: Boolean,
    val lateMinutes: Int,
    val checkInTime: String?,
    val checkOutTime: String?,
    val locationNote: String?
)

// --- Projects ---

data class ProjectsResponse(
    val success: Boolean,
    val count: Int,
    val projects: List<ProjectItem>,
    val error: String?
)

data class ProjectItem(
    val id: String,
    val projectCode: String,
    val name: String,
    val companyName: String,
    val clientName: String,
    val clientContact: String?,
    val clientPhone: String?,
    val clientEmail: String?,
    val description: String,
    val status: String,
    val priority: String,
    val budget: Double,
    val progress: Int,
    val startDate: String?,
    val endDate: String?,
    val managerName: String,
    val teamMembersCount: Int,
    val teamMembers: List<TeamMemberItem>,
    val totalTasks: Int,
    val completedTasks: Int,
    val createdAt: String
)

data class TeamMemberItem(
    val id: String,
    val name: String,
    val employeeId: String,
    val designation: String?
)

// --- Leads ---

data class LeadsResponse(
    val success: Boolean,
    val counts: LeadCounts,
    val leads: List<LeadItem>,
    val error: String?
)

data class LeadCounts(
    val ALL: Int,
    val NEW: Int,
    val CONTACTED: Int,
    val QUALIFIED: Int,
    val PROPOSAL: Int,
    val WON: Int,
    val LOST: Int
)

data class LeadItem(
    val id: String,
    val companyName: String,
    val contactPerson: String,
    val email: String,
    val phone: String,
    val serviceType: String,
    val leadSource: String,
    val status: String,
    val priority: String,
    val estimatedValue: Double,
    val assignedTo: String,
    val notes: String,
    val createdAt: String,
    val updatedAt: String
)

// --- Financial Reports ---

data class FinancialReportResponse(
    val success: Boolean,
    val period: String,
    val profitAndLoss: ProfitLossReport,
    val balanceSheet: BalanceSheetReport,
    val cashFlow: CashFlowReport,
    val error: String?
)

data class ProfitLossReport(
    val totalIncome: Double,
    val totalExpense: Double,
    val netProfit: Double,
    val profitMarginPercent: Double,
    val isProfitable: Boolean,
    val topIncomeCategories: List<CategoryAmount>,
    val topExpenseCategories: List<CategoryAmount>
)

data class CategoryAmount(
    val category: String,
    val amount: Double
)

data class BalanceSheetReport(
    val totalAssets: Double,
    val totalLiabilities: Double,
    val netEquity: Double
)

data class CashFlowReport(
    val cashIn: Double,
    val cashOut: Double,
    val netCashFlow: Double
)

// --- Leaves ---

data class LeavesResponse(
    val success: Boolean,
    val counts: LeaveCounts,
    val leaves: List<LeaveItem>,
    val error: String?
)

data class LeaveCounts(
    val ALL: Int,
    val PENDING: Int,
    val APPROVED: Int,
    val REJECTED: Int
)

data class LeaveItem(
    val id: String,
    val employeeDbId: String,
    val employeeId: String,
    val employeeName: String,
    val designation: String,
    val department: String,
    val type: String,
    val startDate: String,
    val endDate: String,
    val durationDays: Int,
    val reason: String,
    val status: String,
    val appliedAt: String
)
