package com.shohoj.staff.ui.screens.fines

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.data.model.FineItem
import com.shohoj.staff.ui.components.*
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun FineScreen(
    onNavigate: (String) -> Unit,
    onNavigateBack: () -> Unit = {},
    viewModel: FineViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var considerationReasonText by remember { mutableStateOf("") }
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.successMessage) {
        uiState.successMessage?.let { msg ->
            snackbarHostState.showSnackbar(msg)
            viewModel.clearMessages()
        }
    }

    LaunchedEffect(uiState.error) {
        uiState.error?.let { err ->
            snackbarHostState.showSnackbar(err)
            viewModel.clearMessages()
        }
    }

    val calendarDays = remember(uiState.fines, uiState.selectedMonthCal) {
        viewModel.getCalendarDays()
    }
    val filteredFines = remember(uiState.fines, uiState.selectedDate) {
        viewModel.getFilteredFines()
    }
    val groupedFines = remember(filteredFines) {
        viewModel.getGroupedFines()
    }

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "My Fines & Penalties",
                subtitle = "Overview of deductions & consideration",
                actions = {
                    IconButton(onClick = { onNavigate(Screen.Home.route) }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Slate300)
                    }
                }
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Home.route,
                onNavigate = onNavigate
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Slate950
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Overview Summary Banner Card
            item {
                val totalAmount = uiState.fines
                    .filter { it.status != "CANCELLED" }
                    .sumOf { it.amount }
                val pendingCount = uiState.fines.count { it.status == "PENDING" }
                val reviewCount = uiState.fines.count { it.status == "CONSIDERATION_REQUESTED" }
                val cancelledCount = uiState.fines.count { it.status == "CANCELLED" }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            brush = Brush.linearGradient(
                                listOf(
                                    Color(0xFF2A1215), // Deep dark crimson
                                    Color(0xFF1E1520),
                                    Slate900
                                )
                            ),
                            shape = RoundedCornerShape(20.dp)
                        )
                        .border(
                            1.dp,
                            Rose500.copy(alpha = 0.35f),
                            RoundedCornerShape(20.dp)
                        )
                        .padding(18.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(46.dp)
                                        .background(Rose500.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                        .border(1.dp, Rose500.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Gavel,
                                        contentDescription = null,
                                        tint = Rose400,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }
                                Column {
                                    Text(
                                        text = "Active Penalties",
                                        fontSize = 12.sp,
                                        color = Rose300,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = "৳${totalAmount.toInt()}",
                                        fontSize = 26.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = Slate50
                                    )
                                }
                            }

                            // Refresh button
                            IconButton(
                                onClick = { viewModel.loadFines() },
                                modifier = Modifier
                                    .size(38.dp)
                                    .background(Slate800.copy(alpha = 0.7f), RoundedCornerShape(10.dp))
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Refresh",
                                    tint = Slate200,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }

                        // Status metric counter boxes
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Slate900.copy(alpha = 0.8f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Slate800, RoundedCornerShape(10.dp))
                                    .padding(vertical = 10.dp, horizontal = 12.dp)
                            ) {
                                Column {
                                    Text(text = "Pending", fontSize = 11.sp, color = Amber400, fontWeight = FontWeight.SemiBold)
                                    Text(text = "$pendingCount", fontSize = 16.sp, color = Slate100, fontWeight = FontWeight.Bold)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Slate900.copy(alpha = 0.8f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Slate800, RoundedCornerShape(10.dp))
                                    .padding(vertical = 10.dp, horizontal = 12.dp)
                            ) {
                                Column {
                                    Text(text = "In Review", fontSize = 11.sp, color = Cyan400, fontWeight = FontWeight.SemiBold)
                                    Text(text = "$reviewCount", fontSize = 16.sp, color = Slate100, fontWeight = FontWeight.Bold)
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(Slate900.copy(alpha = 0.8f), RoundedCornerShape(10.dp))
                                    .border(1.dp, Slate800, RoundedCornerShape(10.dp))
                                    .padding(vertical = 10.dp, horizontal = 12.dp)
                            ) {
                                Column {
                                    Text(text = "Waived", fontSize = 11.sp, color = Emerald400, fontWeight = FontWeight.SemiBold)
                                    Text(text = "$cancelledCount", fontSize = 16.sp, color = Slate100, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // 2. Horizontal Calendar View
            item {
                HorizontalCalendarSection(
                    days = calendarDays,
                    selectedDate = uiState.selectedDate,
                    selectedMonthCal = uiState.selectedMonthCal,
                    totalFinesCount = uiState.fines.size,
                    onSelectDate = { dateKey -> viewModel.selectDate(dateKey) },
                    onPrevMonth = { viewModel.previousMonth() },
                    onNextMonth = { viewModel.nextMonth() },
                    onTodayClick = { viewModel.jumpToToday() }
                )
            }

            // 3. Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (uiState.selectedDate != null) {
                        Column {
                            Text(
                                text = "Fines on ${DateUtils.formatDate(uiState.selectedDate)} (${filteredFines.size})",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate100,
                                    fontSize = 15.sp
                                )
                            )
                            Text(
                                text = "Filtered date view",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Rose300,
                                    fontSize = 11.sp
                                )
                            )
                        }
                        TextButton(
                            onClick = { viewModel.clearDateFilter() },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "Show All",
                                color = Emerald400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        Column {
                            Text(
                                text = "Fine History (${uiState.fines.size})",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate100,
                                    fontSize = 16.sp
                                )
                            )
                            Text(
                                text = "Date-wise overview",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Slate400,
                                    fontSize = 11.sp
                                )
                            )
                        }
                        Text(
                            text = "Tap to request consideration",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate400,
                                fontSize = 11.5.sp
                            )
                        )
                    }
                }
            }

            // Loading State
            if (uiState.isLoading && uiState.fines.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = Rose400)
                    }
                }
            }

            // Overall Empty State
            if (!uiState.isLoading && uiState.fines.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Slate900, RoundedCornerShape(16.dp))
                            .border(1.dp, Slate800, RoundedCornerShape(16.dp))
                            .padding(40.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Emerald400,
                                modifier = Modifier.size(44.dp)
                            )
                            Text(
                                text = "Clean Record!",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate200
                                )
                            )
                            Text(
                                text = "No fines or disciplinary penalties registered against your account.",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Slate400,
                                    fontSize = 12.sp
                                )
                            )
                        }
                    }
                }
            }

            // Date-Filter Empty State (when a specific date has no fines)
            if (!uiState.isLoading && uiState.fines.isNotEmpty() && filteredFines.isEmpty() && uiState.selectedDate != null) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Slate900.copy(alpha = 0.7f), RoundedCornerShape(16.dp))
                            .border(1.dp, Slate800, RoundedCornerShape(16.dp))
                            .padding(28.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.EventAvailable,
                                contentDescription = null,
                                tint = Emerald400,
                                modifier = Modifier.size(36.dp)
                            )
                            Text(
                                text = "No Fines on this Date",
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate200,
                                    fontSize = 15.sp
                                )
                            )
                            Text(
                                text = "No penalties or disciplinary records logged for ${DateUtils.formatDate(uiState.selectedDate)}.",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = Slate400,
                                    fontSize = 12.sp
                                )
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Button(
                                onClick = { viewModel.clearDateFilter() },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Slate800,
                                    contentColor = Slate100
                                ),
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Text(text = "View All Fines", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }

            // 4. Date-wise Fines Display
            if (uiState.selectedDate != null) {
                // Filtered by specific date
                items(filteredFines, key = { it.id }) { fine ->
                    FineCardItem(
                        fine = fine,
                        onSelectForConsideration = { selected ->
                            considerationReasonText = selected.appealReason ?: ""
                            viewModel.selectFineForConsideration(selected)
                        }
                    )
                }
            } else {
                // Grouped Date-wise List
                groupedFines.forEach { (dateKey, finesForDate) ->
                    item(key = "header_$dateKey") {
                        FineDateGroupHeader(
                            dateKey = dateKey,
                            finesCount = finesForDate.size,
                            totalAmount = finesForDate.sumOf { it.amount }
                        )
                    }

                    items(finesForDate, key = { it.id }) { fine ->
                        FineCardItem(
                            fine = fine,
                            onSelectForConsideration = { selected ->
                                considerationReasonText = selected.appealReason ?: ""
                                viewModel.selectFineForConsideration(selected)
                            }
                        )
                    }
                }
            }
        }
    }

    // Interactive Consideration Request Dialog Box
    val selectedFine = uiState.selectedFineForConsideration
    if (selectedFine != null) {
        AlertDialog(
            onDismissRequest = {
                if (!uiState.isSubmitting) {
                    viewModel.selectFineForConsideration(null)
                }
            },
            containerColor = Slate900,
            titleContentColor = Slate50,
            textContentColor = Slate300,
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Feedback,
                        contentDescription = null,
                        tint = Amber400,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = "Request Fine Consideration",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    // Fine Details Card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF1E1520), RoundedCornerShape(10.dp))
                            .border(1.dp, Rose500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Penalty Amount:",
                                    fontSize = 12.sp,
                                    color = Slate400
                                )
                                Text(
                                    text = "৳${selectedFine.amount.toInt()}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Rose400
                                )
                            }
                            Text(
                                text = selectedFine.reason ?: "Disciplinary penalty",
                                fontSize = 12.5.sp,
                                color = Slate200
                            )
                        }
                    }

                    Text(
                        text = "Explain the circumstances or valid reason to management/HR (e.g., severe traffic delay, approved emergency, system issue):",
                        fontSize = 12.sp,
                        color = Slate400
                    )

                    OutlinedTextField(
                        value = considerationReasonText,
                        onValueChange = { considerationReasonText = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp),
                        placeholder = {
                            Text(
                                text = "Enter explanation for consideration request...",
                                fontSize = 13.sp,
                                color = Slate500
                            )
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Amber400,
                            unfocusedBorderColor = Slate700,
                            focusedTextColor = Slate100,
                            unfocusedTextColor = Slate200,
                            cursorColor = Amber400
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.submitConsiderationRequest(selectedFine.id, considerationReasonText)
                    },
                    enabled = !uiState.isSubmitting && considerationReasonText.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Amber500,
                        contentColor = Slate950
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    if (uiState.isSubmitting) {
                        CircularProgressIndicator(
                            color = Slate950,
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Submitting...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    } else {
                        Text(text = "Submit Request", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        viewModel.selectFineForConsideration(null)
                    },
                    enabled = !uiState.isSubmitting
                ) {
                    Text(text = "Cancel", color = Slate400, fontSize = 13.sp)
                }
            }
        )
    }
}

