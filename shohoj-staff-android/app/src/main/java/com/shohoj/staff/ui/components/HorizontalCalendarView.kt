package com.shohoj.staff.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.data.model.AttendanceRecord
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils
import java.text.SimpleDateFormat
import java.util.*

data class CalendarDayItem(
    val dateKey: String,
    val dayName: String,
    val dayNumber: String,
    val monthName: String,
    val isToday: Boolean,
    val isWeekend: Boolean,
    val record: AttendanceRecord?
)

@Composable
fun HorizontalCalendarView(
    records: List<AttendanceRecord>,
    selectedDate: String?,
    onDateSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Current anchor calendar (defaults to today)
    var anchorCalendar by remember { mutableStateOf(Calendar.getInstance()) }

    val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US) }
    val dayNameFormat = remember { SimpleDateFormat("EEE", Locale.US) }
    val monthFormat = remember { SimpleDateFormat("MMM", Locale.US) }
    val headerMonthFormat = remember { SimpleDateFormat("MMMM yyyy", Locale.US) }

    val todayKey = remember { dateFormat.format(Date()) }

    // Map records by date key for quick lookup
    val recordsByDate = remember(records) {
        val map = mutableMapOf<String, AttendanceRecord>()
        records.forEach { record ->
            val key = DateUtils.extractDateKey(record.date ?: record.checkInTime)
            if (key.isNotBlank()) {
                map[key] = record
            }
        }
        map
    }

    // Generate a 15-day window centered on the anchor date (-7 days to +7 days)
    val days = remember(anchorCalendar, recordsByDate, todayKey) {
        val list = mutableListOf<CalendarDayItem>()
        val cal = anchorCalendar.clone() as Calendar
        cal.add(Calendar.DAY_OF_YEAR, -7)

        for (i in 0..14) {
            val key = dateFormat.format(cal.time)
            val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
            val isWeekend = dayOfWeek == Calendar.FRIDAY || dayOfWeek == Calendar.SATURDAY

            list.add(
                CalendarDayItem(
                    dateKey = key,
                    dayName = dayNameFormat.format(cal.time).uppercase(),
                    dayNumber = cal.get(Calendar.DAY_OF_MONTH).toString(),
                    monthName = monthFormat.format(cal.time).uppercase(),
                    isToday = key == todayKey,
                    isWeekend = isWeekend,
                    record = recordsByDate[key]
                )
            )
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        list
    }

    val currentHeaderTitle = remember(anchorCalendar) {
        headerMonthFormat.format(anchorCalendar.time)
    }

    val todayIndex = remember(days) {
        val idx = days.indexOfFirst { it.isToday }
        if (idx >= 0) idx else 0
    }

    val lazyListState = rememberLazyListState(initialFirstVisibleItemIndex = maxOf(0, todayIndex - 1))

    LaunchedEffect(anchorCalendar, todayKey, selectedDate) {
        val targetIdx = days.indexOfFirst { it.dateKey == (selectedDate ?: todayKey) }
        val scrollIdx = if (targetIdx >= 0) targetIdx else todayIndex
        lazyListState.animateScrollToItem(maxOf(0, scrollIdx - 1))
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(CardBackground, RoundedCornerShape(18.dp))
            .border(1.dp, CardBorder, RoundedCornerShape(18.dp))
            .padding(16.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
            // Header with Month, Navigation & Today button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CalendarMonth,
                        contentDescription = null,
                        tint = Emerald400,
                        modifier = Modifier.size(18.dp)
                    )
                    Text(
                        text = currentHeaderTitle,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Slate50
                        )
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Prev week
                    IconButton(
                        onClick = {
                            val newCal = anchorCalendar.clone() as Calendar
                            newCal.add(Calendar.DAY_OF_YEAR, -7)
                            anchorCalendar = newCal
                        },
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ChevronLeft,
                            contentDescription = "Previous week",
                            tint = Slate400,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Jump Today Button
                    TextButton(
                        onClick = {
                            anchorCalendar = Calendar.getInstance()
                            onDateSelected(todayKey)
                        },
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text(
                            text = "Today",
                            color = if (selectedDate == todayKey) Emerald400 else Slate300,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    // Next week
                    IconButton(
                        onClick = {
                            val newCal = anchorCalendar.clone() as Calendar
                            newCal.add(Calendar.DAY_OF_YEAR, 7)
                            anchorCalendar = newCal
                        },
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = "Next week",
                            tint = Slate400,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Horizontal Scrollable Date Ribbon (zero clunky scrollbars)
            LazyRow(
                state = lazyListState,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(days, key = { it.dateKey }) { item ->
                    val isSelected = selectedDate == item.dateKey

                    val cardBg = when {
                        isSelected -> Emerald500.copy(alpha = 0.2f)
                        item.isWeekend -> Slate900.copy(alpha = 0.6f)
                        else -> Slate900
                    }

                    val borderColor = when {
                        isSelected -> Emerald400
                        item.isToday -> Blue400.copy(alpha = 0.6f)
                        else -> CardBorder
                    }

                    Box(
                        modifier = Modifier
                            .width(62.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(cardBg)
                            .border(1.dp, borderColor, RoundedCornerShape(12.dp))
                            .clickable { onDateSelected(item.dateKey) }
                            .padding(vertical = 10.dp, horizontal = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            // "Today" micro badge
                            if (item.isToday) {
                                Box(
                                    modifier = Modifier
                                        .background(Emerald500, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 4.dp, vertical = 1.dp)
                                ) {
                                    Text(
                                        text = "TODAY",
                                        color = Color.White,
                                        fontSize = 8.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            } else {
                                Text(
                                    text = item.dayName,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) Emerald400 else Slate400
                                )
                            }

                            Text(
                                text = item.dayNumber,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = if (isSelected) Slate50 else if (item.isWeekend) Slate400 else Slate100
                            )

                            Text(
                                text = item.monthName,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Emerald300 else Slate500
                            )

                            // Status Dot Indicator
                            val dotColor = when {
                                item.record == null -> if (item.isWeekend) Slate600 else Color.Transparent
                                item.record.effectiveStatus == "PRESENT" && (item.record.lateMinutes ?: 0) == 0 -> Emerald400
                                item.record.effectiveStatus == "LATE" || (item.record.lateMinutes ?: 0) > 0 -> Amber400
                                item.record.effectiveStatus == "ABSENT" -> Rose400
                                item.record.effectiveStatus == "HALF_DAY" -> Purple500
                                else -> Emerald400
                            }

                            Box(
                                modifier = Modifier
                                    .padding(top = 2.dp)
                                    .size(5.dp)
                                    .background(dotColor, CircleShape)
                            )
                        }
                    }
                }
            }
        }
    }
}
