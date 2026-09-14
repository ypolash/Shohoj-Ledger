package com.shohoj.staff.ui.screens.community

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import coil.compose.AsyncImage
import com.shohoj.staff.data.model.CommunityAttachment
import com.shohoj.staff.data.model.CommunityMessage
import com.shohoj.staff.data.model.DirectoryPerson
import com.shohoj.staff.data.model.TaskItem
import com.shohoj.staff.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun CommunityChatScreen(
    channelId: String,
    channelName: String,
    channelType: String,
    onNavigateBack: () -> Unit,
    viewModel: CommunityViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    var inputText by remember { mutableStateOf("") }
    var selectedMessageForMenu by remember { mutableStateOf<CommunityMessage?>(null) }
    var showPinnedBanner by remember { mutableStateOf(true) }

    // Autocomplete queries for @mentions and #tasks
    val lastWord = remember(inputText) {
        val lastSpace = inputText.lastIndexOfAny(charArrayOf(' ', '\n'))
        if (lastSpace == -1) inputText else inputText.substring(lastSpace + 1)
    }

    val isMentionQuery = lastWord.startsWith("@")
    val mentionQuery = if (isMentionQuery) lastWord.removePrefix("@").lowercase() else ""

    val isTaskQuery = lastWord.startsWith("#")
    val taskQuery = if (isTaskQuery) lastWord.removePrefix("#").lowercase() else ""

    val matchingMembers = remember(mentionQuery, uiState.staffDirectory, uiState.memberDirectory, isMentionQuery) {
        if (!isMentionQuery) emptyList<DirectoryPerson>()
        else {
            val all = (uiState.staffDirectory + uiState.memberDirectory).distinctBy { it.id }
            if (mentionQuery.isBlank()) all.take(5)
            else all.filter {
                it.name.lowercase().contains(mentionQuery) ||
                it.role.lowercase().contains(mentionQuery)
            }.take(5)
        }
    }

    val matchingTasks = remember(taskQuery, uiState.tasks, isTaskQuery) {
        if (!isTaskQuery) emptyList<TaskItem>()
        else {
            if (taskQuery.isBlank()) uiState.tasks.take(5)
            else uiState.tasks.filter {
                it.title.lowercase().contains(taskQuery) ||
                it.id.lowercase().contains(taskQuery)
            }.take(5)
        }
    }

    // Smart Polling: Starts polling when screen is active, cancels immediately when user leaves
    DisposableEffect(channelId) {
        viewModel.loadMessages(channelId)
        viewModel.startPolling(channelId)
        onDispose {
            viewModel.stopPolling()
        }
    }

    // Auto-scroll to bottom when messages update
    LaunchedEffect(uiState.messages.size) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }

    // Attachment Picker (Images and Documents)
    val filePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            viewModel.uploadAndSendAttachment(
                context = context,
                channelId = channelId,
                uri = it,
                caption = inputText
            )
            inputText = ""
        }
    }

    val pinnedMessage = uiState.messages.lastOrNull { it.isPinned }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = if (channelType != "DIRECT_MESSAGE" && !channelName.startsWith("#")) "#$channelName" else channelName,
                                style = MaterialTheme.typography.titleMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Slate50
                                ),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        Text(
                            text = when (channelType) {
                                "ANNOUNCEMENT" -> "📢 Official Broadcast"
                                "DIRECT_MESSAGE" -> "Direct Message"
                                else -> "Tap for info • ${uiState.messages.size} messages"
                            },
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Emerald400,
                                fontSize = 11.sp
                            )
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Slate300
                        )
                    }
                },
                actions = {
                    if (pinnedMessage != null) {
                        IconButton(onClick = { showPinnedBanner = !showPinnedBanner }) {
                            Icon(
                                imageVector = Icons.Default.PushPin,
                                contentDescription = "Pinned Message",
                                tint = if (showPinnedBanner) Amber400 else Slate400
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate900,
                    titleContentColor = Slate50
                )
            )
        },
        containerColor = Slate950
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Pinned Message Banner (if available & enabled)
            if (pinnedMessage != null && showPinnedBanner) {
                Surface(
                    color = Slate900,
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.PushPin,
                            contentDescription = null,
                            tint = Amber400,
                            modifier = Modifier.size(18.dp)
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "PINNED BY ${pinnedMessage.senderName.uppercase()}",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Amber400,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Text(
                                text = pinnedMessage.content,
                                style = MaterialTheme.typography.bodySmall.copy(color = Slate200),
                                maxLines = 2,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                        IconButton(
                            onClick = { showPinnedBanner = false },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Dismiss Banner",
                                tint = Slate400,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Message Feed
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (uiState.isLoadingMessages && uiState.messages.isEmpty()) {
                    CircularProgressIndicator(
                        color = Emerald500,
                        modifier = Modifier.align(Alignment.Center)
                    )
                } else if (uiState.messages.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.ChatBubbleOutline,
                                contentDescription = null,
                                tint = Slate600,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "No messages yet",
                                style = MaterialTheme.typography.titleMedium.copy(color = Slate400)
                            )
                            Text(
                                text = "Send a message to break the ice!",
                                style = MaterialTheme.typography.bodySmall.copy(color = Slate500)
                            )
                        }
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.messages, key = { it.id }) { message ->
                            val isMe = message.senderId == uiState.currentUserId ||
                                       message.senderName == uiState.currentUserName

                            MessageBubble(
                                message = message,
                                isMe = isMe,
                                currentUserName = uiState.currentUserName,
                                onLongClick = { selectedMessageForMenu = message },
                                onReactionClick = { emoji ->
                                    viewModel.toggleReaction(message.id, emoji)
                                }
                            )
                        }
                    }
                }
            }

            // Uploading progress banner
            if (uiState.isUploading) {
                LinearProgressIndicator(
                    color = Emerald500,
                    trackColor = Slate800,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Reply Context Banner
            if (uiState.replyingTo != null) {
                Surface(
                    color = Slate900,
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, CardBorder)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Reply,
                                contentDescription = null,
                                tint = Emerald400,
                                modifier = Modifier.size(16.dp)
                            )
                            Column {
                                Text(
                                    text = "Replying to ${uiState.replyingTo?.senderName}",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Emerald400,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Text(
                                    text = uiState.replyingTo?.content ?: "",
                                    style = MaterialTheme.typography.bodySmall.copy(color = Slate300),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                        IconButton(
                            onClick = { viewModel.setReplyingTo(null) },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Cancel reply",
                                tint = Slate400,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // @ Mention Autocomplete Popup
            if (matchingMembers.isNotEmpty()) {
                Surface(
                    color = Slate900,
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(vertical = 6.dp, horizontal = 10.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(bottom = 6.dp, start = 4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.AlternateEmail,
                                contentDescription = null,
                                tint = Cyan400,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = "PING TEAM MEMBER",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Cyan400,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                            )
                        }
                        matchingMembers.forEach { person ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable {
                                        val prefix = inputText.substring(0, inputText.length - lastWord.length)
                                        inputText = "$prefix@${person.name} "
                                    }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(Cyan500.copy(alpha = 0.2f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = person.name.take(1).uppercase(),
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = Cyan400,
                                            fontWeight = FontWeight.Bold
                                        )
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = person.name,
                                        style = MaterialTheme.typography.bodyMedium.copy(
                                            color = Slate50,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    )
                                    Text(
                                        text = "${person.role}${if (!person.department.isNullOrBlank()) " • ${person.department}" else ""}",
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = Slate400,
                                            fontSize = 11.sp
                                        )
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // # Task Mention Autocomplete Popup
            if (matchingTasks.isNotEmpty()) {
                Surface(
                    color = Slate900,
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(vertical = 6.dp, horizontal = 10.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(bottom = 6.dp, start = 4.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Assignment,
                                contentDescription = null,
                                tint = Amber400,
                                modifier = Modifier.size(15.dp)
                            )
                            Text(
                                text = "LINK TASK",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    color = Amber400,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                            )
                        }
                        matchingTasks.forEach { task ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(8.dp))
                                    .clickable {
                                        val prefix = inputText.substring(0, inputText.length - lastWord.length)
                                        inputText = "$prefix#[Task: ${task.title}] "
                                    }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Surface(
                                    color = Amber500.copy(alpha = 0.2f),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = task.status.take(4).uppercase(),
                                        style = MaterialTheme.typography.labelSmall.copy(
                                            color = Amber400,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        ),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = task.title,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        color = Slate100,
                                        fontWeight = FontWeight.Medium
                                    ),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }
                }
            }

            // Input Bar
            Surface(
                color = Slate900,
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, CardBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Attachment Button
                    IconButton(
                        onClick = { filePickerLauncher.launch("*/*") },
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AttachFile,
                            contentDescription = "Attach File",
                            tint = Slate400,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    // Quick @ Mention Button
                    IconButton(
                        onClick = {
                            inputText = if (inputText.endsWith(" ") || inputText.isEmpty()) "${inputText}@" else "${inputText} @"
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Text(
                            text = "@",
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Cyan400,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }

                    // Quick # Task Mention Button
                    IconButton(
                        onClick = {
                            inputText = if (inputText.endsWith(" ") || inputText.isEmpty()) "${inputText}#" else "${inputText} #"
                        },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Text(
                            text = "#",
                            style = MaterialTheme.typography.titleMedium.copy(
                                color = Amber400,
                                fontWeight = FontWeight.Bold
                            )
                        )
                    }

                    // Text Input
                    OutlinedTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        placeholder = {
                            Text(
                                "Message #$channelName...",
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = Slate400,
                                    fontSize = 13.sp
                                )
                            )
                        },
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 44.dp, max = 120.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Slate950,
                            unfocusedContainerColor = Slate950,
                            focusedBorderColor = Emerald500,
                            unfocusedBorderColor = CardBorder,
                            focusedTextColor = Slate50,
                            unfocusedTextColor = Slate50
                        ),
                        shape = RoundedCornerShape(20.dp),
                        maxLines = 4
                    )

                    // Send Button
                    IconButton(
                        onClick = {
                            if (inputText.isNotBlank()) {
                                viewModel.sendMessage(channelId, inputText)
                                inputText = ""
                            }
                        },
                        enabled = inputText.isNotBlank() && !uiState.isSending,
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(
                                if (inputText.isNotBlank()) Emerald500 else Slate800
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Send",
                            tint = if (inputText.isNotBlank()) Slate950 else Slate500,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }
    }

    // Long Press Action Dialog (Reply, Pin, Reactions)
    selectedMessageForMenu?.let { message ->
        val isPinned = message.isPinned
        AlertDialog(
            onDismissRequest = { selectedMessageForMenu = null },
            containerColor = Slate900,
            title = {
                Text(
                    "Message Options",
                    style = MaterialTheme.typography.titleMedium.copy(color = Slate50, fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Quick Emoji Reaction Row
                    Text("Add Reaction", style = MaterialTheme.typography.labelSmall.copy(color = Slate400))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val emojis = listOf("👍", "❤️", "🎉", "🔥", "🚀", "💡", "✅")
                        emojis.forEach { emoji ->
                            Text(
                                text = emoji,
                                fontSize = 24.sp,
                                modifier = Modifier
                                    .clickable {
                                        viewModel.toggleReaction(message.id, emoji)
                                        selectedMessageForMenu = null
                                    }
                                    .padding(4.dp)
                            )
                        }
                    }

                    Divider(color = Slate800)

                    // Reply Action
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.setReplyingTo(message)
                                selectedMessageForMenu = null
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(Icons.Default.Reply, contentDescription = null, tint = Emerald400)
                        Text("Reply to message", color = Slate50)
                    }

                    // Pin / Unpin Action
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.togglePin(message.id)
                                selectedMessageForMenu = null
                            }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            Icons.Default.PushPin,
                            contentDescription = null,
                            tint = if (isPinned) Amber400 else Slate300
                        )
                        Text(if (isPinned) "Unpin message" else "Pin message to channel", color = Slate50)
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { selectedMessageForMenu = null }) {
                    Text("Close", color = Slate400)
                }
            }
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubble(
    message: CommunityMessage,
    isMe: Boolean,
    currentUserName: String,
    onLongClick: () -> Unit,
    onReactionClick: (String) -> Unit
) {
    val myName = currentUserName.trim().lowercase()
    val isMentioned = !isMe && myName.isNotBlank() && (
        message.content.lowercase().contains("@$myName") ||
        message.content.lowercase().contains("@${myName.split(" ").first()}")
    )

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMe) Arrangement.End else Arrangement.Start,
        verticalAlignment = Alignment.Bottom
    ) {
        // Sender Avatar (if from other person)
        if (!isMe) {
            Box(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            when (message.senderType) {
                                "ADMIN" -> listOf(Rose500, Amber500)
                                "STAFF" -> listOf(Emerald500, Cyan500)
                                else -> listOf(Indigo500, Purple500)
                            }
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                if (!message.senderAvatar.isNullOrBlank()) {
                    AsyncImage(
                        model = message.senderAvatar,
                        contentDescription = message.senderName,
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                    )
                } else {
                    Text(
                        text = message.senderName.take(2).uppercase(),
                        style = MaterialTheme.typography.labelSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    )
                }
            }
            Spacer(modifier = Modifier.width(8.dp))
        }

        // Bubble Content Column
        Column(
            modifier = Modifier.widthIn(max = 280.dp),
            horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
        ) {
            // Sender Name and Badge (if not me)
            if (!isMe) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                    modifier = Modifier.padding(bottom = 3.dp, start = 4.dp)
                ) {
                    Text(
                        text = message.senderName,
                        style = MaterialTheme.typography.labelMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate300
                        )
                    )
                    Surface(
                        color = when (message.senderType) {
                            "ADMIN" -> Rose500.copy(alpha = 0.2f)
                            "STAFF" -> Emerald500.copy(alpha = 0.2f)
                            else -> Slate700
                        },
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = message.senderRole,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 9.sp,
                                color = when (message.senderType) {
                                    "ADMIN" -> Rose400
                                    "STAFF" -> Emerald400
                                    else -> Slate300
                                }
                            ),
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }
                }
            }

            // Bubble Card
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isMe) 16.dp else 4.dp,
                            bottomEnd = if (isMe) 4.dp else 16.dp
                        )
                    )
                    .background(
                        if (isMe) Emerald600
                        else Slate900
                    )
                    .border(
                        if (isMentioned) 1.5.dp else 1.dp,
                        when {
                            isMentioned -> Cyan400
                            isMe -> Emerald500.copy(alpha = 0.3f)
                            else -> CardBorder
                        },
                        RoundedCornerShape(
                            topStart = 16.dp,
                            topEnd = 16.dp,
                            bottomStart = if (isMe) 16.dp else 4.dp,
                            bottomEnd = if (isMe) 4.dp else 16.dp
                        )
                    )
                    .combinedClickable(
                        onClick = {},
                        onLongClick = onLongClick
                    )
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    // Pinged You Indicator
                    if (isMentioned) {
                        Surface(
                            color = Cyan500.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Cyan400.copy(alpha = 0.4f)),
                            modifier = Modifier.padding(bottom = 2.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.NotificationsActive,
                                    contentDescription = null,
                                    tint = Cyan400,
                                    modifier = Modifier.size(11.dp)
                                )
                                Text(
                                    text = "PINGED YOU",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Cyan400,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                            }
                        }
                    }

                    // Quoted Reply (if replying)
                    if (message.replyTo != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isMe) Emerald700 else Slate800)
                                .padding(8.dp)
                        ) {
                            Column {
                                Text(
                                    text = message.replyTo.senderName,
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = if (isMe) Slate100 else Emerald400,
                                        fontWeight = FontWeight.Bold
                                    )
                                )
                                Text(
                                    text = message.replyTo.content,
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = if (isMe) Slate200 else Slate400
                                    ),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Attachments Preview
                    message.attachments.forEach { attachment ->
                        AttachmentItemPreview(attachment = attachment, isMe = isMe)
                    }

                    // Message Text with Highlighted @Mentions and #Tasks
                    if (message.content.isNotBlank()) {
                        Text(
                            text = buildFormattedMessageContent(message.content, isMe),
                            style = MaterialTheme.typography.bodyMedium.copy(
                                color = if (isMe) Color.White else Slate100,
                                fontSize = 14.sp
                            )
                        )
                    }

                    // Pinned Indicator & Timestamp
                    Row(
                        modifier = Modifier.align(Alignment.End),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        if (message.isPinned) {
                            Icon(
                                imageVector = Icons.Default.PushPin,
                                contentDescription = "Pinned",
                                tint = if (isMe) Slate200 else Amber400,
                                modifier = Modifier.size(12.dp)
                            )
                        }
                    }
                }
            }

            // Reactions Pills
            if (message.reactions.isNotEmpty()) {
                val grouped = message.reactions.groupBy { it.emoji }
                Row(
                    modifier = Modifier
                        .padding(top = 4.dp)
                        .padding(horizontal = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    grouped.forEach { (emoji, list) ->
                        Surface(
                            color = Slate800,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, CardBorder),
                            modifier = Modifier.clickable { onReactionClick(emoji) }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(3.dp),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(emoji, fontSize = 11.sp)
                                Text(
                                    text = "${list.size}",
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = Slate300,
                                        fontSize = 10.sp
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun AttachmentItemPreview(
    attachment: CommunityAttachment,
    isMe: Boolean
) {
    val isImage = attachment.fileType.startsWith("image/")

    if (isImage) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(max = 180.dp)
                .clip(RoundedCornerShape(8.dp))
        ) {
            AsyncImage(
                model = attachment.fileUrl,
                contentDescription = attachment.fileName,
                modifier = Modifier.fillMaxWidth()
            )
        }
    } else {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(if (isMe) Emerald700 else Slate800)
                .padding(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.InsertDriveFile,
                    contentDescription = null,
                    tint = if (isMe) Color.White else Emerald400,
                    modifier = Modifier.size(24.dp)
                )
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = attachment.fileName,
                        style = MaterialTheme.typography.labelMedium.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        ),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = "${attachment.fileSize / 1024} KB",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = if (isMe) Slate200 else Slate400,
                            fontSize = 11.sp
                        )
                    )
                }
            }
        }
    }
}