/**
 * Horizontal Calendar Strip View
 */
@Composable
fun HorizontalCalendarSection(
    days: List<CalendarDay>,
    selectedDate: String?,
    selectedMonthCal: Calendar,
    totalFinesCount: Int,
    onSelectDate: (String?) -> Unit,
    onPrevMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onTodayClick: () -> Unit
) {
    val monthName = remember(selectedMonthCal) {
        SimpleDateFormat("MMMM yyyy", Locale.getDefault()).format(selectedMonthCal.time)
    }
    val listState = rememberLazyListState()

    // Auto-scroll to selected day, or today, or first day with fine
    LaunchedEffect(selectedMonthCal, selectedDate) {
        val targetIndex = if (selectedDate != null) {
            days.indexOfFirst { it.dateKey == selectedDate }
        } else {
            days.indexOfFirst { it.isToday }.takeIf { it >= 0 }
                ?: days.indexOfFirst { it.fineCount > 0 }.takeIf { it >= 0 }
                ?: 0
        }
        if (targetIndex >= 0) {
            val scrollPos = (targetIndex - 2).coerceAtLeast(0)
            listState.animateScrollToItem(scrollPos)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Slate900.copy(alpha = 0.8f), RoundedCornerShape(18.dp))
            .border(1.dp, Slate800, RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Month Navigation Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                IconButton(
                    onClick = onPrevMonth,
                    modifier = Modifier.size(30.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowLeft,
                        contentDescription = "Previous Month",
                        tint = Slate300,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Text(
                    text = monthName,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Slate100,
                        fontSize = 15.sp
                    )
                )

                IconButton(
                    onClick = onNextMonth,
                    modifier = Modifier.size(30.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowRight,
                        contentDescription = "Next Month",
                        tint = Slate300,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            // Quick Filter Pills: All / Today
            Row(
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(99.dp))
                        .background(
                            if (selectedDate == null) Emerald600 else Slate800
                        )
                        .clickable { onSelectDate(null) }
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = if (totalFinesCount > 0) "All ($totalFinesCount)" else "All",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selectedDate == null) Slate50 else Slate300
                    )
                }

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(99.dp))
                        .background(Slate800)
                        .clickable { onTodayClick() }
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = "Today",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Medium,
                        color = Slate300
                    )
                }
            }
        }

        // Horizontal Days Strip
        LazyRow(
            state = listState,
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 2.dp)
        ) {
            items(days, key = { it.dateKey }) { day ->
                val isSelected = selectedDate == day.dateKey
                val hasFines = day.fineCount > 0

                Box(
                    modifier = Modifier
                        .width(54.dp)
                        .height(82.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            when {
                                isSelected -> Brush.verticalGradient(
                                    listOf(
                                        Color(0xFF4A1A28), // Glow Rose/Dark Wine
                                        Color(0xFF24101A)
                                    )
                                )
                                hasFines -> Brush.verticalGradient(
                                    listOf(
                                        Color(0xFF2C131D),
                                        Slate900
                                    )
                                )
                                day.isToday -> Brush.verticalGradient(
                                    listOf(
                                        Color(0xFF112920),
                                        Slate900
                                    )
                                )
                                else -> Brush.verticalGradient(
                                    listOf(
                                        Slate900,
                                        Slate950
                                    )
                                )
                            }
                        )
                        .border(
                            width = if (isSelected) 1.5.dp else 1.dp,
                            color = when {
                                isSelected -> Rose400
                                hasFines -> Rose500.copy(alpha = 0.6f)
                                day.isToday -> Emerald500.copy(alpha = 0.5f)
                                else -> Slate800
                            },
                            shape = RoundedCornerShape(14.dp)
                        )
                        .clickable {
                            onSelectDate(day.dateKey)
                        }
                        .padding(vertical = 8.dp, horizontal = 4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxHeight()
                    ) {
                        Text(
                            text = day.dayOfWeek.uppercase(),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = when {
                                isSelected -> Rose300
                                hasFines -> Rose400
                                day.isToday -> Emerald400
                                else -> Slate400
                            }
                        )

                        Text(
                            text = "${day.dayNumber}",
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = when {
                                isSelected -> Slate50
                                hasFines -> Slate100
                                day.isToday -> Emerald300
                                else -> Slate300
                            }
                        )

                        // Bottom Indicator: Fine Amount Badge or Today Dot
                        if (hasFines) {
                            Box(
                                modifier = Modifier
                                    .background(
                                        Rose500.copy(alpha = 0.35f),
                                        RoundedCornerShape(4.dp)
                                    )
                                    .padding(horizontal = 4.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "৳${day.totalFineAmount.toInt()}",
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    color = Rose300
                                )
                            }
                        } else if (day.isToday) {
                            Box(
                                modifier = Modifier
                                    .size(5.dp)
                                    .background(Emerald400, RoundedCornerShape(99.dp))
                            )
                        } else {
                            Spacer(modifier = Modifier.height(6.dp))
                        }
                    }
                }
            }
        }
    }
}

