package com.shohoj.staff.ui.screens.products

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shohoj.staff.data.model.StaffProductItem
import com.shohoj.staff.ui.components.ShohojBottomBar
import com.shohoj.staff.ui.navigation.Screen
import com.shohoj.staff.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsScreen(
    onNavigate: (String) -> Unit,
    viewModel: ProductViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val keyboardController = LocalSoftwareKeyboardController.current
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.actionMessage, uiState.errorMessage) {
        uiState.actionMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
        uiState.errorMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessages()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Product Management",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate50
                            )
                        )
                        Text(
                            text = "Studio Items, Inventory & Client Returns",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Amber400,
                                fontSize = 11.sp
                            )
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = { onNavigate(Screen.Home.route) }) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Slate50
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadProducts() }) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = Slate300
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Slate950
                )
            )
        },
        bottomBar = {
            ShohojBottomBar(
                currentRoute = "products",
                onNavigate = onNavigate
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = Slate950
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Stats Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ProductStatCard(
                    title = "Total",
                    count = uiState.stats.total,
                    color = Slate400,
                    modifier = Modifier.weight(1f)
                )
                ProductStatCard(
                    title = "In Studio",
                    count = uiState.stats.inStudio,
                    color = Blue400,
                    modifier = Modifier.weight(1f)
                )
                ProductStatCard(
                    title = "For Return",
                    count = uiState.stats.readyForReturn,
                    color = Amber400,
                    modifier = Modifier.weight(1f)
                )
                ProductStatCard(
                    title = "Returned",
                    count = uiState.stats.returned,
                    color = Emerald400,
                    modifier = Modifier.weight(1f)
                )
            }

            // Search Bar
            OutlinedTextField(
                value = uiState.searchQuery,
                onValueChange = { viewModel.onSearchQueryChanged(it) },
                placeholder = {
                    Text(
                        "Search by project, client, or product name...",
                        color = Slate500,
                        fontSize = 13.sp
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(20.dp)
                    )
                },
                trailingIcon = {
                    if (uiState.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.onSearchQueryChanged("") }) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Clear",
                                tint = Slate400,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                },
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                keyboardActions = KeyboardActions(onSearch = { keyboardController?.hide() }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedContainerColor = Slate900,
                    unfocusedContainerColor = Slate900,
                    focusedBorderColor = Amber500,
                    unfocusedBorderColor = Slate800,
                    focusedTextColor = Slate50,
                    unfocusedTextColor = Slate50
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp)
            )

            // Filter Pills
            val filters = listOf(
                "ALL" to "All Items",
                "IN_STUDIO" to "In Studio",
                "READY_FOR_RETURN" to "Ready For Return",
                "RETURNED" to "Returned",
                "PENDING_RECEIPT" to "Pending Receipt"
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                filters.forEach { (key, label) ->
                    val isSelected = uiState.selectedFilter == key
                    Surface(
                        onClick = { viewModel.onFilterSelected(key) },
                        shape = RoundedCornerShape(20.dp),
                        color = if (isSelected) Amber500 else Slate900,
                        border = BorderStroke(1.dp, if (isSelected) Amber400 else Slate800)
                    ) {
                        Text(
                            text = label,
                            color = if (isSelected) Slate950 else Slate300,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }
                }
            }

            // Products Content
            if (uiState.isLoading && uiState.products.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Amber400)
                }
            } else if (uiState.products.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(64.dp)
                                .background(Amber500.copy(alpha = 0.15f), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Inventory2,
                                contentDescription = null,
                                tint = Amber400,
                                modifier = Modifier.size(32.dp)
                            )
                        }
                        Text(
                            text = "No Products Found",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Bold,
                                color = Slate200
                            )
                        )
                        Text(
                            text = "No items matched your current filter or search criteria.",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate500
                            )
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(uiState.products, key = { it.projectId }) { product ->
                        ProductItemCard(
                            product = product,
                            onHandoverReturn = { viewModel.openReturnModal(product) },
                            onReceive = { viewModel.receiveProduct(product.projectId) },
                            onRevert = { viewModel.revertReturn(product.projectId) },
                            isActionLoading = uiState.isActionLoading
                        )
                    }
                }
            }
        }
    }

    // Handover Return Dialog
    uiState.returnModalProduct?.let { product ->
        ReturnHandoverDialog(
            product = product,
            isSubmitting = uiState.isActionLoading,
            onDismiss = { viewModel.closeReturnModal() },
            onConfirm = { date, method, receiver, notes ->
                viewModel.confirmReturn(
                    projectId = product.projectId,
                    returnDate = date,
                    returnMethod = method,
                    returnReceiver = receiver,
                    returnNotes = notes
                )
            }
        )
    }
}