/**
 * Format chat message text highlighting @mentions (Cyan) and #task references (Amber)
 */
fun buildFormattedMessageContent(
    content: String,
    isMe: Boolean
): AnnotatedString {
    return buildAnnotatedString {
        val regex = Regex("""(@[a-zA-Z0-9_.\-]+(?:\s[a-zA-Z0-9_.\-]+)?|#\[Task:[^\]]+\]|#\w+)""")
        var lastIdx = 0

        regex.findAll(content).forEach { matchResult ->
            val range = matchResult.range
            if (range.first > lastIdx) {
                append(content.substring(lastIdx, range.first))
            }

            val token = matchResult.value
            if (token.startsWith("@")) {
                withStyle(
                    SpanStyle(
                        color = if (isMe) Slate950 else Cyan400,
                        background = if (isMe) Slate100.copy(alpha = 0.85f) else Cyan500.copy(alpha = 0.2f),
                        fontWeight = FontWeight.Bold
                    )
                ) {
                    append(token)
                }
            } else if (token.startsWith("#")) {
                withStyle(
                    SpanStyle(
                        color = if (isMe) Amber400 else Amber400,
                        background = Amber500.copy(alpha = 0.2f),
                        fontWeight = FontWeight.Bold
                    )
                ) {
                    append(token)
                }
            } else {
                append(token)
            }
            lastIdx = range.last + 1
        }

        if (lastIdx < content.length) {
            append(content.substring(lastIdx))
        }
    }
}
