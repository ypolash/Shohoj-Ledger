package com.shohoj.staff.ui.screens.announcements

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shohoj.staff.ShohojStaffApp
import com.shohoj.staff.data.model.AnnouncementItem
import com.shohoj.staff.ui.components.EmptyStateView
import com.shohoj.staff.ui.components.LoadingView
import com.shohoj.staff.ui.components.StatusBadge
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.DateUtils
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnnouncementScreen(
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val app = context.applicationContext as ShohojStaffApp
    val repo = app.announcementRepository
    val coroutineScope = rememberCoroutineScope()

    var announcements by remember { mutableStateOf<List<AnnouncementItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val loadData = {
        coroutineScope.launch {
            isLoading = true
            error = null
            repo.getAnnouncements().fold(
                onSuccess = {
                    announcements = it
                    isLoading = false
                },
                onFailure = {
                    error = it.localizedMessage ?: "Failed to fetch notices"
                    isLoading = false
                }
            )
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Company Notices", color = Slate50, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Slate50)
                    }
                },
                actions = {
                    IconButton(onClick = { loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = Slate400)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
            )
        },
        containerColor = Slate950
    ) { padding ->
        if (isLoading && announcements.isEmpty()) {
            LoadingView("Loading notices...")
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 20.dp),
                contentPadding = PaddingValues(vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (announcements.isEmpty()) {
                    item {
                        EmptyStateView(
                            title = "No Notices Available",
                            description = "Company notices and announcements will be displayed here.",
                            icon = Icons.Default.Campaign
                        )
                    }
                } else {
                    items(announcements) { item ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CardBackground, RoundedCornerShape(16.dp))
                                .border(1.dp, CardBorder, RoundedCornerShape(16.dp))
                                .padding(18.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = item.title,
                                        style = MaterialTheme.typography.titleMedium.copy(
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 16.sp,
                                            color = Slate50
                                        ),
                                        modifier = Modifier.weight(1f)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    StatusBadge(status = item.type ?: "INFO")
                                }

                                Text(
                                    text = item.content,
                                    style = MaterialTheme.typography.bodyLarge.copy(
                                        color = Slate300,
                                        fontSize = 13.sp,
                                        lineHeight = 19.sp
                                    )
                                )

                                Divider(color = Slate700, thickness = 0.5.dp)

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Person, contentDescription = null, tint = Slate500, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(
                                            text = item.author ?: "Administration",
                                            style = MaterialTheme.typography.labelSmall.copy(color = Slate400)
                                        )
                                    }
                                    Text(
                                        text = DateUtils.formatDate(item.createdAt),
                                        style = MaterialTheme.typography.labelSmall.copy(color = Slate500)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