@Composable
fun ProductStatCard(
    title: String,
    count: Int,
    color: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        color = Slate900,
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(1.dp, Slate800)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Black,
                    color = color,
                    fontSize = 17.sp
                )
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall.copy(
                    color = Slate400,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.Medium
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun ProductItemCard(
    product: StaffProductItem,
    onHandoverReturn: () -> Unit,
    onReceive: () -> Unit,
    onRevert: () -> Unit,
    isActionLoading: Boolean
) {
    val statusColor = when (product.productStatus) {
        "RETURNED" -> Emerald400
        "READY_FOR_RETURN" -> Amber400
        "IN_STUDIO" -> Blue400
        "PENDING_RECEIPT" -> Rose400
        else -> Slate400
    }

    val statusBg = when (product.productStatus) {
        "RETURNED" -> Emerald500.copy(alpha = 0.15f)
        "READY_FOR_RETURN" -> Amber500.copy(alpha = 0.15f)
        "IN_STUDIO" -> Blue500.copy(alpha = 0.15f)
        "PENDING_RECEIPT" -> Rose500.copy(alpha = 0.15f)
        else -> Slate800
    }

    val statusBorder = when (product.productStatus) {
        "RETURNED" -> Emerald500.copy(alpha = 0.35f)
        "READY_FOR_RETURN" -> Amber500.copy(alpha = 0.35f)
        "IN_STUDIO" -> Blue500.copy(alpha = 0.35f)
        "PENDING_RECEIPT" -> Rose500.copy(alpha = 0.35f)
        else -> Slate700
    }

    val statusLabel = when (product.productStatus) {
        "RETURNED" -> "RETURNED"
        "READY_FOR_RETURN" -> "READY FOR RETURN"
        "IN_STUDIO" -> "IN STUDIO"
        "PENDING_RECEIPT" -> "PENDING RECEIPT"
        else -> "NO PRODUCT"
    }

    Surface(
        color = Slate900,
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, Slate800),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Header Row: Code & Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = Slate800,
                    shape = RoundedCornerShape(6.dp),
                    border = BorderStroke(1.dp, Slate700)
                ) {
                    Text(
                        text = product.projectCode,
                        color = Amber400,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }

                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, statusBorder)
                ) {
                    Text(
                        text = statusLabel,
                        color = statusColor,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            // Project Title & Client
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = product.projectName,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = Slate50,
                        fontSize = 16.sp
                    )
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = null,
                        tint = Slate400,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = product.clientName + if (product.clientPhone.isNotEmpty()) " (${product.clientPhone})" else "",
                        style = MaterialTheme.typography.bodySmall.copy(
                            color = Slate400,
                            fontSize = 12.sp
                        )
                    )
                }
            }

            // Items breakdown
            if (product.productsList.isNotEmpty()) {
                Surface(
                    color = Slate950.copy(alpha = 0.6f),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, Slate800.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "📦 Physical Inventory (${product.productsList.size} items)",
                            style = MaterialTheme.typography.bodySmall.copy(
                                color = Slate300,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp
                            )
                        )
                        product.productsList.forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "• ${item.name}",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Slate200,
                                        fontSize = 12.sp
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                                Text(
                                    text = "Qty: ${item.quantity} (${item.condition})",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        color = Amber400,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                )
                            }
                        }
                    }
                }
            }

            // Return handover info banner if returned
            if (product.productReturned) {
                Surface(
                    color = Emerald500.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(1.dp, Emerald500.copy(alpha = 0.25f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(2.dp)
                    ) {
                        Text(
                            text = "✅ Handover Completed",
                            color = Emerald400,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Text(
                            text = "Method: ${product.productReturnMethod ?: "In-Person"} • Date: ${product.productReturnDate ?: "N/A"}",
                            color = Slate300,
                            fontSize = 11.sp
                        )
                        if (!product.productReturnReceiver.isNullOrBlank()) {
                            Text(
                                text = "Receiver: ${product.productReturnReceiver}",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }
                        if (!product.productReturnNotes.isNullOrBlank()) {
                            Text(
                                text = "Notes: ${product.productReturnNotes}",
                                color = Slate400,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                when {
                    product.productStatus == "PENDING_RECEIPT" -> {
                        Button(
                            onClick = onReceive,
                            enabled = !isActionLoading,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Emerald500,
                                contentColor = Slate950
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(40.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Quick Receive & Verify", fontWeight = FontWeight.Bold, fontSize = 12.5.sp)
                        }
                    }
                    product.productReturned -> {
                        OutlinedButton(
                            onClick = onRevert,
                            enabled = !isActionLoading,
                            colors = ButtonDefaults.outlinedButtonColors(
                                contentColor = Slate400
                            ),
                            border = BorderStroke(1.dp, Slate700),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(38.dp)
                        ) {
                            Icon(Icons.Default.Undo, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Revert Return Status", fontSize = 12.sp)
                        }
                    }
                    else -> {
                        Button(
                            onClick = onHandoverReturn,
                            enabled = !isActionLoading,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (product.productStatus == "READY_FOR_RETURN") Amber500 else Slate800,
                                contentColor = if (product.productStatus == "READY_FOR_RETURN") Slate950 else Slate100
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth().height(42.dp)
                        ) {
                            Icon(Icons.Default.LocalShipping, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Confirm Return Handover", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ReturnHandoverDialog(
    product: StaffProductItem,
    isSubmitting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: (date: String, method: String, receiver: String, notes: String) -> Unit
) {
    val defaultDate = remember {
        SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    }

    var returnDate by remember { mutableStateOf(defaultDate) }
    var returnMethod by remember { mutableStateOf("In-Person Handover") }
    var receiverName by remember { mutableStateOf(product.clientName) }
    var returnNotes by remember { mutableStateOf("") }

    val methods = listOf(
        "In-Person Handover",
        "Steadfast Courier",
        "Pathao Courier",
        "RedX",
        "Client Representative",
        "Direct Delivery"
    )

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Slate900,
            border = BorderStroke(1.dp, Amber500.copy(alpha = 0.35f)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📦 Return Handover",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = Slate50,
                            fontSize = 17.sp
                        )
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Slate400)
                    }
                }

                Text(
                    text = "${product.projectName} • ${product.projectCode}",
                    style = MaterialTheme.typography.bodySmall.copy(color = Amber400, fontWeight = FontWeight.SemiBold)
                )

                // Return Date
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Return Date (YYYY-MM-DD)", color = Slate400, fontSize = 12.sp)
                    OutlinedTextField(
                        value = returnDate,
                        onValueChange = { returnDate = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Slate950,
                            unfocusedContainerColor = Slate950,
                            focusedBorderColor = Amber500,
                            unfocusedBorderColor = Slate700,
                            focusedTextColor = Slate50,
                            unfocusedTextColor = Slate50
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Return Method Dropdown/Selector
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Handover Method", color = Slate400, fontSize = 12.sp)
                    var expanded by remember { mutableStateOf(false) }

                    Surface(
                        onClick = { expanded = true },
                        color = Slate950,
                        shape = RoundedCornerShape(10.dp),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = returnMethod, color = Slate50, fontSize = 13.sp)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Slate400)
                        }

                        DropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            modifier = Modifier.background(Slate900)
                        ) {
                            methods.forEach { m ->
                                DropdownMenuItem(
                                    text = { Text(m, color = Slate100, fontSize = 13.sp) },
                                    onClick = {
                                        returnMethod = m
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                }

                // Receiver Name
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Receiver / Client Name", color = Slate400, fontSize = 12.sp)
                    OutlinedTextField(
                        value = receiverName,
                        onValueChange = { receiverName = it },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Slate950,
                            unfocusedContainerColor = Slate950,
                            focusedBorderColor = Amber500,
                            unfocusedBorderColor = Slate700,
                            focusedTextColor = Slate50,
                            unfocusedTextColor = Slate50
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Return Notes / Tracking
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Courier Tracking / Notes (Optional)", color = Slate400, fontSize = 12.sp)
                    OutlinedTextField(
                        value = returnNotes,
                        onValueChange = { returnNotes = it },
                        placeholder = { Text("e.g. Steadfast consignment ID, condition notes", color = Slate600, fontSize = 12.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Slate950,
                            unfocusedContainerColor = Slate950,
                            focusedBorderColor = Amber500,
                            unfocusedBorderColor = Slate700,
                            focusedTextColor = Slate50,
                            unfocusedTextColor = Slate50
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Actions
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate300),
                        border = BorderStroke(1.dp, Slate700),
                        modifier = Modifier.weight(1f).height(44.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            onConfirm(returnDate, returnMethod, receiverName, returnNotes)
                        },
                        enabled = !isSubmitting,
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Amber500,
                            contentColor = Slate950
                        ),
                        modifier = Modifier.weight(1.5f).height(44.dp)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = Slate950, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                        } else {
                            Text("Confirm Return", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}
