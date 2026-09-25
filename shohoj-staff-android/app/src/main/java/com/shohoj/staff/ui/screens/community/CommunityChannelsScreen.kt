package com.shohoj.staff.ui.screens.community

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.shohoj.staff.data.model.CommunityChannel
import com.shohoj.staff.data.model.DirectoryPerson
import com.shohoj.staff.ui.components.ShohojBottomBar
import com.shohoj.staff.ui.components.ShohojTopBar
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import com.shohoj.staff.util.MediaUtils
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityChannelsScreen(
    onNavigate: (String) -> Unit,
    onNavigateToChat: (channelId: String, channelName: String, channelType: String) -> Unit,
    viewModel: CommunityViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) } // 0 = Channels, 1 = Direct Messages, 2 = Directory
    var searchQuery by remember { mutableStateOf("") }
    var showNewDmSheet by remember { mutableStateOf(false) }
    var showCreateChannelDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadChannels()
        viewModel.loadMembers()
        while (isActive) {
            delay(5000)
            viewModel.loadChannelsSilently()
        }
    }

    LaunchedEffect(selectedTab) {
        if (selectedTab == 2 && uiState.staffDirectory.isEmpty()) {
            viewModel.loadMembers(force = false)
        }
    }

    Scaffold(
        topBar = {
            ShohojTopBar(
                title = "Community & Chat",
                subtitle = "Team collaboration hub",
                onNotificationsClick = { onNavigate(Screen.Announcements.route) }
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = Screen.Community.route,
                onNavigate = onNavigate
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    if (selectedTab == 1) {
                        showNewDmSheet = true
                    } else {
                        showCreateChannelDialog = true
                    }
                },
                containerColor = Emerald500,
                contentColor = Slate950,
                shape = CircleShape
            ) {
                Icon(
                    imageVector = if (selectedTab == 1) Icons.Default.Chat else Icons.Default.Add,
                    contentDescription = "New Action"
                )
            }
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            // Search Bar
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                placeholder = {
                    Text(
                        "Search channels, messages, or colleagues...",
                        style = MaterialTheme.typography.bodyMedium.copy(color = Slate400, fontSize = 13.sp)
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = Slate400,
                        modifier = Modifier.size(20.dp)
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear", tint = Slate400, modifier = Modifier.size(18.dp))
                        }
                    }
                },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900.copy(alpha = 0.8f),
                    unfocusedContainerColor = Slate900.copy(alpha = 0.8f),
                    focusedBorderColor = Emerald500,
                    unfocusedBorderColor = CardBorder,
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate50
                ),
                shape = RoundedCornerShape(14.dp)
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Tab Selector Chips with Badges & Dynamic Colors
            val channelsUnread = uiState.channels.filter { it.type != "DIRECT_MESSAGE" }.sumOf { it.unreadCount }
            val dmUnread = uiState.channels.filter { it.type == "DIRECT_MESSAGE" }.sumOf { it.unreadCount }
            val totalPeople = (uiState.staffDirectory + uiState.memberDirectory).distinctBy { it.id }.size

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                val tabs = listOf(
                    Triple("Channels", channelsUnread, Icons.Default.Forum),
                    Triple("Direct Messages", dmUnread, Icons.Default.Chat),
                    Triple("Directory", totalPeople, Icons.Default.People)
                )

                tabs.forEachIndexed { index, (title, badgeCount, _) ->
                    val isSelected = selectedTab == index
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { selectedTab = index },
                        color = if (isSelected) Emerald500 else Slate900,
                        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, CardBorder)
                    ) {
                        Row(
                            modifier = Modifier
                                .padding(vertical = 10.dp, horizontal = 4.dp)
                                .fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.labelMedium.copy(
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    fontSize = 11.5.sp,
                                    color = if (isSelected) Slate950 else Slate300
                                ),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (index < 2 && badgeCount > 0) {
                                Spacer(modifier = Modifier.width(4.dp))
                                Surface(
                                    color = if (isSelected) Slate950 else Emerald500,
                                    shape = CircleShape
                                ) {
                                    Text(
                                        text = if (badgeCount > 99) "99+" else badgeCount.toString(),
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = if (isSelected) Emerald400 else Slate950,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 9.sp
                                        ),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Main Content Area based on Selected Tab
            if (uiState.isLoadingChannels && selectedTab != 2) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Emerald500, modifier = Modifier.size(32.dp))
                }
            } else {
                when (selectedTab) {
                    0 -> {
                        // Public Channels & Announcements
                        val filteredChannels = uiState.channels.filter {
                            it.type != "DIRECT_MESSAGE" &&
                            (searchQuery.isBlank() || it.name.contains(searchQuery, ignoreCase = true))
                        }

                        if (filteredChannels.isEmpty()) {
                            EmptyStateNotice(
                                title = "No channels found",
                                subtitle = "Create a new channel or refine your search",
                                actionLabel = "Create Channel",
                                onActionClick = { showCreateChannelDialog = true }
                            )
                        } else {
                            LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(filteredChannels, key = { it.id }) { channel ->
                                    ChannelListItem(
                                        channel = channel,
                                        baseUrl = viewModel.baseUrl,
                                        onClick = {
                                            viewModel.setActiveChannel(channel)
                                            onNavigateToChat(channel.id, channel.name, channel.type)
                                        }
                                    )
                                }
                            }
                        }
                    }

                    1 -> {
                        // Direct Messages
                        val dmChannels = uiState.channels.filter {
                            it.type == "DIRECT_MESSAGE" &&
                            (searchQuery.isBlank() || it.name.contains(searchQuery, ignoreCase = true))
                        }

                        if (dmChannels.isEmpty()) {
                            EmptyStateNotice(
                                title = "No direct messages yet",
                                subtitle = "Tap the + button below or select a colleague from Directory",
                                actionLabel = "Browse Directory",
                                onActionClick = { selectedTab = 2 }
                            )
                        } else {
                            LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                items(dmChannels, key = { it.id }) { channel ->
                                    ChannelListItem(
                                        channel = channel,
                                        baseUrl = viewModel.baseUrl,
                                        onClick = {
                                            viewModel.setActiveChannel(channel)
                                            onNavigateToChat(channel.id, channel.name, channel.type)
                                        }
                                    )
                                }
                            }
                        }
                    }

                    2 -> {
                        // Staff & Member Directory
                        if (uiState.isLoadingDirectory) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    CircularProgressIndicator(color = Emerald500, modifier = Modifier.size(32.dp))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        "Loading directory...",
                                        style = MaterialTheme.typography.bodyMedium.copy(color = Slate400)
                                    )
                                }
                            }
                        } else {
                            val allPersons = (uiState.staffDirectory + uiState.memberDirectory).distinctBy { it.id }
                            val filteredPersons = allPersons.filter {
                                searchQuery.isBlank() ||
                                it.name.contains(searchQuery, ignoreCase = true) ||
                                (it.department?.contains(searchQuery, ignoreCase = true) == true) ||
                                it.role.contains(searchQuery, ignoreCase = true) ||
                                (it.email?.contains(searchQuery, ignoreCase = true) == true)
                            }

                            if (filteredPersons.isEmpty()) {
                                EmptyStateNotice(
                                    title = if (allPersons.isEmpty()) "No team members found" else "No matches found",
                                    subtitle = if (allPersons.isEmpty()) "Tap refresh to sync company colleagues" else "Try searching with a different name or role",
                                    actionLabel = "Refresh Directory",
                                    onActionClick = { viewModel.loadMembers(force = true) }
                                )
                            } else {
                                LazyColumn(
                                    modifier = Modifier.weight(1f),
                                    verticalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    items(filteredPersons, key = { it.id }) { person ->
                                        DirectoryPersonItem(
                                            person = person,
                                            onClick = {
                                                viewModel.startDirectMessage(person) { dmChannel ->
                                                    viewModel.setActiveChannel(dmChannel)
                                                    onNavigateToChat(dmChannel.id, dmChannel.name, dmChannel.type)
                                                }
                                            }
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

    // New Direct Message Bottom Sheet
    if (showNewDmSheet) {
        ModalBottomSheet(
            onDismissRequest = { showNewDmSheet = false },
            containerColor = Slate900,
            tonalElevation = 16.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
                    .fillMaxHeight(0.7f)
            ) {
                Text(
                    text = "Start Direct Message",
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                )
                Text(
                    text = "Select a colleague to open a private 1-on-1 chat",
                    style = MaterialTheme.typography.bodyMedium.copy(color = Slate400)
                )
                Spacer(modifier = Modifier.height(16.dp))

                val allPersons = (uiState.staffDirectory + uiState.memberDirectory)
                    .distinctBy { it.id }
                    .filter {
                        it.id != uiState.currentUserId &&
                        !it.name.equals(uiState.currentUserName, ignoreCase = true) &&
                        !it.name.equals("Me", ignoreCase = true)
                    }
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(allPersons, key = { it.id }) { person ->
                        DirectoryPersonItem(
                            person = person,
                            onClick = {
                                showNewDmSheet = false
                                viewModel.startDirectMessage(person) { dmChannel ->
                                    viewModel.setActiveChannel(dmChannel)
                                    onNavigateToChat(dmChannel.id, dmChannel.name, dmChannel.type)
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    // Create Channel Dialog
    if (showCreateChannelDialog) {
        CreateChannelDialog(
            onDismiss = { showCreateChannelDialog = false },
            onCreate = { name, topic, type, isPrivate ->
                showCreateChannelDialog = false
                viewModel.createChannel(name, topic, type, isPrivate) { newCh ->
                    viewModel.setActiveChannel(newCh)
                    onNavigateToChat(newCh.id, newCh.name, newCh.type)
                }
            }
        )
    }
}

@Composable
fun ChannelListItem(
    channel: CommunityChannel,
    baseUrl: String = "",
    onClick: () -> Unit
) {
    val isAnnouncement = channel.type == "ANNOUNCEMENT"
    val isDm = channel.type == "DIRECT_MESSAGE"

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Slate900)
            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Icon or Avatar
            if (isDm) {
                val participant = channel.dmParticipant
                val resolvedAvatar = MediaUtils.resolveMediaUrl(participant?.userAvatar, baseUrl)
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(Indigo500, Purple500))
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    if (!resolvedAvatar.isNullOrBlank()) {
                        AsyncImage(
                            model = resolvedAvatar,
                            contentDescription = channel.name,
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Text(
                            text = channel.name.take(2).uppercase(),
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        )
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(
                            if (isAnnouncement) Amber500.copy(alpha = 0.15f)
                            else Emerald500.copy(alpha = 0.15f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = when {
                            isAnnouncement -> Icons.Default.Campaign
                            channel.isPrivate -> Icons.Default.Lock
                            else -> Icons.Default.Tag
                        },
                        contentDescription = null,
                        tint = if (isAnnouncement) Amber400 else Emerald400,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }

            // Channel Info
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = if (!isDm && !channel.name.startsWith("#")) "#${channel.name}" else channel.name,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate50
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (isAnnouncement) {
                        Surface(
                            color = Amber500.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "ANNOUNCEMENT",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Amber400,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                val lastMsg = channel.lastMessage
                val subtitleText = when {
                    lastMsg != null && !lastMsg.content.isNullOrBlank() -> {
                        val sender = lastMsg.senderName ?: "Someone"
                        val preview = lastMsg.content.replace("\n", " ")
                        if (isDm) preview else "$sender: $preview"
                    }
                    !channel.topic.isNullOrBlank() && channel.topic.trim().lowercase() != "none" -> {
                        channel.topic
                    }
                    isDm -> "Direct Message"
                    else -> "No messages yet • Tap to start"
                }

                Text(
                    text = subtitleText,
                    style = MaterialTheme.typography.bodySmall.copy(
                        color = if (channel.unreadCount > 0 || channel.hasUnread) Slate200 else Slate400,
                        fontWeight = if (channel.unreadCount > 0 || channel.hasUnread) FontWeight.Medium else FontWeight.Normal
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Unread badge count or arrow
            val unreadCount = channel.unreadCount
            val showUnread = unreadCount > 0 || channel.hasUnread

            if (showUnread) {
                val badgeText = if (unreadCount > 99) "99+" else if (unreadCount > 0) unreadCount.toString() else "•"
                Surface(
                    color = Emerald500,
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(
                        text = badgeText,
                        style = MaterialTheme.typography.labelSmall.copy(
                            color = Slate950,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 11.sp
                        ),
                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp)
                    )
                }
            } else {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = Slate500,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun DirectoryPersonItem(
    person: DirectoryPerson,
    onClick: () -> Unit
) {
    val isStaff = person.type == "STAFF" || person.type == "ADMIN"
    val isLeadership = person.type == "ADMIN" || person.role.contains("Admin", ignoreCase = true) || person.role.contains("Owner", ignoreCase = true)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Slate900)
            .border(1.dp, CardBorder, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Initials Avatar with Vibrant Gradient
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            if (isLeadership) listOf(Amber500, Purple500)
                            else if (isStaff) listOf(Emerald500, Cyan500)
                            else listOf(Indigo500, Purple500)
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = person.name.take(2).uppercase(),
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = person.name,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate50
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    if (isLeadership) {
                        Surface(
                            color = Amber500.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "LEADERSHIP",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Amber400,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Text(
                    text = "${person.role}${if (!person.department.isNullOrBlank()) " • ${person.department}" else ""}",
                    style = MaterialTheme.typography.bodySmall.copy(color = Slate400),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            // Chat Action Button Pill
            Surface(
                color = Emerald500.copy(alpha = 0.15f),
                shape = RoundedCornerShape(10.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Emerald500.copy(alpha = 0.3f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.ChatBubbleOutline,
                        contentDescription = "Chat",
                        tint = Emerald400,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = "Chat",
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Emerald400,
                            fontSize = 12.sp
                        )
                    )
                }
            }
        }
    }
}

@Composable
fun CreateChannelDialog(
    onDismiss: () -> Unit,
    onCreate: (name: String, topic: String?, type: String, isPrivate: Boolean) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var topic by remember { mutableStateOf("") }
    var isAnnouncement by remember { mutableStateOf(false) }
    var isPrivate by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Slate900,
        title = {
            Text(
                "Create New Channel",
                style = MaterialTheme.typography.titleLarge.copy(color = Slate50, fontWeight = FontWeight.Bold)
            )
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Channel Name (e.g. sales-team)") },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Slate50,
                        unfocusedTextColor = Slate50,
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = topic,
                    onValueChange = { topic = it },
                    label = { Text("Topic or Description") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Slate50,
                        unfocusedTextColor = Slate50,
                        focusedBorderColor = Emerald500,
                        unfocusedBorderColor = Slate700
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Official Announcements only", style = MaterialTheme.typography.bodyMedium.copy(color = Slate300))
                    Switch(
                        checked = isAnnouncement,
                        onCheckedChange = { isAnnouncement = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Emerald500)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Private Channel", style = MaterialTheme.typography.bodyMedium.copy(color = Slate300))
                    Switch(
                        checked = isPrivate,
                        onCheckedChange = { isPrivate = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = Emerald500)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        val cleanName = name.trim().lowercase().replace(" ", "-")
                        onCreate(
                            cleanName,
                            topic.ifBlank { null },
                            if (isAnnouncement) "ANNOUNCEMENT" else "CHANNEL",
                            isPrivate
                        )
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Emerald500, contentColor = Slate950)
            ) {
                Text("Create Channel", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = Slate400)
            }
        }
    )
}

@Composable
fun EmptyStateNotice(
    title: String,
    subtitle: String,
    actionLabel: String? = null,
    onActionClick: (() -> Unit)? = null
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 40.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(
                imageVector = Icons.Default.Forum,
                contentDescription = null,
                tint = Slate600,
                modifier = Modifier.size(52.dp)
            )
            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = Slate300
                )
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall.copy(color = Slate500),
                modifier = Modifier.padding(horizontal = 32.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
            if (actionLabel != null && onActionClick != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onActionClick,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Emerald500,
                        contentColor = Slate950
                    ),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text(text = actionLabel, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}