/**
 * Date Group Header
 */
@Composable
fun FineDateGroupHeader(
    dateKey: String,
    finesCount: Int,
    totalAmount: Double
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp, bottom = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(Rose500.copy(alpha = 0.15f), RoundedCornerShape(6.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    tint = Rose400,
                    modifier = Modifier.size(13.dp)
                )
            }
            Text(
                text = DateUtils.formatDateHeader(dateKey),
                fontSize = 13.5.sp,
                fontWeight = FontWeight.Bold,
                color = Slate200
            )
        }

        Box(
            modifier = Modifier
                .background(Slate900, RoundedCornerShape(99.dp))
                .border(1.dp, Slate800, RoundedCornerShape(99.dp))
                .padding(horizontal = 10.dp, vertical = 3.dp)
        ) {
            Text(
                text = "$finesCount ${if (finesCount == 1) "penalty" else "penalties"} • ৳${totalAmount.toInt()}",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Rose300
            )
        }
    }
}

/**
 * Single Fine Card Item
 */
@Composable
fun FineCardItem(
    fine: FineItem,
    onSelectForConsideration: (FineItem) -> Unit
) {
    val isUnderReview = fine.status == "CONSIDERATION_REQUESTED"
    val isCancelled = fine.status == "CANCELLED"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                if (isUnderReview) Color(0xFF131F2A)
                else if (isCancelled) Slate900.copy(alpha = 0.6f)
                else Slate900
            )
            .border(
                1.dp,
                if (isUnderReview) Cyan500.copy(alpha = 0.5f)
                else if (isCancelled) Slate800
                else Rose500.copy(alpha = 0.35f),
                RoundedCornerShape(16.dp)
            )
            .clickable(enabled = !isCancelled) {
                onSelectForConsideration(fine)
            }
            .padding(18.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header row: Amount & Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "৳${fine.amount.toInt()}",
                        style = MaterialTheme.typography.titleLarge.copy(
                            fontWeight = FontWeight.ExtraBold,
                            color = if (isCancelled) Emerald400 else Rose400,
                            fontSize = 19.sp
                        )
                    )
                    if (fine.date != null) {
                        Text(
                            text = "• ${DateUtils.formatDate(fine.date)}",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate400,
                                fontSize = 12.sp
                            )
                        )
                    }
                }

                // Status Badge
                val badgeStatus = when (fine.status) {
                    "CONSIDERATION_REQUESTED" -> "IN REVIEW"
                    "CANCELLED" -> "WAIVED"
                    "DEDUCTED" -> "DEDUCTED"
                    else -> "PENDING"
                }
                StatusBadge(status = badgeStatus)
            }

            // Reason
            Text(
                text = fine.reason ?: "Penalty fine",
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = Slate200,
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.5.sp,
                    lineHeight = 19.sp
                )
            )

            // If staff submitted a consideration request note, display it
            if (!fine.appealReason.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0F172A), RoundedCornerShape(10.dp))
                        .border(1.dp, Cyan500.copy(alpha = 0.3f), RoundedCornerShape(10.dp))
                        .padding(10.dp)
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Icon(
                            imageVector = Icons.Default.HourglassTop,
                            contentDescription = null,
                            tint = Cyan400,
                            modifier = Modifier.size(16.dp)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                text = "Your Consideration Request:",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Cyan300
                            )
                            Text(
                                text = fine.appealReason,
                                fontSize = 12.sp,
                                color = Slate300
                            )
                        }
                    }
                }
            }

            HorizontalDivider(color = Slate800, thickness = 0.5.dp)

            // Action Footer
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (fine.createdAt != null) "Logged: ${DateUtils.formatDate(fine.createdAt)}" else "",
                    fontSize = 11.sp,
                    color = Slate500
                )

                if (!isCancelled) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.clickable {
                            onSelectForConsideration(fine)
                        }
                    ) {
                        Icon(
                            imageVector = if (isUnderReview) Icons.Default.EditNote else Icons.Default.HelpOutline,
                            contentDescription = null,
                            tint = if (isUnderReview) Cyan400 else Amber400,
                            modifier = Modifier.size(15.dp)
                        )
                        Text(
                            text = if (isUnderReview) "Update Consideration" else "Request Consideration",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isUnderReview) Cyan300 else Amber300
                        )
                    }
                } else {
                    Text(
                        text = "Waived / Cancelled",
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.Bold,
                        color = Emerald400
                    )
                }
            }
        }
    }
}
