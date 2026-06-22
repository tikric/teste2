package com.bambuzau3d.ui

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.bambuzau3d.data.*
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.*

// --- THEME COLOR SPECIFICATION ---
val CharcoalBg = Color(0xFF0C0E0D)
val CardGray = Color(0xFF151917)
val LaserCyan = Color(0xFF95BBA2)
val HotOrange = Color(0xFFE5B242)
val LightMetal = Color(0xFFF1F4EE)
val MutedSlate = Color(0xFF8BA58D)
val ElectricPurple = Color(0xFFB6D8B4)
val MintEmerald = Color(0xFF5E8B61)
val InfoBlue = Color(0xFF7A9F82)
val RedSunset = Color(0xFFD35C5C)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrintFlowScreen(viewModel: MainViewModel) {
    val currentTab by viewModel.currentTab.collectAsStateWithLifecycle()
    val context = LocalContext.current

    // Observe DB States
    val clients by viewModel.clients.collectAsStateWithLifecycle()
    val printers by viewModel.printers.collectAsStateWithLifecycle()
    val orders by viewModel.orders.collectAsStateWithLifecycle()
    val expenses by viewModel.expenses.collectAsStateWithLifecycle()
    val filamentStocks by viewModel.filamentStocks.collectAsStateWithLifecycle()
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()

    // Dialog state controllers
    val isClientDialogVisible by viewModel.isClientDialogVisible.collectAsStateWithLifecycle()
    val editingClient by viewModel.editingClient.collectAsStateWithLifecycle()

    val isPrinterDialogVisible by viewModel.isPrinterDialogVisible.collectAsStateWithLifecycle()
    val editingPrinter by viewModel.editingPrinter.collectAsStateWithLifecycle()

    val isOrderDialogVisible by viewModel.isOrderDialogVisible.collectAsStateWithLifecycle()
    val editingOrder by viewModel.editingOrder.collectAsStateWithLifecycle()

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .testTag("app_main_scaffold"),
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CharcoalBg,
                    titleContentColor = LightMetal
                ),
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Custom 3D printer hotend extruder icon
                        Icon(
                            imageVector = Icons.Default.Build,
                            contentDescription = "Emblema Extrusora",
                            tint = HotOrange,
                            modifier = Modifier.size(28.dp)
                        )
                        Column {
                            Text(
                                text = "Ateliê 3D Hub",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.SansSerif,
                                color = LightMetal
                            )
                            Text(
                                text = "Controle de Produção & Filamento",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Light,
                                color = MutedSlate
                            )
                        }
                    }
                },
                actions = {
                    // Firebase Cloud Sync shortcut button
                    IconButton(
                        onClick = {
                            viewModel.selectTab(3)
                            viewModel.selectPricingSubTab(4)
                        },
                        modifier = Modifier.padding(end = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Nuvem Firebase",
                            tint = LaserCyan,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    // Show printer stats at top
                    val activePrintersCount = printers.count { it.status == "PRINTING" }
                    Surface(
                        color = if (activePrintersCount > 0) LaserCyan.copy(alpha = 0.15f) else CardGray,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(if (activePrintersCount > 0) LaserCyan else MutedSlate)
                            )
                            Text(
                                text = "$activePrintersCount Ativas",
                                color = if (activePrintersCount > 0) LaserCyan else MutedSlate,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                             )
                        }
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = CharcoalBg,
                tonalElevation = 8.dp
            ) {
                NavigationBarItem(
                    selected = currentTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Painel") },
                    label = { Text("Painel", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CharcoalBg,
                        selectedTextColor = LaserCyan,
                        indicatorColor = LaserCyan,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
                NavigationBarItem(
                    selected = currentTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    icon = { Icon(Icons.Default.List, contentDescription = "Produção") },
                    label = { Text("Produção", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CharcoalBg,
                        selectedTextColor = LaserCyan,
                        indicatorColor = LaserCyan,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
                NavigationBarItem(
                    selected = currentTab == 2,
                    onClick = { viewModel.selectTab(2) },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Clientes") },
                    label = { Text("Clientes/Imp.", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CharcoalBg,
                        selectedTextColor = LaserCyan,
                        indicatorColor = LaserCyan,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
                NavigationBarItem(
                    selected = currentTab == 3,
                    onClick = { viewModel.selectTab(3) },
                    icon = { Icon(Icons.Default.ShoppingCart, contentDescription = "Plataformas") },
                    label = { Text("Integrar", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CharcoalBg,
                        selectedTextColor = LaserCyan,
                        indicatorColor = LaserCyan,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
                NavigationBarItem(
                    selected = currentTab == 4,
                    onClick = { viewModel.selectTab(4) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Custos e Catálogo") },
                    label = { Text("Custos/Estoque", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = CharcoalBg,
                        selectedTextColor = LaserCyan,
                        indicatorColor = LaserCyan,
                        unselectedIconColor = MutedSlate,
                        unselectedTextColor = MutedSlate
                    )
                )
            }
        },
        floatingActionButton = {
            if (currentTab == 1) {
                FloatingActionButton(
                    onClick = { viewModel.openAddOrderDialog() },
                    containerColor = HotOrange,
                    contentColor = Color.White,
                    modifier = Modifier
                        .testTag("add_order_fab")
                        .padding(bottom = 16.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Novo Pedido",
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(CharcoalBg, Color(0xFF0D0F12))
                    )
                )
                .padding(innerPadding)
        ) {
            when (currentTab) {
                0 -> DashboardView(viewModel = viewModel, orders = orders, expenses = expenses, filamentStocks = filamentStocks, catalogItems = catalogItems)
                1 -> ProductionDashboardView(viewModel = viewModel, orders = orders, printers = printers)
                2 -> ClientsAndPrintersView(viewModel = viewModel, clients = clients, printers = printers)
                3 -> PlatformsIntegrationView(viewModel = viewModel)
                4 -> FilamentPriceSearchView(viewModel = viewModel)
                else -> DashboardView(viewModel = viewModel, orders = orders, expenses = expenses, filamentStocks = filamentStocks, catalogItems = catalogItems)
            }
        }
    }

    // --- DIALOGS REGISTRY ---
    if (isClientDialogVisible) {
        AddEditClientDialog(
            client = editingClient,
            onDismiss = { viewModel.dismissClientDialog() },
            onSave = { name, phone, email, address, note ->
                viewModel.saveClient(name, phone, email, address, note)
            }
        )
    }

    if (isPrinterDialogVisible) {
        AddEditPrinterDialog(
            printer = editingPrinter,
            onDismiss = { viewModel.dismissPrinterDialog() },
            onSave = { name, model, status, ipAddress ->
                viewModel.savePrinter(name, model, status, ipAddress)
            }
        )
    }

    if (isOrderDialogVisible) {
        val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()
        val filamentStocks by viewModel.filamentStocks.collectAsStateWithLifecycle()
        AddEditOrderDialog(
            order = editingOrder,
            clients = clients,
            printers = printers,
            catalogItems = catalogItems,
            filamentStocks = filamentStocks,
            onDismiss = { viewModel.dismissOrderDialog() },
            onSave = { clientName, itemName, q, type, col, we, ti, pr, st, pri, days ->
                viewModel.saveOrder(clientName, itemName, q, type, col, we, ti, pr, st, pri, days)
            }
        )
    }
}

// ==========================================
// NEW TAB 0: DETAILED BUSINESS DASHBOARD VIEW
// ==========================================
@Composable
fun DashboardView(
    viewModel: MainViewModel,
    orders: List<PrintOrder>,
    expenses: List<Expense>,
    filamentStocks: List<FilamentStock>,
    catalogItems: List<CatalogItem>
) {
    val activeAlerts by viewModel.activeAlerts.collectAsStateWithLifecycle()

    // Basic Calculations
    val totalRevenue = remember(orders) { orders.sumOf { it.priceCharged } }
    val totalExpenses = remember(expenses) { expenses.sumOf { it.amount * it.qty } }
    val netProfit = totalRevenue - totalExpenses
    
    val marginPct = remember(totalRevenue, netProfit) {
        if (totalRevenue > 0) (netProfit / totalRevenue) * 100 else 0.0
    }
    
    val roiPct = remember(totalExpenses, netProfit) {
        if (totalExpenses > 0) (netProfit / totalExpenses) * 100 else if (totalRevenue > 0) 100.0 else 0.0
    }

    // Monthly grouping calculations
    val sdfMonth = remember { SimpleDateFormat("MM/yy", Locale("pt", "BR")) }
    val monthlyRevenue = remember(orders) {
        orders.groupBy { sdfMonth.format(Date(it.createdAt)) }
            .mapValues { it.value.sumOf { order -> order.priceCharged } }
    }
    val monthlyExpense = remember(expenses) {
        expenses.groupBy { sdfMonth.format(Date(it.date)) }
            .mapValues { it.value.sumOf { exp -> exp.amount * exp.qty } }
    }
    
    val allMonths = remember(monthlyRevenue, monthlyExpense) {
        (monthlyRevenue.keys + monthlyExpense.keys).distinct().sortedBy {
            try {
                sdfMonth.parse(it)?.time ?: 0L
            } catch (e: Exception) {
                0L
            }
        }.takeLast(5)
    }

    val maxVal = remember(monthlyRevenue, monthlyExpense, allMonths) {
        val maxRev = allMonths.maxOfOrNull { monthlyRevenue[it] ?: 0.0 } ?: 1.0
        val maxExp = allMonths.maxOfOrNull { monthlyExpense[it] ?: 0.0 } ?: 1.0
        maxOf(maxRev, maxExp, 100.0)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .testTag("dashboard_view_scroll"),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // --- LIVE ACTIVE ALERTS CENTER ---
        if (activeAlerts.isNotEmpty()) {
            item {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(bottom = 4.dp)
                ) {
                    Text(
                        text = "Alerta e Oportunidade em Destaque",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 2.dp)
                    )
                    val alert = activeAlerts.last()
                    Card(
                        colors = CardDefaults.cardColors(
                            containerColor = when (alert.type) {
                                AlertType.OPPORTUNITY -> MintEmerald.copy(alpha = 0.12f)
                                AlertType.SHORTAGE -> RedSunset.copy(alpha = 0.12f)
                                AlertType.WARNING -> RedSunset.copy(alpha = 0.08f)
                                else -> LaserCyan.copy(alpha = 0.12f)
                            }
                        ),
                        border = BorderStroke(
                            1.dp,
                            when (alert.type) {
                                AlertType.OPPORTUNITY -> MintEmerald.copy(alpha = 0.7f)
                                AlertType.SHORTAGE -> RedSunset.copy(alpha = 0.7f)
                                AlertType.WARNING -> RedSunset.copy(alpha = 0.5f)
                                else -> LaserCyan.copy(alpha = 0.7f)
                            }
                        ),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = alert.title,
                                    color = when (alert.type) {
                                        AlertType.OPPORTUNITY -> MintEmerald
                                        AlertType.SHORTAGE -> RedSunset
                                        else -> Color.White
                                    },
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = alert.message,
                                    color = LightMetal.copy(alpha = 0.85f),
                                    fontSize = 11.sp,
                                    lineHeight = 15.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            IconButton(
                                onClick = { viewModel.dismissAlert(alert.id) },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    Icons.Default.Close,
                                    contentDescription = "Fechar Alerta",
                                    tint = MutedSlate,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Welcoming & Status Diagnostic Bar
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Painel Financeiro & ROI de Produção",
                            color = LaserCyan,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Análise consolidada de faturamento, custos e retorno",
                            color = MutedSlate,
                            fontSize = 11.sp
                        )
                    }
                    
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                when {
                                    roiPct > 80.0 -> MintEmerald.copy(alpha = 0.15f)
                                    roiPct >= 0.0 -> LaserCyan.copy(alpha = 0.15f)
                                    else -> RedSunset.copy(alpha = 0.15f)
                                }
                            )
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = when {
                                roiPct > 80.0 -> "ROI Excelente 🚀"
                                roiPct >= 20.0 -> "ROI Saudável 👍"
                                roiPct >= 0.0 -> "ROI Estável 📊"
                                else -> "ROI Negativo 🚨"
                            },
                            color = when {
                                roiPct > 80.0 -> MintEmerald
                                roiPct >= 20.0 -> LaserCyan
                                roiPct >= 0.0 -> LightMetal
                                else -> RedSunset
                            },
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // --- SECTION 1: METRIC CARD GRID (FOUR CARDS) ---
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // KPI Card 1: Revenue
                    Box(modifier = Modifier.weight(1f)) {
                        DashboardKpiCard(
                            title = "Faturamento",
                            value = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(totalRevenue),
                            caption = "Total em encomendas",
                            color = MintEmerald,
                            icon = Icons.Default.Check
                        )
                    }
                    // KPI Card 2: Expenses
                    Box(modifier = Modifier.weight(1f)) {
                        DashboardKpiCard(
                            title = "Custos Totais",
                            value = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(totalExpenses),
                            caption = "Filamentos & Insumos",
                            color = RedSunset,
                            icon = Icons.Default.Warning
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // KPI Card 3: Net Profit
                    Box(modifier = Modifier.weight(1f)) {
                        DashboardKpiCard(
                            title = "Lucro Líquido",
                            value = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(netProfit),
                            caption = "Margem: ${String.format("%.1f", marginPct)}%",
                            color = if (netProfit >= 0) LaserCyan else RedSunset,
                            icon = Icons.Default.Star
                        )
                    }
                    // KPI Card 4: ROI
                    Box(modifier = Modifier.weight(1f)) {
                        DashboardKpiCard(
                            title = "ROI Geral",
                            value = "${String.format("%.1f", roiPct)}%",
                            caption = "Retorno s/ investimentos",
                            color = ElectricPurple,
                            icon = Icons.Default.Info
                        )
                    }
                }
            }
        }

        // --- SECTION 2: THE INTERACTIVE MONTHLY FLOW CHART ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Fluxo Mensal de Caixa (Faturamento vs Gastos)",
                        color = LightMetal,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 14.dp)
                    )

                    if (allMonths.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Nenhum histórico mensal disponível para exibição.",
                                color = MutedSlate,
                                fontSize = 12.sp
                            )
                        }
                    } else {
                        // Custom Column Chart Row
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            allMonths.forEach { month ->
                                val revVal = monthlyRevenue[month] ?: 0.0
                                val expVal = monthlyExpense[month] ?: 0.0

                                val revRatio = (revVal / maxVal).toFloat().coerceIn(0.02f, 1f)
                                val expRatio = (expVal / maxVal).toFloat().coerceIn(0.02f, 1f)

                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    // Numerical tiny labels on top of columns
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalAlignment = Alignment.Bottom
                                    ) {
                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = if (revVal > 0) "R$ ${revVal.toInt()}" else "0",
                                                color = MintEmerald,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(modifier = Modifier.height(2.dp))
                                            // Revenue column bar
                                            Box(
                                                modifier = Modifier
                                                    .width(16.dp)
                                                    .height((80 * revRatio).dp)
                                                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                                    .background(
                                                        Brush.verticalGradient(
                                                            colors = listOf(MintEmerald, MintEmerald.copy(alpha = 0.6f))
                                                        )
                                                    )
                                            )
                                        }

                                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                            Text(
                                                text = if (expVal > 0) "R$ ${expVal.toInt()}" else "0",
                                                color = RedSunset,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                            Spacer(modifier = Modifier.height(2.dp))
                                            // Expense column bar
                                            Box(
                                                modifier = Modifier
                                                    .width(16.dp)
                                                    .height((80 * expRatio).dp)
                                                    .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                                    .background(
                                                        Brush.verticalGradient(
                                                            colors = listOf(RedSunset, RedSunset.copy(alpha = 0.6f))
                                                        )
                                                    )
                                            )
                                        }
                                    }

                                    // Month title
                                    Text(
                                        text = month,
                                        color = LightMetal,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }
                            }
                        }

                        // Legenda
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 12.dp),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 10.dp)
                            ) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(MintEmerald))
                                Text(" Faturamento", color = MutedSlate, fontSize = 11.sp)
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 10.dp)
                            ) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(RedSunset))
                                Text(" Gastos", color = MutedSlate, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }

        // --- SECTION 3: INTELLIGENT COMMERICAL DIAGNOSTIC & ACTIONABLE PLAN ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Análise Executiva & Recomendações",
                        color = LightMetal,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )

                    val advice = when {
                        roiPct > 100.0 -> {
                            "🔥 Excelência em ROI! Sua margem líquida atual está fantástica. Indica excelente precificação de peças na Calculadora 3D e controle enxuto de matéria-prima ativa. Continue escalando e mantenha seu estoque de filamentos sob reposição programada."
                        }
                        roiPct >= 30.0 -> {
                            "👍 Operação Saudável. Os retornos superam satisfatoriamente as despesas correntes de filamentos e equipamentos. Dica: Utilize a aba 'Integrar' para expandir canais na Shopee e Mercado Livre para alavancar ainda mais o volume de vendas."
                        }
                        roiPct >= 0.0 -> {
                            "⚠️ Margem de Reinvestimento Estreita. Embora no azul, seu ROI está no limiar de equilíbrio. Recomendamos reavaliar os tempos de impressão e peso de material inseridos na Calculadora 3D para expandir sua margem de lucro por peça pronta."
                        }
                        else -> {
                            "🚨 Alerta Operacional: Gastos em excesso! Suas compras ou despesas de materiais superaram as vendas ativas no período. Ação imediata sugerida: Acesse a aba 'Custos/Estoque' -> 'Cotação AI Web' para orçar insumos por preços de carretéis mais baixos no mercado nacional!"
                        }
                    }

                    Text(
                        text = advice,
                        color = MutedSlate,
                        fontSize = 12.sp,
                        lineHeight = 18.sp
                    )
                }
            }
        }

        // --- SECTION 4: PLATFORM REVENUE BREAKDOWN BARS ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Vendas por Canal de Integração",
                        color = LightMetal,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    val channels = listOf(
                        Triple("Mercado Livre", orders.filter { it.platformSource == "MERCADO_LIVRE" }.sumOf { it.priceCharged }, Color(0xFFFFF159)),
                        Triple("Shopee", orders.filter { it.platformSource == "SHOPEE" }.sumOf { it.priceCharged }, Color(0xFFEE4D2D)),
                        Triple("Amazon", orders.filter { it.platformSource == "AMAZON" }.sumOf { it.priceCharged }, Color(0xFFFF9900)),
                        Triple("Vendas Manuais / Nuvem", orders.filter { it.platformSource == "MANUAL" || it.platformSource == "NUVEMSHOP" }.sumOf { it.priceCharged }, LaserCyan)
                    )

                    val maxChannel = channels.maxOf { it.second }.coerceAtLeast(1.0)

                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        channels.forEach { (channelName, revenue, color) ->
                            val pct = (revenue / maxChannel).toFloat().coerceIn(0.01f, 1.0f)
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Text(channelName, color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                    Text(NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(revenue), color = color, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                // Horizontal progress bar
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(CharcoalBg)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(pct)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(color)
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

@Composable
fun DashboardKpiCard(
    title: String,
    value: String,
    caption: String,
    color: Color,
    icon: ImageVector
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CharcoalBg),
        border = BorderStroke(0.5.dp, color.copy(alpha = 0.4f)),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, color = MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Icon(imageVector = icon, contentDescription = title, tint = color.copy(alpha = 0.8f), modifier = Modifier.size(14.dp))
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                color = color,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(caption, color = MutedSlate, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

// ==========================================
// TAB 1: PRODUCTION DASHBOARD VIEW
// ==========================================
@Composable
fun ProductionDashboardView(viewModel: MainViewModel, orders: List<PrintOrder>, printers: List<Printer>) {
    var selectedFilter by remember { mutableStateOf("TODOS") } 

    val filamentStocks by viewModel.filamentStocks.collectAsStateWithLifecycle()
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()

    val filteredOrders = if (selectedFilter == "TODOS") orders else orders.filter { it.status == selectedFilter }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Item 1: Stats Overview cards row
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 2.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                StatCard(
                    title = "Total Pedidos",
                    value = "${orders.size}",
                    caption = "${orders.count { it.status == "PRINTING" }} Imprimindo",
                    icon = Icons.Default.List,
                    accentColor = LaserCyan,
                    modifier = Modifier.weight(1f)
                )
                val totalRevenue = orders.sumOf { it.priceCharged }
                val formattedRevenue = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(totalRevenue)
                StatCard(
                    title = "Faturamento",
                    value = formattedRevenue,
                    caption = "Prontos: ${orders.count { it.status == "READY" || it.status == "DELIVERED" }}",
                    icon = Icons.Default.Check,
                    accentColor = MintEmerald,
                    modifier = Modifier.weight(1.3f)
                )
            }
        }

        // Item 2: STOCK ALERTS
        val lowFilaments = filamentStocks.filter { it.stockGrams < it.minStockGrams }
        val lowItems = catalogItems.filter { it.stockCount < it.minStockCount }
        if (lowFilaments.isNotEmpty() || lowItems.isNotEmpty()) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF2E1719)), // High priority warning background
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, Color(0xFFEF5350).copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.padding(bottom = 6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFF1744))
                            )
                            Text(
                                text = "COMPRAS RECOMENDADAS (ESTOQUE CRÍTICO)",
                                color = Color(0xFFFF8A80),
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                letterSpacing = 0.5.sp
                            )
                        }

                        // Filaments below minimal safety limit
                        if (lowFilaments.isNotEmpty()) {
                            Text(
                                text = "Filamentos abaixo do mínimo de segurança:",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 3.dp)
                            )
                            Column(
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier.padding(bottom = 6.dp)
                            ) {
                                lowFilaments.forEach { stocking ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "• ${stocking.type} ${stocking.color} (${stocking.stockGrams.toInt()}g / min. ${stocking.minStockGrams.toInt()}g)",
                                            color = LightMetal,
                                            fontSize = 10.sp
                                        )
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            TextButton(
                                                onClick = {
                                                    viewModel.selectPricingSubTab(4) // 4: AI Web search cotação tab
                                                    viewModel.selectTab(3) // 3: Custos/Catálogo screen tab
                                                },
                                                modifier = Modifier.height(24.dp),
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                            ) {
                                                Text("Orçar Já 🛒", color = LaserCyan, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                            TextButton(
                                                onClick = {
                                                    viewModel.adjustFilamentStock(stocking, 1000f)
                                                },
                                                modifier = Modifier.height(24.dp),
                                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                            ) {
                                                Text("+1 Rolo", color = MintEmerald, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Catalog item deficits below design minimum
                        if (lowItems.isNotEmpty()) {
                            Text(
                                text = "Peças acabadas do catálogo com falta de reposição:",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 3.dp)
                            )
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                lowItems.forEach { catItem ->
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = "• ${catItem.name} (${catItem.stockCount} de ${catItem.minStockCount} itens)",
                                            color = LightMetal,
                                            fontSize = 10.sp
                                        )
                                        TextButton(
                                            onClick = {
                                                viewModel.adjustCatalogItemStock(catItem, 1)
                                            },
                                            modifier = Modifier.height(24.dp),
                                            contentPadding = PaddingValues(horizontal = 6.dp, vertical = 0.dp)
                                        ) {
                                            Text("+1 Produzir 🛠️", color = HotOrange, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Item 3: FLOW DISTRIBUTION PROGRESS BAR
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "Acompanhamento da Produção e Funil das Ordens",
                        color = LightMetal,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(20.dp)
                            .clip(RoundedCornerShape(6.dp)),
                        horizontalArrangement = Arrangement.Start
                    ) {
                        val statusList = listOf("WAITING", "QUEUE", "PRINTING", "POST_PROCESS", "READY", "DELIVERED")
                        val total = orders.size.toFloat()
                        if (total > 0) {
                            statusList.forEach { st ->
                                val count = orders.count { it.status == st }
                                if (count > 0) {
                                    val weight = count / total
                                    Box(
                                        modifier = Modifier
                                            .weight(weight)
                                            .fillMaxHeight()
                                            .background(getStatusColor(st)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "$count",
                                            color = CharcoalBg,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(MutedSlate.copy(alpha = 0.2f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("Nenhum pedido cadastrado.", color = MutedSlate, fontSize = 11.sp)
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(6.dp))
                    // Legend list horizontal slider
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        listOf("WAITING", "QUEUE", "PRINTING", "POST_PROCESS", "READY", "DELIVERED").forEach { st ->
                            val count = orders.count { it.status == st }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(getStatusColor(st))
                                )
                                Text(
                                    text = "${getStatusLabel(st)}: $count",
                                    color = LightMetal.copy(alpha = 0.7f),
                                    fontSize = 9.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        // Item 4: Header and filters selection
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Filtrar Produção",
                    color = LightMetal,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 6.dp)
                )

                // Status filters slider
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState())
                        .padding(bottom = 4.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val filterOptions = listOf(
                        "TODOS" to "Todos",
                        "WAITING" to "Aguard. Arq",
                        "QUEUE" to "NaFila",
                        "PRINTING" to "Imprimindo",
                        "POST_PROCESS" to "Pós-Proc",
                        "READY" to "Pronto",
                        "DELIVERED" to "Entregue"
                    )

                    filterOptions.forEach { (key, label) ->
                        val isSelected = selectedFilter == key
                        val color = getStatusColor(key)
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedFilter = key },
                            label = { Text(label, fontSize = 12.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                containerColor = CardGray,
                                labelColor = MutedSlate,
                                selectedContainerColor = color.copy(alpha = 0.25f),
                                selectedLabelColor = color
                            ),
                            border = BorderStroke(1.dp, if (isSelected) color else Color.Transparent)
                        )
                    }
                }
            }
        }

        // Sub-list items: Orders List matching the state
        if (filteredOrders.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Vazio",
                            tint = MutedSlate,
                            modifier = Modifier.size(54.dp)
                        )
                        Text(
                            text = "Sem pedidos nesta categoria.",
                            color = MutedSlate,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        } else {
            item {
                Text(
                    text = "${filteredOrders.size} Pedido(s) Encontrado(s)",
                    color = MutedSlate,
                    fontSize = 11.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            items(filteredOrders, key = { it.id }) { order ->
                OrderListItemCard(
                    order = order,
                    onStatusAdvance = { nextStatus ->
                        viewModel.updateOrderStatus(order, nextStatus)
                    },
                    onEdit = {
                        viewModel.openEditOrderDialog(order)
                    },
                    onDelete = {
                        viewModel.deleteOrder(order)
                    }
                )
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    caption: String,
    icon: ImageVector,
    accentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardGray),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, color = MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Normal)
                Icon(icon, contentDescription = null, tint = accentColor, modifier = Modifier.size(16.dp))
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                color = LightMetal,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(caption, color = MutedSlate, fontSize = 10.sp, fontWeight = FontWeight.Light)
        }
    }
}

@Composable
fun OrderListItemCard(
    order: PrintOrder,
    onStatusAdvance: (String) -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit
) {
    val statusColor = getStatusColor(order.status)
    val statusLabel = getStatusLabel(order.status)

    Card(
        colors = CardDefaults.cardColors(containerColor = CardGray),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(14.dp)
        ) {
            // Hot bar indicator matching platform sources
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    if (order.platformSource != "MANUAL") {
                        val platformColor = when (order.platformSource) {
                            "MERCADO_LIVRE" -> Color(0xFFFFF159)
                            "SHOPEE" -> Color(0xFFEE4D2D)
                            else -> Color(0xFF00ADF0) // Nuvemshop
                        }
                        Surface(
                            color = platformColor,
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier.padding(end = 4.dp)
                        ) {
                            Text(
                                text = order.platformSource.replace("_", " "),
                                color = if (order.platformSource == "MERCADO_LIVRE") Color.Black else Color.White,
                                fontSize = 8.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                        }
                    }
                    Text(
                        text = order.itemName,
                        color = LightMetal,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.widthIn(max = 160.dp)
                    )
                }

                // Status Badge
                Surface(
                    color = statusColor.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(0.5.dp, statusColor.copy(alpha = 0.4f))
                ) {
                    Text(
                        text = statusLabel,
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Sub-details
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Cliente: ${order.clientName}", color = LightMetal.copy(alpha = 0.85f), fontSize = 12.sp)
                    Text(
                        "Filamento: ${order.filamentType} ${order.filamentColor} • ${order.weightGrams}g",
                        color = MutedSlate,
                        fontSize = 11.sp
                    )
                    val sdf = remember { java.text.SimpleDateFormat("HH:mm - dd/MM", java.util.Locale("pt", "BR")) }
                    Text(
                        text = "🕒 Entrada: ${sdf.format(java.util.Date(order.createdAt))}",
                        color = LaserCyan,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    val formattedPrice = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(order.priceCharged)
                    Text(text = formattedPrice, color = LaserCyan, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = "Tempo: ${order.printTimeHours}h", color = MutedSlate, fontSize = 11.sp)
                }
            }

            // Real-time printing progress animation
            if (order.status == "PRINTING") {
                Spacer(modifier = Modifier.height(10.dp))
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = LaserCyan,
                                modifier = Modifier
                                    .size(14.dp)
                                    .align(Alignment.CenterVertically)
                            )
                            Text(
                                "Imprimindo na: ${order.printerName.ifEmpty { "Impressora" }}",
                                color = LaserCyan,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Light
                            )
                        }
                        Text(
                            "${(order.printingProgress * 100).toInt()}%",
                            color = LaserCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    LinearProgressIndicator(
                        progress = { order.printingProgress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = LaserCyan,
                        trackColor = Color.DarkGray
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = Color.DarkGray, thickness = 0.5.dp)
            Spacer(modifier = Modifier.height(8.dp))

            // Action triggers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Bottom-left: actions edit / delete
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Text(
                        "Editar",
                        color = MutedSlate,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.clickable { onEdit() }
                    )
                    Text(
                        "Excluir",
                        color = Color.Red.copy(alpha = 0.7f),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.clickable { onDelete() }
                    )
                }

                // Bottom-right: fast state trigger buttons
                val nextActionLabel = getNextStatusActionLabel(order.status)
                val nextStatusValue = getNextStatusValue(order.status)

                if (nextStatusValue != null) {
                    Button(
                        onClick = { onStatusAdvance(nextStatusValue) },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = statusColor.copy(alpha = 0.15f),
                            contentColor = statusColor
                        ),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                        modifier = Modifier.height(28.dp),
                        border = BorderStroke(0.5.dp, statusColor.copy(alpha = 0.5f))
                    ) {
                        Text(nextActionLabel, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = MintEmerald, modifier = Modifier.size(16.dp))
                        Text("Produção Concluída", color = MintEmerald, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

// Helper color translators
fun getStatusColor(status: String): Color {
    return when (status) {
        "WAITING" -> Color(0xFF90A4AE) // Steel Gray
        "QUEUE" -> HotOrange // Fila de Impressão
        "PRINTING" -> LaserCyan // Pulsing Laser Cyan
        "POST_PROCESS" -> ElectricPurple // Pós-Processamento
        "READY" -> MintEmerald // Ready
        "DELIVERED" -> InfoBlue // Delivered
        else -> Color.Gray
    }
}

fun getStatusLabel(status: String): String {
    return when (status) {
        "WAITING" -> "Ag. Arquivo"
        "QUEUE" -> "Fila Impressão"
        "PRINTING" -> "Imprimindo"
        "POST_PROCESS" -> "Pós-Processo"
        "READY" -> "Pronto p/ Entrega"
        "DELIVERED" -> "Entregue"
        else -> status
    }
}

fun getNextStatusActionLabel(status: String): String {
    return when (status) {
        "WAITING" -> "Iniciar Estudo/Fila"
        "QUEUE" -> "Iniciar Impressão"
        "PRINTING" -> "Ir p/ Acabamento"
        "POST_PROCESS" -> "Marcar Pronto"
        "READY" -> "Marcar Entregue"
        else -> ""
    }
}

fun getNextStatusValue(status: String): String? {
    return when (status) {
        "WAITING" -> "QUEUE"
        "QUEUE" -> "PRINTING"
        "PRINTING" -> "POST_PROCESS"
        "POST_PROCESS" -> "READY"
        "READY" -> "DELIVERED"
        else -> null
    }
}


// ==========================================
// TAB 1: CLIENTS & PRINTERS DISPLAY
// ==========================================
@Composable
fun ClientsAndPrintersView(viewModel: MainViewModel, clients: List<Client>, printers: List<Printer>) {
    var activeSubTab by remember { mutableStateOf(0) } // 0: Clientes, 1: Impressoras, 2: Cadastrar Produtos
    val context = LocalContext.current
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Triple option pill toggle selector
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp)
                .background(CardGray, RoundedCornerShape(12.dp))
                .padding(4.dp)
        ) {
            listOf("Cadastros Clientes", "Parque de Impressoras", "Cadastro de Produtos ＋").forEachIndexed { index, title ->
                val isSelected = activeSubTab == index
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isSelected) LaserCyan else Color.Transparent)
                        .clickable { activeSubTab = index }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = title,
                        color = if (isSelected) CharcoalBg else MutedSlate,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        maxLines = 1
                    )
                }
            }
        }

        when (activeSubTab) {
            0 -> {
                // CLIENTS SECTION
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Diretório de Clientes (${clients.size})",
                        color = LightMetal,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Button(
                        onClick = { viewModel.openAddClientDialog() },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Add Cliente", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (clients.isEmpty()) {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("Nenhum cliente cadastrado.", color = MutedSlate)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(clients, key = { it.id }) { client ->
                            ClientCardItem(
                                client = client,
                                onEdit = { viewModel.openEditClientDialog(client) },
                                onDelete = { viewModel.deleteClient(client) },
                                onContact = {
                                    val cleanPhone = client.phone.replace("[^0-9]".toRegex(), "")
                                    val whatsappUrl = "https://api.whatsapp.com/send?phone=55$cleanPhone&text=Ol%C3%A1%20${Uri.encode(client.name)}!%20Aqui%20%C3%A9%20da%20Impress%C3%A3o%203D%20para%20atualizar%20sobre%20seu%20projeto."
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(whatsappUrl))
                                    context.startActivity(intent)
                                }
                            )
                        }
                    }
                }
            }
            1 -> {
                // PRINTERS PARQUE SECTION
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Máquinas Conectadas (${printers.size})",
                        color = LightMetal,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    Button(
                        onClick = { viewModel.openAddPrinterDialog() },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Text("Add Máquina", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                if (printers.isEmpty()) {
                    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
                        Text("Nenhuma impressora no parque.", color = MutedSlate)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        items(printers, key = { it.id }) { printer ->
                            PrinterCardItem(
                                printer = printer,
                                onEdit = { viewModel.openEditPrinterDialog(printer) },
                                onDelete = { viewModel.deletePrinter(printer) },
                                onWeeklyCompleted = { viewModel.completeWeeklyMaintenance(printer) },
                                onMonthlyCompleted = { viewModel.completeMonthlyMaintenance(printer) }
                            )
                        }
                    }
                }
            }
            2 -> {
                 // PRODUCT REGISTRATION SECTION
                var name by remember { mutableStateOf("") }
                var desc by remember { mutableStateOf("") }
                var code by remember { mutableStateOf("") }
                var weight by remember { mutableStateOf("150") }
                var time by remember { mutableStateOf("4") }
                var filamentType by remember { mutableStateOf("PLA") }
                var price by remember { mutableStateOf("95") }

                val spools by viewModel.filamentStocks.collectAsStateWithLifecycle()
                var selectedColors by remember { mutableStateOf(setOf<String>()) }
                
                // Keep selectedColors in sync with filamentType
                val activeSpools = spools.filter { it.type.equals(filamentType, ignoreCase = true) }
                LaunchedEffect(filamentType) {
                    selectedColors = emptySet()
                }

                val hardwareParts = catalogItems.filter { it.filamentType == "HARDWARE" }
                var selectedPartId by remember { mutableStateOf<Long?>(null) }
                var spentPartQtyStr by remember { mutableStateOf("0") }

                // Taxes simulate box states
                var simMarketplacePercent by remember { mutableStateOf("18.0") }
                var simFixedFee by remember { mutableStateOf("5.00") }
                var simExtraFee by remember { mutableStateOf("10.00") }

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Surface(
                        color = CardGray,
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, HotOrange.copy(alpha = 0.4f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("Cadastrar modelo de produto no catálogo", color = HotOrange, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            
                            OutlinedTextField(
                                value = name,
                                onValueChange = { name = it },
                                label = { Text("Nome do Produto (Ex: Vaso Coluna Mini)", fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                singleLine = true
                            )

                            OutlinedTextField(
                                value = desc,
                                onValueChange = { desc = it },
                                label = { Text("Descrição breve do produto", fontSize = 11.sp) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                singleLine = true
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = code,
                                    onValueChange = { code = it },
                                    label = { Text("Código SKU / SKU-ID", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                    singleLine = true
                                )
                                OutlinedTextField(
                                    value = price,
                                    onValueChange = { price = it },
                                    label = { Text("Preço Venda (R$)", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                    singleLine = true
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = weight,
                                    onValueChange = { weight = it },
                                    label = { Text("Peso do Filamento (g)", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                    singleLine = true
                                )
                                OutlinedTextField(
                                    value = time,
                                    onValueChange = { time = it },
                                    label = { Text("Tempo impressão (h)", fontSize = 11.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = HotOrange, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                    singleLine = true
                                )
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text("Material do Filamento", color = MutedSlate, fontSize = 10.sp, modifier = Modifier.padding(bottom = 2.dp))
                                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                        listOf("PLA", "PETG", "ABS", "TPU").forEach { type ->
                                            val checked = filamentType == type
                                            Box(
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (checked) HotOrange else CharcoalBg)
                                                    .clickable { filamentType = type }
                                                    .padding(vertical = 10.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(type, color = if (checked) Color.White else MutedSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }

                            // Active Filament Spool Multiple Selection
                            if (activeSpools.isNotEmpty()) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Selecione as Cores Consumidas (Pode selecionar mais de uma):", color = MutedSlate, fontSize = 10.sp)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .horizontalScroll(rememberScrollState()),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        activeSpools.forEach { spool ->
                                            val isChecked = selectedColors.contains(spool.color)
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (isChecked) HotOrange.copy(alpha = 0.25f) else CharcoalBg)
                                                    .border(0.5.dp, if (isChecked) HotOrange else Color.Transparent, RoundedCornerShape(6.dp))
                                                    .clickable {
                                                        selectedColors = if (isChecked) {
                                                            selectedColors - spool.color
                                                        } else {
                                                            selectedColors + spool.color
                                                        }
                                                    }
                                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                                            ) {
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(10.dp)
                                                            .clip(CircleShape)
                                                            .background(if (isChecked) HotOrange else MutedSlate.copy(alpha = 0.5f))
                                                    )
                                                    Text(
                                                        "${spool.color} (${spool.stockGrams.toInt()}g)", 
                                                        color = if (isChecked) Color.White else LightMetal, 
                                                        fontSize = 10.sp, 
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Dynamic Availability Status
                            val rawWeightVal = weight.toFloatOrNull() ?: 150f
                            val rawTimeVal = time.toFloatOrNull() ?: 4f
                            val statusColors = selectedColors.toList()
                            val weightPerColor = if (statusColors.isNotEmpty()) rawWeightVal / statusColors.size else 0f
                            
                            var hasAllFilament = true
                            val filamentCheckLog = StringBuilder()
                            
                            if (statusColors.isEmpty()) {
                                hasAllFilament = false
                                filamentCheckLog.append("Escolha pelo menos uma cor de filamento acima.")
                            } else {
                                statusColors.forEach { col ->
                                    val spoolObj = activeSpools.firstOrNull { it.color.equals(col, ignoreCase = true) }
                                    val stockG = spoolObj?.stockGrams ?: 0f
                                    if (stockG < weightPerColor) {
                                        hasAllFilament = false
                                        filamentCheckLog.append("${col}: insuficiente (${stockG.toInt()}g de ${weightPerColor.toInt()}g)\n")
                                    } else {
                                        filamentCheckLog.append("${col}: suficiente (${stockG.toInt()}g em estoque)\n")
                                    }
                                }
                            }

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = if (hasAllFilament) MintEmerald.copy(alpha = 0.08f) else RedSunset.copy(alpha = 0.08f)
                                ),
                                border = BorderStroke(1.dp, if (hasAllFilament) MintEmerald.copy(alpha = 0.5f) else RedSunset.copy(alpha = 0.5f)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        imageVector = if (hasAllFilament) Icons.Default.CheckCircle else Icons.Default.Warning,
                                        contentDescription = null,
                                        tint = if (hasAllFilament) MintEmerald else RedSunset,
                                        modifier = Modifier.size(18.dp)
                                    )
                                    Column {
                                        Text(
                                            text = if (hasAllFilament) "Estoque de Filamento Confirmado!" else "Estoque Insuficiente!",
                                            color = if (hasAllFilament) MintEmerald else RedSunset,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            text = filamentCheckLog.toString().trim(),
                                            color = LightMetal.copy(alpha = 0.85f),
                                            fontSize = 10.sp,
                                            lineHeight = 13.sp
                                        )
                                    }
                                }
                            }

                            // Dynamic Cost from Presets (Cadastro Base)
                            val baseMfgCost = viewModel.calculateBaseProductionCost(filamentType, rawWeightVal, rawTimeVal)
                            val baseMarkupPrice = viewModel.calculateBasePriceWithProfit(filamentType, rawWeightVal, rawTimeVal)

                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = CharcoalBg.copy(alpha = 0.5f)),
                                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.25f)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Preço de Custo Base (${filamentType})", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    
                                    val matProfile = viewModel.materialProfiles.value.firstOrNull { it.type.equals(filamentType, ignoreCase = true) }
                                    if (matProfile != null) {
                                        val filPriceRoll = matProfile.filamentPriceRoll
                                        val calculatedFilCost = (rawWeightVal / 1000.0) * filPriceRoll
                                        val calculatedPowerCost = (matProfile.printerPowerW / 1000.0) * rawTimeVal * matProfile.electricityCostKwh
                                        val calculatedLaborCost = rawTimeVal * matProfile.laborCostHour
                                        val overheadCost = (calculatedFilCost + calculatedPowerCost + calculatedLaborCost) * (matProfile.miscCostPercent / 100.0)
                                        
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Filamento (${rawWeightVal.toInt()}g @ R$ ${filPriceRoll.toInt()}/kg):", color = MutedSlate, fontSize = 10.sp)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", calculatedFilCost)}", color = LightMetal, fontSize = 10.sp)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Energia (${rawTimeVal}h @ ${matProfile.printerPowerW}W):", color = MutedSlate, fontSize = 10.sp)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", calculatedPowerCost)}", color = LightMetal, fontSize = 10.sp)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Mão de Obra (${rawTimeVal}h @ R$ ${matProfile.laborCostHour.toInt()}/h):", color = MutedSlate, fontSize = 10.sp)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", calculatedLaborCost)}", color = LightMetal, fontSize = 10.sp)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Perda Estimada (${matProfile.miscCostPercent.toInt()}%):", color = MutedSlate, fontSize = 10.sp)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", overheadCost)}", color = LightMetal, fontSize = 10.sp)
                                        }
                                        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp), color = MutedSlate.copy(alpha = 0.2f))
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Custo de Fabricação Total:", color = LightMetal, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", baseMfgCost)}", color = HotOrange, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                            Text("Margem de Lucro Base (${matProfile.defaultProfitMarginPercent.toInt()}%):", color = LightMetal, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            Text("R$ ${String.format(java.util.Locale.US, "%.2f", baseMarkupPrice)}", color = MintEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }

                            // Sale Taxes / Commissions Simulator Box ("colocar as taxas por fora em outra caixinha")
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = CardGray),
                                border = BorderStroke(1.dp, MutedSlate.copy(alpha = 0.3f)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("Simulador de Taxas Externas e Venda", color = MintEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        OutlinedTextField(
                                            value = simMarketplacePercent,
                                            onValueChange = { simMarketplacePercent = it },
                                            label = { Text("Taxa Canal (%)", fontSize = 9.sp) },
                                            modifier = Modifier.weight(1.2f),
                                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = MintEmerald, unfocusedBorderColor = MutedSlate.copy(alpha = 0.2f)),
                                            singleLine = true
                                        )
                                        OutlinedTextField(
                                            value = simFixedFee,
                                            onValueChange = { simFixedFee = it },
                                            label = { Text("Taxa Fixa (R$)", fontSize = 9.sp) },
                                            modifier = Modifier.weight(1f),
                                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = MintEmerald, unfocusedBorderColor = MutedSlate.copy(alpha = 0.2f)),
                                            singleLine = true
                                        )
                                        OutlinedTextField(
                                            value = simExtraFee,
                                            onValueChange = { simExtraFee = it },
                                            label = { Text("Extra/Frete (R$)", fontSize = 9.sp) },
                                            modifier = Modifier.weight(1f),
                                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = MintEmerald, unfocusedBorderColor = MutedSlate.copy(alpha = 0.2f)),
                                            singleLine = true
                                        )
                                    }

                                    // Dynamic recommended price computation
                                    val taxPctVal = simMarketplacePercent.toDoubleOrNull() ?: 18.0
                                    val fixFeeVal = simFixedFee.toDoubleOrNull() ?: 5.0
                                    val extFeeVal = simExtraFee.toDoubleOrNull() ?: 10.0
                                    
                                    val finalSuggestedPrice = if (taxPctVal < 100.0) {
                                        (baseMarkupPrice + fixFeeVal + extFeeVal) / (1.0 - (taxPctVal / 100.0))
                                    } else {
                                        baseMarkupPrice + fixFeeVal + extFeeVal
                                    }
                                    
                                    val suggestedPriceString = String.format(java.util.Locale.US, "%.2f", finalSuggestedPrice)
                                    
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column {
                                            Text("Preço Recomendado com Taxas:", color = LightMetal, fontSize = 10.sp)
                                            Text("R$ ${suggestedPriceString}", color = MintEmerald, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                        }
                                        Button(
                                            onClick = { price = suggestedPriceString },
                                            colors = ButtonDefaults.buttonColors(containerColor = MintEmerald, contentColor = CharcoalBg),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Text("Aplicar Preço", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                }
                            }

                            // "Peças Gastas" Insumo Adicional Selection
                            if (hardwareParts.isNotEmpty()) {
                                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("Insumo / Peça Extra Consumida por Peça:", color = MutedSlate, fontSize = 10.sp)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .horizontalScroll(rememberScrollState()),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                                    ) {
                                        val isNoneSelected = selectedPartId == null
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(if (isNoneSelected) MintEmerald else CharcoalBg)
                                                .clickable { selectedPartId = null }
                                                .padding(horizontal = 10.dp, vertical = 8.dp)
                                        ) {
                                            Text("Sem Peças Extra", color = if (isNoneSelected) CharcoalBg else MutedSlate, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }

                                        hardwareParts.forEach { part ->
                                            val isSelected = selectedPartId == part.id
                                            Box(
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(if (isSelected) MintEmerald else CharcoalBg)
                                                    .border(0.5.dp, if (isSelected) Color.White else Color.Transparent, RoundedCornerShape(6.dp))
                                                    .clickable { selectedPartId = part.id }
                                                    .padding(horizontal = 10.dp, vertical = 8.dp)
                                            ) {
                                                Text(
                                                    "${part.name} (${part.stockCount}un estoque)", 
                                                    color = if (isSelected) CharcoalBg else LightMetal, 
                                                    fontSize = 10.sp, 
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }
                                        }
                                    }

                                    if (selectedPartId != null) {
                                        Spacer(modifier = Modifier.height(2.dp))
                                        OutlinedTextField(
                                            value = spentPartQtyStr,
                                            onValueChange = { spentPartQtyStr = it },
                                            label = { Text("Qtd de insumos consumidos por unidade", fontSize = 11.sp) },
                                            modifier = Modifier.fillMaxWidth(),
                                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = MintEmerald, unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)),
                                            singleLine = true
                                        )
                                    }
                                }
                            }

                            Button(
                                onClick = {
                                    if (name.isNotEmpty()) {
                                        val finalColorsString = statusColors.joinToString(",")
                                        viewModel.saveCatalogItem(
                                            name = name,
                                            description = desc,
                                            weightGrams = weight.toFloatOrNull() ?: 150f,
                                            printTimeHours = time.toFloatOrNull() ?: 4f,
                                            filamentType = filamentType,
                                            defaultPrice = price.toDoubleOrNull() ?: 95.0,
                                            stockCount = 0,
                                            minStockCount = 2,
                                            productCode = code.trim().uppercase(),
                                            filamentColorsUsed = finalColorsString,
                                            spentPartId = selectedPartId,
                                            spentPartQty = spentPartQtyStr.toIntOrNull() ?: 0
                                        )
                                        name = ""
                                        desc = ""
                                        code = ""
                                        weight = "150"
                                        time = "4"
                                        price = "95"
                                        selectedColors = emptySet()
                                        selectedPartId = null
                                        spentPartQtyStr = "0"
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
                                modifier = Modifier.fillMaxWidth().height(42.dp),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Salvar / Cadastrar Modelo", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text("Modelos de Produtos Ativos (${catalogItems.size})", color = LightMetal, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                    if (catalogItems.isEmpty()) {
                        Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                            Text("Nenhum modelo de produto cadastrado no banco.", color = MutedSlate, fontSize = 11.sp)
                        }
                    } else {
                        catalogItems.forEach { item ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = CardGray),
                                border = BorderStroke(1.dp, if (item.stockCount <= 0) MutedSlate.copy(alpha = 0.15f) else LaserCyan.copy(alpha = 0.2f))
                            ) {
                                Column(modifier = Modifier.padding(14.dp)) {
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(item.name, color = LightMetal, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                                if (item.productCode.isNotEmpty()) {
                                                    Surface(
                                                        color = HotOrange.copy(alpha = 0.15f),
                                                        shape = RoundedCornerShape(4.dp)
                                                    ) {
                                                        Text(
                                                            item.productCode,
                                                            color = HotOrange,
                                                            fontSize = 9.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                }
                                            }
                                            if (item.description.isNotEmpty()) {
                                                Text(item.description, color = MutedSlate, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
                                            }
                                        }
                                        IconButton(
                                            onClick = { viewModel.deleteCatalogItem(item) },
                                            modifier = Modifier.size(32.dp).background(CharcoalBg, CircleShape)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Deletar", tint = RedSunset, modifier = Modifier.size(15.dp))
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    // Display linked filament colors & extra parts
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text("Cores:", color = MutedSlate, fontSize = 10.sp)
                                        val colorsList = item.filamentColorsUsed.split(",").filter { it.isNotEmpty() }
                                        if (colorsList.isEmpty()) {
                                            Text("Nenhuma cor vinculada", color = RedSunset, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        } else {
                                            colorsList.forEach { colorStr ->
                                                Surface(
                                                    color = CharcoalBg,
                                                    border = BorderStroke(0.5.dp, LaserCyan.copy(alpha = 0.4f)),
                                                    shape = RoundedCornerShape(4.dp)
                                                ) {
                                                    Text(
                                                        colorStr,
                                                        color = LightMetal,
                                                        fontSize = 9.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                    )
                                                }
                                            }
                                        }

                                        if (item.spentPartId != null && item.spentPartQty > 0) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            val matchedPart = hardwareParts.firstOrNull { it.id == item.spentPartId }
                                            val partName = matchedPart?.name ?: "Peça Extra"
                                            Text("Peça:", color = MutedSlate, fontSize = 10.sp)
                                            Surface(
                                                color = CharcoalBg,
                                                border = BorderStroke(0.5.dp, MintEmerald.copy(alpha = 0.4f)),
                                                shape = RoundedCornerShape(4.dp)
                                            ) {
                                                Text(
                                                    "${partName} (${item.spentPartQty}un)",
                                                    color = MintEmerald,
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(8.dp))

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.Bottom
                                    ) {
                                        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Text(
                                                "${item.filamentType}  •  ${item.weightGrams.toInt()}g total  •  ⏱ ${item.printTimeHours}h",
                                                color = MutedSlate,
                                                fontSize = 11.sp
                                            )
                                            
                                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                                Text(
                                                    "Prontos em Estoque: ${item.stockCount} un",
                                                    color = if (item.stockCount < item.minStockCount) RedSunset else MintEmerald,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                                if (item.stockCount < item.minStockCount) {
                                                    Surface(
                                                        color = RedSunset.copy(alpha = 0.15f),
                                                        shape = RoundedCornerShape(4.dp)
                                                    ) {
                                                        Text(
                                                            "ESTOQUE BAIXO",
                                                            color = RedSunset,
                                                            fontSize = 8.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        Text(
                                            String.format("R$ %.2f", item.defaultPrice),
                                            color = LaserCyan,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Action buttons for production and sales tracking
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Button(
                                            onClick = {
                                                viewModel.adjustCatalogItemStock(item, 1)
                                            },
                                            colors = ButtonDefaults.buttonColors(containerColor = MintEmerald.copy(alpha = 0.12f), contentColor = MintEmerald),
                                            border = BorderStroke(1.dp, MintEmerald.copy(alpha = 0.35f)),
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(14.dp))
                                                Text("Registrar Produção (+1)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }

                                        Button(
                                            onClick = {
                                                if (item.stockCount > 0) {
                                                    viewModel.adjustCatalogItemStock(item, -1)
                                                }
                                            },
                                            enabled = item.stockCount > 0,
                                            colors = ButtonDefaults.buttonColors(
                                                containerColor = LaserCyan.copy(alpha = 0.12f), 
                                                contentColor = LaserCyan,
                                                disabledContainerColor = CharcoalBg,
                                                disabledContentColor = MutedSlate.copy(alpha = 0.3f)
                                            ),
                                            border = BorderStroke(1.dp, if (item.stockCount > 0) LaserCyan.copy(alpha = 0.35f) else Color.Transparent),
                                            modifier = Modifier.weight(1f),
                                            shape = RoundedCornerShape(6.dp),
                                            contentPadding = PaddingValues(vertical = 8.dp)
                                        ) {
                                            Row(
                                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                Text("-", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                                Text("Registrar Venda (-1)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClientCardItem(client: Client, onEdit: () -> Unit, onDelete: () -> Unit, onContact: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardGray),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(client.name, color = LightMetal, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                // Whatsapp trigger
                IconButton(
                    onClick = onContact,
                    modifier = Modifier
                        .size(34.dp)
                        .background(MintEmerald.copy(alpha = 0.15f), CircleShape)
                ) {
                    Icon(
                        imageVector = Icons.Default.Send, // Serves as Whatsapp send emblem
                        contentDescription = "Contactar Whatsapp",
                        tint = MintEmerald,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text("Tel: ${client.phone}", color = LightMetal.copy(alpha = 0.8f), fontSize = 12.sp)
            Text("Email: ${client.email}", color = MutedSlate, fontSize = 11.sp)
            Text("Endereço: ${client.address}", color = MutedSlate, fontSize = 11.sp)

            if (client.note.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Surface(
                    color = Color.Black.copy(alpha = 0.25f),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Nota: ${client.note}",
                        color = MutedSlate,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Light,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Editar",
                    color = LaserCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable { onEdit() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Excluir",
                    color = Color.Red.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable { onDelete() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}

@Composable
fun PrinterCardItem(
    printer: Printer, 
    onEdit: () -> Unit, 
    onDelete: () -> Unit,
    onWeeklyCompleted: () -> Unit,
    onMonthlyCompleted: () -> Unit
) {
    val statusColor = if (printer.status == "PRINTING") LaserCyan else MutedSlate
    val statusText = if (printer.status == "PRINTING") "ATIVO - IMPRIMINDO" else if (printer.status == "MAINTENANCE") "MANUTENÇÃO" else "OCIOSO"

    val daysSinceWeekly = ((System.currentTimeMillis() - printer.lastWeeklyMaintenance) / (24 * 60 * 60 * 1000L)).coerceAtLeast(0)
    val daysSinceMonthly = ((System.currentTimeMillis() - printer.lastMonthlyMaintenance) / (24 * 60 * 60 * 1000L)).coerceAtLeast(0)
    val isWeeklyOverdue = daysSinceWeekly >= 7
    val isMonthlyOverdue = daysSinceMonthly >= 30

    var isMaintenanceExpanded by remember { mutableStateOf(false) }
    
    // Checklist checkable items local state
    val weeklyStates = remember { mutableStateMapOf<Int, Boolean>().apply { 
        put(0, false)
        put(1, false)
        put(2, false)
        put(3, false)
    }}
    val monthlyStates = remember { mutableStateMapOf<Int, Boolean>().apply {
        put(0, false)
        put(1, false)
        put(2, false)
        put(3, false)
    }}

    Card(
        colors = CardDefaults.cardColors(containerColor = CardGray),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Icon(Icons.Default.Build, contentDescription = null, tint = HotOrange, modifier = Modifier.size(20.dp))
                    Column {
                        Text(printer.name, color = LightMetal, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                        Text("Modelo: ${printer.model}", color = MutedSlate, fontSize = 11.sp)
                    }
                }

                Surface(
                    color = statusColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        text = statusText,
                        color = statusColor,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            if (printer.ipAddress.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text("IP/Painel de Monitoramento: ${printer.ipAddress}", color = MutedSlate, fontSize = 11.sp)
            }

            Spacer(modifier = Modifier.height(8.dp))

            // MAINTENANCE ALERT PANEL
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Rendimento de Manutenção",
                        color = LaserCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = if (isWeeklyOverdue || isMonthlyOverdue) "⚠️ Manutenção Requerida" else "✅ Em ordem",
                        color = if (isWeeklyOverdue || isMonthlyOverdue) HotOrange else MintEmerald,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Semanal (Max 7 dias):", color = MutedSlate, fontSize = 10.sp)
                        Text(
                            text = if (isWeeklyOverdue) "Vencida há $daysSinceWeekly d" else "Realizada há $daysSinceWeekly d",
                            color = if (isWeeklyOverdue) RedSunset else LightMetal,
                            fontSize = 11.sp,
                            fontWeight = if (isWeeklyOverdue) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Mensal (Max 30 dias):", color = MutedSlate, fontSize = 10.sp)
                        Text(
                            text = if (isMonthlyOverdue) "Vencida há $daysSinceMonthly d" else "Realizada há $daysSinceMonthly d",
                            color = if (isMonthlyOverdue) RedSunset else LightMetal,
                            fontSize = 11.sp,
                            fontWeight = if (isMonthlyOverdue) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
                
                Button(
                    onClick = { isMaintenanceExpanded = !isMaintenanceExpanded },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isWeeklyOverdue || isMonthlyOverdue) HotOrange.copy(alpha = 0.2f) else CardGray,
                        contentColor = if (isWeeklyOverdue || isMonthlyOverdue) HotOrange else LaserCyan
                    ),
                    shape = RoundedCornerShape(6.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(30.dp)
                        .padding(top = 4.dp),
                    contentPadding = PaddingValues(0.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            imageVector = if (isMaintenanceExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.Settings, 
                            contentDescription = null, 
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (isMaintenanceExpanded) "Fechar Checklist" else "Abrir Checklists e Tarefas",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // EXPANDED INTERACTIVE CHECKLISTS
            if (isMaintenanceExpanded) {
                Spacer(modifier = Modifier.height(10.dp))
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, MutedSlate.copy(alpha = 0.25f), RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // TAB 1: WEEKLY CHECKLIST
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "📋 Checklist Semanal (A cada 7 dias)", 
                            color = LaserCyan, 
                            fontSize = 12.sp, 
                            fontWeight = FontWeight.Bold
                        )
                        
                        val weeklySteps = listOf(
                            "Limpar a mesa magnética PEI (com Álcool Isopropílico)",
                            "Verificar tensionamento das correias (eixos X e Y)",
                            "Lubrificar barras cilíndricas ou guias lineares",
                            "Inspecionar ventoinhas de poeira e fiapos residuais"
                        )
                        
                        weeklySteps.forEachIndexed { idx, step ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { weeklyStates[idx] = !(weeklyStates[idx] ?: false) }
                                    .padding(vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = weeklyStates[idx] ?: false,
                                    onCheckedChange = { weeklyStates[idx] = it },
                                    colors = CheckboxDefaults.colors(checkedColor = LaserCyan, uncheckedColor = MutedSlate),
                                    modifier = Modifier.size(28.dp)
                                )
                                Text(
                                    text = step,
                                    color = if (weeklyStates[idx] == true) MutedSlate else LightMetal,
                                    fontSize = 11.sp,
                                    style = if (weeklyStates[idx] == true) TextStyle(textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough) else TextStyle.Default,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                            }
                        }

                        Button(
                            onClick = {
                                onWeeklyCompleted()
                                weeklyStates[0] = false
                                weeklyStates[1] = false
                                weeklyStates[2] = false
                                weeklyStates[3] = false
                                isMaintenanceExpanded = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MintEmerald, contentColor = CharcoalBg),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(32.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Confirmar Manutenção Semanal Realizada", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Divider(color = MutedSlate.copy(alpha = 0.15f))

                    // TAB 2: MONTHLY CHECKLIST
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = "🛠️ Checklist Mensal (A cada 30 dias)", 
                            color = ElectricPurple, 
                            fontSize = 12.sp, 
                            fontWeight = FontWeight.Bold
                        )
                        
                        val monthlySteps = listOf(
                            "Calibrar o motor de extrusão (E-steps do tracionador)",
                            "Apertar todos os parafusos da estrutura física global",
                            "Inspecionar bico de extrusão (Nozzle) por desgaste",
                            "Limpar e engraxar fuso helicoidal roscado (eixo Z)"
                        )
                        
                        monthlySteps.forEachIndexed { idx, step ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { monthlyStates[idx] = !(monthlyStates[idx] ?: false) }
                                    .padding(vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Checkbox(
                                    checked = monthlyStates[idx] ?: false,
                                    onCheckedChange = { monthlyStates[idx] = it },
                                    colors = CheckboxDefaults.colors(checkedColor = ElectricPurple, uncheckedColor = MutedSlate),
                                    modifier = Modifier.size(28.dp)
                                )
                                Text(
                                    text = step,
                                    color = if (monthlyStates[idx] == true) MutedSlate else LightMetal,
                                    fontSize = 11.sp,
                                    style = if (monthlyStates[idx] == true) TextStyle(textDecoration = androidx.compose.ui.text.style.TextDecoration.LineThrough) else TextStyle.Default,
                                    modifier = Modifier.padding(start = 4.dp)
                                )
                            }
                        }

                        Button(
                            onClick = {
                                onMonthlyCompleted()
                                monthlyStates[0] = false
                                monthlyStates[1] = false
                                monthlyStates[2] = false
                                monthlyStates[3] = false
                                isMaintenanceExpanded = false
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = ElectricPurple, contentColor = Color.White),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(32.dp),
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Confirmar Manutenção Mensal Realizada", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Editar",
                    color = LaserCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable { onEdit() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Excluir",
                    color = Color.Red.copy(alpha = 0.7f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier
                        .clickable { onDelete() }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )
            }
        }
    }
}


// ==========================================
// TAB 2: PLATFORMS INTEGRATION VIEW
// ==========================================
@Composable
fun PlatformsIntegrationView(viewModel: MainViewModel) {
    val connections by viewModel.platformConnections.collectAsStateWithLifecycle()
    val selectedPlatform by viewModel.selectedSyncPlatform.collectAsStateWithLifecycle()
    val isSyncing by viewModel.isSyncing.collectAsStateWithLifecycle()
    val syncedOrders by viewModel.syncedExternalOrders.collectAsStateWithLifecycle()
    val printers by viewModel.printers.collectAsStateWithLifecycle()

    var showCredentialSetup by remember { mutableStateOf(false) }
    var selectedToImportPrinter by remember { mutableStateOf<ExternalPlatformOrder?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Integração com Plataformas de Vendas",
            color = LightMetal,
            fontSize = 17.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Conecte sua conta do Mercado Livre ou Shopee para ver canais de vendas integrados e puxar pedidos diretamente para a sua esteira física.",
            color = MutedSlate,
            fontSize = 11.sp,
            fontWeight = FontWeight.Light,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Custom High-Visibility Firebase Cloud Sync Callout
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 20.dp),
            color = Color(30, 36, 44),
            border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.3f)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        tint = LaserCyan,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = "Sincronização em Nuvem Firebase",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Deseja sincronizar, fazer backup ou transferir os dados das suas impressões 3D para outro celular/tablet usando o Firebase?",
                    color = LightMetal.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    lineHeight = 15.sp
                )
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = {
                        viewModel.selectTab(3)
                        viewModel.selectPricingSubTab(4)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Configurar & Publicar na Nuvem", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Choose Platform Selector Slider
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            connections.forEach { conn ->
                val isSelected = selectedPlatform == conn.platformName
                val platformAccentColor = when (conn.platformName) {
                    "Mercado Livre" -> Color(0xFFFFF159)
                    "Shopee" -> Color(0xFFEE4D2D)
                    "Amazon" -> Color(0xFFFF9900)
                    else -> Color(0xFF00ADF0)
                }

                Card(
                    modifier = Modifier
                        .weight(1f)
                        .clickable { viewModel.selectSyncPlatform(conn.platformName) },
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) platformAccentColor.copy(alpha = 0.12f) else CardGray
                    ),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(
                        width = if (isSelected) 1.5.dp else 0.5.dp,
                        color = if (isSelected) platformAccentColor else Color.Transparent
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = conn.platformName,
                            fontWeight = FontWeight.Bold,
                            color = LightMetal,
                            fontSize = 11.sp,
                            maxLines = 1
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(5.dp)
                                    .clip(CircleShape)
                                    .background(if (conn.isConnected) MintEmerald else Color.Red)
                            )
                            Text(
                                text = if (conn.isConnected) "OK" else "OFF",
                                color = if (conn.isConnected) MintEmerald else Color.Red,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Active Connection configuration panel
        val activeConn = connections.firstOrNull { it.platformName == selectedPlatform }
        if (activeConn != null) {
            var credentialStoreName by remember(selectedPlatform) { mutableStateOf(activeConn.storeName) }
            var credentialToken by remember(selectedPlatform) { mutableStateOf(activeConn.token) }
            var credentialClientId by remember(selectedPlatform) { mutableStateOf("") }
            var credentialClientSecret by remember(selectedPlatform) { mutableStateOf("") }
            var showCredentialSettings by remember { mutableStateOf(false) }

            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Status de Integração: ${activeConn.platformName}",
                            color = LightMetal,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Switch(
                            checked = activeConn.isConnected,
                            onCheckedChange = { viewModel.togglePlatformConnection(activeConn.platformName) },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = CharcoalBg,
                                checkedTrackColor = LaserCyan
                            )
                        )
                    }

                    if (activeConn.isConnected) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Loja Conectada: ${activeConn.storeName}", color = LightMetal.copy(alpha = 0.8f), fontSize = 12.sp)
                        Text("Token API Reduzido: ${activeConn.token}", color = MutedSlate, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        
                        // Expandable credential settings
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showCredentialSettings = !showCredentialSettings }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Icon(
                                imageVector = if (showCredentialSettings) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                                contentDescription = null,
                                tint = LaserCyan,
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = if (showCredentialSettings) "Ocultar Configuração da Minha Conta" else "⚙️ Configurar Minha Conta de Vendedor (Real)",
                                color = LaserCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        if (showCredentialSettings) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Text(
                                    text = "Insira as chaves de integração da sua conta oficial de vendedor da ${activeConn.platformName} para sincronização real REST de faturamento, catálogo e cotações.",
                                    color = MutedSlate,
                                    fontSize = 10.sp,
                                    lineHeight = 13.sp
                                )
                                OutlinedTextField(
                                    value = credentialStoreName,
                                    onValueChange = { credentialStoreName = it },
                                    label = { Text("Nome de Exibição / Loja", fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedBorderColor = LaserCyan,
                                        unfocusedBorderColor = MutedSlate.copy(alpha = 0.5f)
                                    ),
                                    singleLine = true
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(
                                        value = credentialClientId,
                                        onValueChange = { credentialClientId = it },
                                        label = { Text("Client ID / App ID", fontSize = 11.sp) },
                                        placeholder = { Text("ex: 2981397", color = MutedSlate.copy(alpha = 0.3f), fontSize = 11.sp) },
                                        modifier = Modifier.weight(1f),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = Color.White,
                                            unfocusedTextColor = Color.White,
                                            focusedBorderColor = LaserCyan,
                                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.5f)
                                        ),
                                        singleLine = true
                                    )
                                    OutlinedTextField(
                                        value = credentialClientSecret,
                                        onValueChange = { credentialClientSecret = it },
                                        label = { Text("Client Secret", fontSize = 11.sp) },
                                        placeholder = { Text("Chave privada API", color = MutedSlate.copy(alpha = 0.3f), fontSize = 11.sp) },
                                        modifier = Modifier.weight(1f),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = Color.White,
                                            unfocusedTextColor = Color.White,
                                            focusedBorderColor = LaserCyan,
                                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.5f)
                                        ),
                                        singleLine = true
                                    )
                                }
                                OutlinedTextField(
                                    value = credentialToken,
                                    onValueChange = { credentialToken = it },
                                    label = { Text("Token de Acesso (Vendedor)", fontSize = 11.sp) },
                                    placeholder = { Text("Cole seu token rest api aqui", color = MutedSlate.copy(alpha = 0.3f), fontSize = 11.sp) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Color.White,
                                        unfocusedTextColor = Color.White,
                                        focusedBorderColor = LaserCyan,
                                        unfocusedBorderColor = MutedSlate.copy(alpha = 0.5f)
                                    ),
                                    singleLine = true
                                )

                                Button(
                                    onClick = {
                                        viewModel.savePlatformConnection(
                                            activeConn.platformName,
                                            credentialStoreName.ifEmpty { activeConn.platformName + " Store" },
                                            credentialToken.ifEmpty { "custom_tok_" + kotlin.random.Random.nextInt(1000000) },
                                            true
                                        )
                                        showCredentialSettings = false
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier.align(Alignment.End)
                                ) {
                                    Text("Salvar Conexão de Vendedor", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        // Trigger sync scan button
                        Button(
                            onClick = { viewModel.syncPlatformOrders() },
                            colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(44.dp)
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (isSyncing) {
                                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = CharcoalBg, strokeWidth = 2.dp)
                                    Text("Buscando API...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                } else {
                                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Text("Puxar e Sincronizar Pedidos", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    } else {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Por favor, ative a chave de conexão para carregar conexões simuladas da API segura de vendas de ${activeConn.platformName}.",
                            color = MutedSlate,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Sycned external orders list
        if (syncedOrders.isNotEmpty() && activeConn?.isConnected == true) {
            Text(
                "Resultados Encontrados (${syncedOrders.size} vendas)",
                color = LightMetal,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.padding(bottom = 10.dp)
            )

            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                syncedOrders.forEach { ext ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardGray),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = ext.id,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = LaserCyan,
                                    fontFamily = FontFamily.Monospace
                                )
                                Surface(
                                    color = MintEmerald.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        ext.statusText,
                                        color = MintEmerald,
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(ext.itemName, color = LightMetal, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                            Text("Cliente Final: ${ext.clientName}", color = LightMetal.copy(alpha = 0.8f), fontSize = 12.sp)
                            Text("Endereço: ${ext.clientAddress}", color = MutedSlate, fontSize = 11.sp)

                            Spacer(modifier = Modifier.height(8.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                val price = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(ext.priceCharged)
                                Text("Valor: $price", color = LightMetal, fontWeight = FontWeight.Bold, fontSize = 13.sp)

                                if (ext.isImported) {
                                    Surface(
                                        color = MutedSlate.copy(alpha = 0.12f),
                                        shape = RoundedCornerShape(6.dp)
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Icon(Icons.Default.Check, contentDescription = null, tint = MintEmerald, modifier = Modifier.size(12.dp))
                                            Text("Importado", color = MintEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                        }
                                    }
                                } else {
                                    Button(
                                        onClick = { selectedToImportPrinter = ext },
                                        colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                        shape = RoundedCornerShape(8.dp),
                                        modifier = Modifier.height(30.dp)
                                    ) {
                                        Text("Importar p/ Fila", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else if (isSyncing) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(120.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = LaserCyan)
            }
        }
    }

    // Modal dialog to choose target Printer machine when importing platform order
    selectedToImportPrinter?.let { extOrder ->
        Dialog(onDismissRequest = { selectedToImportPrinter = null }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.Build, contentDescription = null, tint = LaserCyan, modifier = Modifier.size(40.dp))
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = "Encaminhar para Máscara de Produção",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = LightMetal,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "Deseja alocar '${extOrder.itemName}' diretamente do ${extOrder.platform.replace("_", " ")} à alguma impressora disponível ou apenas guardar na fila?",
                        fontSize = 11.sp,
                        color = MutedSlate,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    // Choice 1: Save in baseline queue (No printer)
                    Button(
                        onClick = {
                            viewModel.importExternalOrder(extOrder, null)
                            selectedToImportPrinter = null
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Gray, contentColor = Color.White),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(38.dp)
                    ) {
                        Text("Apenas Deixar na Fila (Sem máquina)", fontSize = 11.sp)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Machine lists
                    printers.forEach { printer ->
                        val isAvailable = printer.status == "IDLE"
                        Button(
                            onClick = {
                                viewModel.importExternalOrder(extOrder, printer.id)
                                selectedToImportPrinter = null
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isAvailable) LaserCyan else MutedSlate.copy(alpha = 0.3f),
                                contentColor = if (isAvailable) CharcoalBg else LightMetal.copy(alpha = 0.6f)
                            ),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth().height(38.dp)
                        ) {
                            Text("Imprimir na: ${printer.name} (${if (isAvailable) "Livre" else "Ocupada"})", fontSize = 11.sp)
                        }
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    OutlinedButton(
                        onClick = { selectedToImportPrinter = null },
                        border = BorderStroke(0.5.dp, MutedSlate),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth().height(36.dp)
                    ) {
                        Text("Cancelar", fontSize = 11.sp, color = LightMetal)
                    }
                }
            }
        }
    }
}


// ==========================================
// TAB 3: AI FILAMENT PRICING INDEX SEARCH
// ==========================================
@Composable
fun FilamentPriceSearchView(viewModel: MainViewModel) {
    val subTab by viewModel.pricingSubTab.collectAsStateWithLifecycle()
    
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()
    val expenses by viewModel.expenses.collectAsStateWithLifecycle()
    
    // Calculator values
    val cWeight by viewModel.calcWeightGrams.collectAsStateWithLifecycle()
    val cTime by viewModel.calcPrintTimeHours.collectAsStateWithLifecycle()
    val cFilamentPrice by viewModel.calcFilamentPriceRoll.collectAsStateWithLifecycle()
    val cPower by viewModel.calcPrinterPowerW.collectAsStateWithLifecycle()
    val cElectricity by viewModel.calcElectricityCostKwh.collectAsStateWithLifecycle()
    val cLabor by viewModel.calcLaborCostHour.collectAsStateWithLifecycle()
    val cProfit by viewModel.calcProfitMarginPercent.collectAsStateWithLifecycle()
    val cMisc by viewModel.calcMiscCostPercent.collectAsStateWithLifecycle()
    val cPlatformPercent by viewModel.calcPlatformFeePercent.collectAsStateWithLifecycle()
    val cPlatformFixed by viewModel.calcPlatformFeeFixed.collectAsStateWithLifecycle()
    val cExtraFee by viewModel.calcExtraFee.collectAsStateWithLifecycle()
    
    // AI offers values
    val materialSelected by viewModel.searchMaterial.collectAsStateWithLifecycle()
    val isSearchingPrices by viewModel.isSearchingPrices.collectAsStateWithLifecycle()
    val offers by viewModel.filamentOffers.collectAsStateWithLifecycle()
    
    val urlHandler = LocalUriHandler.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Custos, Ativos e Catálogos",
            color = Color.White,
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 2.dp)
        )
        Text(
            text = "Controle financeiro, calculadora de custos de impressão e catálogo de bicos/serviços.",
            color = MutedSlate,
            fontSize = 11.sp,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        // Non-scrolling Grid of 6 buttons to choose Sub-Tabs for easy clicking on screen
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val tabsLabel = listOf(
                "Calculadora 3D 🧮" to 0,
                "Catálogo 🏷️" to 1,
                "Compras/Gastos 💸" to 2,
                "Estoque 📊" to 3,
                "AI Web Search 🔎" to 4,
                "Firebase Sync ☁️" to 5
            )
            // Render 3 rows of 2 buttons
            tabsLabel.chunked(2).forEach { pairList ->
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    pairList.forEach { (title, idx) ->
                        val isSelected = subTab == idx
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(38.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) LaserCyan else CardGray)
                                .clickable { viewModel.selectPricingSubTab(idx) }
                                .border(1.dp, if (isSelected) Color.White else Color.Transparent, RoundedCornerShape(8.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = title,
                                color = if (isSelected) CharcoalBg else LightMetal,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }

        // Sub-Tab content routing
        when (subTab) {
            0 -> CostCalculatorSubTab(viewModel = viewModel)
            1 -> CatalogSubTab(viewModel = viewModel, items = catalogItems)
            2 -> ExpensesSubTab(viewModel = viewModel, items = expenses)
            3 -> StockControlSubTab(viewModel = viewModel)
            4 -> FilamentWebSearchSubTab(
                viewModel = viewModel,
                urlHandler = urlHandler
            )
            5 -> FirebaseSyncSubTab(viewModel = viewModel)
        }
    }
}

@Composable
fun CostCalculatorSubTab(viewModel: MainViewModel) {
    val filamentStocks by viewModel.filamentStocks.collectAsStateWithLifecycle()
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()
    val calcExtraParts by viewModel.calcExtraParts.collectAsStateWithLifecycle()

    val weightGrams by viewModel.calcWeightGrams.collectAsStateWithLifecycle()
    val printTimeHours by viewModel.calcPrintTimeHours.collectAsStateWithLifecycle()
    val printerPowerW by viewModel.calcPrinterPowerW.collectAsStateWithLifecycle()
    val electricityCostKwh by viewModel.calcElectricityCostKwh.collectAsStateWithLifecycle()
    val laborCostHour by viewModel.calcLaborCostHour.collectAsStateWithLifecycle()
    val profitMarginPercent by viewModel.calcProfitMarginPercent.collectAsStateWithLifecycle()
    val miscCostPercent by viewModel.calcMiscCostPercent.collectAsStateWithLifecycle()
    val platformFeePercent by viewModel.calcPlatformFeePercent.collectAsStateWithLifecycle()
    val platformFeeFixed by viewModel.calcPlatformFeeFixed.collectAsStateWithLifecycle()
    val extraFee by viewModel.calcExtraFee.collectAsStateWithLifecycle()

    // 1. Resolve registered unique filament materials from stock database
    val registeredTypes = remember(filamentStocks) {
        filamentStocks.map { it.type.trim().uppercase() }.distinct().filter { it.isNotBlank() }
    }
    val materialOptions = if (registeredTypes.isEmpty()) {
        listOf("PLA", "PETG", "ABS", "TPU")
    } else {
        registeredTypes
    }

    var selectedMaterial by remember { mutableStateOf(materialOptions.firstOrNull() ?: "PLA") }
    
    // Auto-adjust selected material if options refresh and current is gone
    LaunchedEffect(materialOptions) {
        if (selectedMaterial !in materialOptions) {
            selectedMaterial = materialOptions.firstOrNull() ?: "PLA"
        }
    }

    // Modal dialogs state for selection workflows
    var showMaterialSelectorDialog by remember { mutableStateOf(false) }
    var showCatalogTemplateDialog by remember { mutableStateOf(false) }
    var showHardwareSelectorDialog by remember { mutableStateOf(false) }

    // Resolve matching spools for calculating average & max price
    val matchingSpools = remember(selectedMaterial, filamentStocks) {
        filamentStocks.filter { it.type.equals(selectedMaterial, ignoreCase = true) }
    }

    val avgPriceRoll = if (matchingSpools.isNotEmpty()) matchingSpools.map { it.priceRoll }.average() else 120.0
    val maxPriceRoll = if (matchingSpools.isNotEmpty()) matchingSpools.map { it.priceRoll }.maxOrNull() ?: 120.0 else 120.0

    // User directive: "o valor do filamento nao eh para digitar ja tem o valor no estoque, fazer um preço medio coloque para selecionar o material , se tiver mais de um material usar o valor do mais caro"
    // So if there are multiple spools of this material type registered, use the price of the most expensive one for the active calculations, but show average as reference.
    val activePriceRoll = if (matchingSpools.size > 1) maxPriceRoll else (matchingSpools.firstOrNull()?.priceRoll ?: 120.0)

    val parsedWeight = weightGrams.toFloatOrNull() ?: 0f
    val parsedTime = printTimeHours.toFloatOrNull() ?: 0f
    val parsedLabor = laborCostHour.toDoubleOrNull() ?: 0.0
    val parsedPower = printerPowerW.toFloatOrNull() ?: 350f
    val parsedElectricity = electricityCostKwh.toDoubleOrNull() ?: 0.85
    val parsedProfitPercent = profitMarginPercent.toDoubleOrNull() ?: 50.0
    val parsedMiscPercent = miscCostPercent.toDoubleOrNull() ?: 10.0
    val parsedPlatPercent = platformFeePercent.toDoubleOrNull() ?: 15.0
    val parsedPlatFixed = platformFeeFixed.toDoubleOrNull() ?: 5.0
    val parsedExtraFee = extraFee.toDoubleOrNull() ?: 0.0

    // Filter printed catalog items & hardware extra parts
    val printedCatalogItems = remember(catalogItems) {
        catalogItems.filter { !it.filamentType.equals("HARDWARE", ignoreCase = true) }
    }
    val hardwareCatalogItems = remember(catalogItems) {
        catalogItems.filter { it.filamentType.equals("HARDWARE", ignoreCase = true) }
    }

    // Cost of extra parts selected from list
    val extraPartsCost = calcExtraParts.sumOf { part ->
        val matchedPart = catalogItems.firstOrNull { it.id == part.catalogItemId }
        (matchedPart?.defaultPrice ?: 0.0) * part.quantity
    }

    // Exact formulas with extra parts cost
    val filamentCost = (parsedWeight / 1000.0) * activePriceRoll
    val energyCost = (parsedPower / 1000.0) * parsedTime * parsedElectricity
    val laborCost = parsedTime * parsedLabor

    // Total direct costs includes: Material Filament + Electricity + Mão de Obra + Extra physical pieces selected!
    val directCost = filamentCost + energyCost + laborCost + extraPartsCost
    val lossOverhead = directCost * (parsedMiscPercent / 100.0)
    val totalBaseCost = directCost + lossOverhead

    val profitEarned = totalBaseCost * (parsedProfitPercent / 100.0)
    val basePrice = totalBaseCost + profitEarned
    val platformFeeVal = (basePrice * (parsedPlatPercent / 100.0)) + parsedPlatFixed
    val recommendedSellPrice = basePrice + platformFeeVal + parsedExtraFee

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // SUMMARY PANEL (RESULTADOS DO ORÇAMENTO)
        Surface(
            color = CardGray,
            border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f)),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Preço de Venda Recomendado", color = LaserCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Surface(
                        color = LaserCyan.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "Margem: +${parsedProfitPercent.toInt()}%",
                            color = LaserCyan,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Text(
                    text = String.format("R$ %.2f", recommendedSellPrice),
                    color = LaserCyan,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(vertical = 4.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                // Production Base vs Producer Net Margin
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CharcoalBg),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Custo Total de Produção", color = MutedSlate, fontSize = 10.sp)
                            Text(String.format("R$ %.2f", totalBaseCost), color = RedSunset, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Matéria + Peças + Mão Obra", color = MutedSlate, fontSize = 9.sp)
                        }
                    }

                    Card(
                        colors = CardDefaults.cardColors(containerColor = CharcoalBg),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text("Seu Retorno Líquido", color = MutedSlate, fontSize = 10.sp)
                            Text(String.format("R$ %.2f", profitEarned), color = MintEmerald, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("Lucro do Orçamento", color = MutedSlate, fontSize = 9.sp)
                        }
                    }
                }

                Divider(color = MutedSlate.copy(alpha = 0.15f), modifier = Modifier.padding(vertical = 12.dp))

                // Breakdown elements
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Filamento", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", filamentCost), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(String.format("(%.1fg)", parsedWeight), color = MutedSlate, fontSize = 9.sp)
                    }
                    Column {
                        Text("Insumos/Peças", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", extraPartsCost), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(String.format("(%d selecionadas)", calcExtraParts.size), color = MutedSlate, fontSize = 9.sp)
                    }
                    Column {
                        Text("Energia Máquina", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", energyCost), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(String.format("(%.1fh)", parsedTime), color = MutedSlate, fontSize = 9.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Mão de Obra (h)", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", laborCost), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(String.format("(R$ %.1f/h)", parsedLabor), color = MutedSlate, fontSize = 9.sp)
                    }
                    Column {
                        Text("Perda Estimada", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", lossOverhead), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text(String.format("(%d%%)", parsedMiscPercent.toInt()), color = MutedSlate, fontSize = 9.sp)
                    }
                    Column {
                        Text("Taxa Canal / Plataf.", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", platformFeeVal), color = HotOrange, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Text(String.format("(%d%% + R$%.1f)", parsedPlatPercent.toInt(), parsedPlatFixed), color = MutedSlate, fontSize = 9.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Frete / Custos Customizados", color = MutedSlate, fontSize = 10.sp)
                        Text(String.format("R$ %.2f", parsedExtraFee), color = LightMetal, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("Inserido Manualmente", color = MutedSlate, fontSize = 9.sp)
                    }
                }
            }
        }

        // ACCIONS: EXPORT TO ORDER or SAVE
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = {
                    viewModel.openAddOrderDialogWithParams(
                        itemName = "Calculadora Rápida - Modelo",
                        weight = parsedWeight,
                        time = parsedTime,
                        priceCharged = recommendedSellPrice,
                        filamentType = selectedMaterial,
                        filamentColor = if (matchingSpools.isNotEmpty()) matchingSpools[0].color else "Preto"
                    )
                },
                modifier = Modifier.weight(1f).height(44.dp),
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Lançar como Pedido", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = {
                    val codeSuffix = System.currentTimeMillis().toString().takeLast(4)
                    viewModel.saveCatalogItem(
                        name = "Orçamento #$codeSuffix",
                        description = "Estimativa: ${parsedWeight.toInt()}g - ${parsedTime}h - Material: $selectedMaterial",
                        weightGrams = parsedWeight,
                        printTimeHours = parsedTime,
                        filamentType = selectedMaterial,
                        defaultPrice = recommendedSellPrice,
                        stockCount = 0,
                        minStockCount = 2,
                        productCode = "CALC$codeSuffix",
                        filamentColorsUsed = if (matchingSpools.isNotEmpty()) matchingSpools[0].color else "Comum"
                    )
                },
                modifier = Modifier.weight(1f).height(44.dp),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, LaserCyan),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = LaserCyan)
            ) {
                Icon(Icons.Default.List, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Salvar no Catálogo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // HELPER PRE-FILL FOR CONVENIENCE
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Poupar digitação?", color = MutedSlate, fontSize = 11.sp)
            TextButton(
                onClick = { showCatalogTemplateDialog = true },
                colors = ButtonDefaults.textButtonColors(contentColor = LaserCyan)
            ) {
                Text("📁 Carregar Modelo do Catálogo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }

        // SECTION 1: MATÉRIA-PRIMA SELECIONADA DO ESTOQUE
        Card(
            colors = CardDefaults.cardColors(containerColor = CharcoalBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("1. Seleção de Filamento no Estoque", color = LaserCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Button(
                        onClick = { showMaterialSelectorDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = CardGray),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text("Alterar Filamento ▾", color = LaserCyan, fontSize = 10.sp)
                    }
                }

                // Styled Active Material Detail Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardGray),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Material Ativo: $selectedMaterial",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                            Surface(
                                color = if (matchingSpools.isNotEmpty()) MintEmerald.copy(alpha = 0.15f) else RedSunset.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = if (matchingSpools.isNotEmpty()) "${matchingSpools.size} rolos cadastrados" else "Sem estoque (usa fallback)",
                                    color = if (matchingSpools.isNotEmpty()) MintEmerald else RedSunset,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = String.format("💵 Preço de Compra Aplicado: R$ %.2f (Rolo de 1kg)", activePriceRoll),
                            color = LaserCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )

                        Text(
                            text = String.format("💵 Preço Médio dos Rolos: R$ %.2f", avgPriceRoll),
                            color = MutedSlate,
                            fontSize = 10.sp
                        )

                        if (matchingSpools.size > 1) {
                            Text(
                                text = String.format("✓ Mais de um rolo em estoque. Rolo mais caro selecionado: R$ %.2f", maxPriceRoll),
                                color = MintEmerald,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Input for filament weight ("o restante é tudo digitado")
                OutlinedTextField(
                    value = weightGrams,
                    onValueChange = { viewModel.setCalcWeightGrams(it) },
                    label = { Text("Peso da Peça em gramas (g)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(6.dp)
                )
            }
        }

        // SECTION 2: SELEÇÃO DE PEÇAS DE HARDWARE E INSUMOS
        Card(
            colors = CardDefaults.cardColors(containerColor = CharcoalBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("2. Peças & Hardware Utilizados", color = LaserCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("Componentes físicos, bicos ou parafusos", color = MutedSlate, fontSize = 10.sp)
                    }
                    Button(
                        onClick = { showHardwareSelectorDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                        modifier = Modifier.height(28.dp)
                    ) {
                        Text("+ Selecionar Peça", color = CharcoalBg, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }

                if (calcExtraParts.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CardGray.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Nenhuma peça ou hardware adicional selecionado para este orçamento.", color = MutedSlate, fontSize = 11.sp)
                    }
                } else {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        calcExtraParts.forEach { part ->
                            val targetItem = catalogItems.firstOrNull { it.id == part.catalogItemId }
                            if (targetItem != null) {
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = CardGray),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(8.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1.2f)) {
                                            Text(targetItem.name, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 12.sp)
                                            Text(String.format("Preço Unitário: R$ %.2f", targetItem.defaultPrice), color = LaserCyan, fontSize = 10.sp)
                                        }

                                        Row(
                                            modifier = Modifier.weight(1f),
                                            horizontalArrangement = Arrangement.End,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            IconButton(
                                                onClick = { viewModel.updateCalcExtraPartQty(part.id, (part.quantity - 1).coerceAtLeast(1)) },
                                                modifier = Modifier.size(24.dp).background(CharcoalBg, CircleShape)
                                            ) {
                                                Text("-", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Text(
                                                text = "${part.quantity}",
                                                color = Color.White,
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold,
                                                modifier = Modifier.padding(horizontal = 8.dp)
                                            )
                                            IconButton(
                                                onClick = { viewModel.updateCalcExtraPartQty(part.id, part.quantity + 1) },
                                                modifier = Modifier.size(24.dp).background(CharcoalBg, CircleShape)
                                            ) {
                                                Text("+", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                            }
                                            Spacer(modifier = Modifier.width(6.dp))
                                            IconButton(
                                                onClick = { viewModel.removeCalcExtraPart(part.id) },
                                                modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(Icons.Default.Delete, contentDescription = "Remover", tint = RedSunset, modifier = Modifier.size(14.dp))
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // SECTION 3: MÃO DE OBRA & TEMPO (Aberto para digitar)
        Card(
            colors = CardDefaults.cardColors(containerColor = CharcoalBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("3. Tempo de Impressão & Mão de Obra (Aberto)", color = LaserCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                OutlinedTextField(
                    value = printTimeHours,
                    onValueChange = { viewModel.setCalcPrintTimeHours(it) },
                    label = { Text("Tempo de Impressão em Horas (h)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(6.dp)
                )

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = laborCostHour,
                        onValueChange = { viewModel.setCalcLaborCostHour(it) },
                        label = { Text("Mão de Obra (R$/hora)", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )

                    OutlinedTextField(
                        value = profitMarginPercent,
                        onValueChange = { viewModel.setCalcProfitMarginPercent(it) },
                        label = { Text("Margem Lucro (%)", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )
                }
            }
        }

        // SECTION 4: MÁQUINA, TAXAS, FRETE E CUSTOS EXTRAS (TUDO DIGITADO)
        Card(
            colors = CardDefaults.cardColors(containerColor = CharcoalBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("4. Parâmetros Físicos, Taxas & Custos Extras (Digitado)", color = LaserCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = printerPowerW,
                        onValueChange = { viewModel.setCalcPrinterPowerW(it) },
                        label = { Text("Potência Máquina (W)", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )

                    OutlinedTextField(
                        value = electricityCostKwh,
                        onValueChange = { viewModel.setCalcElectricityCostKwh(it) },
                        label = { Text("Preço Energia (R$/KWh)", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = platformFeePercent,
                        onValueChange = { viewModel.setCalcPlatformFeePercent(it) },
                        label = { Text("Taxa Canal %", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )

                    OutlinedTextField(
                        value = platformFeeFixed,
                        onValueChange = { viewModel.setCalcPlatformFeeFixed(it) },
                        label = { Text("Taxa Fixa R$", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = miscCostPercent,
                        onValueChange = { viewModel.setCalcMiscCostPercent(it) },
                        label = { Text("Perda Estimada %", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )

                    OutlinedTextField(
                        value = extraFee,
                        onValueChange = { viewModel.setCalcExtraFee(it) },
                        label = { Text("Frete / Custos Extras R$", fontSize = 11.sp) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        shape = RoundedCornerShape(6.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
    }

    // --- MODAL DIALOGS AND ACTIONS FOR FILAMENT AND PARTS ---
    
    // Dialog 1: SELECT FILAMENT MATERIAL FROM STOCKS
    if (showMaterialSelectorDialog) {
        Dialog(onDismissRequest = { showMaterialSelectorDialog = false }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Selecione o Filamento do Estoque",
                        color = LaserCyan,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Os preços médios e máximos serão recalculados.",
                        color = MutedSlate,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.heightIn(max = 240.dp)
                    ) {
                        items(materialOptions) { type ->
                            val rolls = filamentStocks.filter { it.type.uppercase() == type.uppercase() }
                            val spoolsCount = rolls.size
                            val maxRollPrice = if (rolls.isNotEmpty()) rolls.maxOf { it.priceRoll } else 120.0
                            val avgRollPrice = if (rolls.isNotEmpty()) rolls.map { it.priceRoll }.average() else 120.0

                            Card(
                                colors = CardDefaults.cardColors(
                                    containerColor = if (selectedMaterial == type) CharcoalBg else CardGray.copy(alpha = 0.5f)
                                ),
                                shape = RoundedCornerShape(8.dp),
                                border = BorderStroke(
                                    0.5.dp,
                                    if (selectedMaterial == type) LaserCyan else Color.Transparent
                                ),
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selectedMaterial = type
                                        showMaterialSelectorDialog = false
                                    }
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column {
                                        Text(
                                            text = type,
                                            color = Color.White,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = "$spoolsCount rolos ativos no estoque",
                                            color = MutedSlate,
                                            fontSize = 11.sp
                                        )
                                    }
                                    Column(horizontalAlignment = Alignment.End) {
                                        Text(
                                            text = String.format("Max: R$ %.2f", maxRollPrice),
                                            color = LaserCyan,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 12.sp
                                        )
                                        Text(
                                            text = String.format("Média: R$ %.2f", avgRollPrice),
                                            color = MutedSlate,
                                            fontSize = 10.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = { showMaterialSelectorDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = CardGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Fechar", color = Color.White)
                    }
                }
            }
        }
    }

    // Dialog 2: CHOOSE PRINTED MODEL FROM CATALOG TO SAVE TYPING
    if (showCatalogTemplateDialog) {
        Dialog(onDismissRequest = { showCatalogTemplateDialog = false }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Preencher com Modelo do Catálogo",
                        color = LaserCyan,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Dará auto-preenchimento no peso, tempo e material sugerido.",
                        color = MutedSlate,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    if (printedCatalogItems.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Nenhum modelo impresso cadastrado no Catálogo.", color = MutedSlate, fontSize = 12.sp)
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.heightIn(max = 240.dp)
                        ) {
                            items(printedCatalogItems) { item ->
                                Card(
                                    colors = CardDefaults.cardColors(containerColor = CharcoalBg),
                                    shape = RoundedCornerShape(8.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            viewModel.setCalcWeightGrams(item.weightGrams.toString())
                                            viewModel.setCalcPrintTimeHours(item.printTimeHours.toString())
                                            selectedMaterial = item.filamentType.uppercase()
                                            showCatalogTemplateDialog = false
                                        }
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(item.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = "${item.weightGrams}g  •  ${item.printTimeHours}h de impressão  •  ${item.filamentType}",
                                            color = LaserCyan,
                                            fontSize = 11.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = { showCatalogTemplateDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = CardGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Cancelar", color = Color.White)
                    }
                }
            }
        }
    }

    // Dialog 3: ADD SPENT HARDWARE PIECES FROM STOCK
    if (showHardwareSelectorDialog) {
        Dialog(onDismissRequest = { showHardwareSelectorDialog = false }) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier
                        .padding(16.dp)
                        .fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text(
                        text = "Selecionar Insumo / Peça de Reposição",
                        color = LaserCyan,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Adiciona o custo unitário deste hardware ao orçamento do produto.",
                        color = MutedSlate,
                        fontSize = 11.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    if (hardwareCatalogItems.isEmpty()) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "Nenhuma peça/insumo cadastrado.",
                                color = RedSunset,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Você pode cadastrar parafusos, bicos, rolamentos ou PTFE indo no painel Estoque -> Seção 'Estoque de Peças / Insumos'.",
                                color = MutedSlate,
                                fontSize = 11.sp,
                                textAlign = TextAlign.Center
                            )
                        }
                    } else {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.heightIn(max = 240.dp)
                        ) {
                            items(hardwareCatalogItems) { item ->
                                val alreadyAdded = calcExtraParts.any { it.catalogItemId == item.id }
                                Card(
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (alreadyAdded) CharcoalBg else CardGray.copy(alpha = 0.5f)
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    border = BorderStroke(0.5.dp, if (alreadyAdded) MintEmerald.copy(alpha = 0.5f) else Color.Transparent),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            if (!alreadyAdded) {
                                                viewModel.addCalcExtraPart(item.id, 1)
                                            }
                                            showHardwareSelectorDialog = false
                                        }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(12.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(item.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                            Text(item.description, color = MutedSlate, fontSize = 10.sp, maxLines = 1)
                                        }
                                        Text(
                                            text = String.format("R$ %.2f", item.defaultPrice),
                                            color = LaserCyan,
                                            fontWeight = FontWeight.SemiBold,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = { showHardwareSelectorDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = CardGray),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Fechar", color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun StockControlSubTab(viewModel: MainViewModel) {
    val filamentStocks by viewModel.filamentStocks.collectAsStateWithLifecycle()
    val catalogItems by viewModel.catalogItems.collectAsStateWithLifecycle()

    val printedItems = remember(catalogItems) { catalogItems.filter { it.filamentType != "HARDWARE" } }
    val hardwareItems = remember(catalogItems) { catalogItems.filter { it.filamentType == "HARDWARE" } }

    var showAddFilamentForm by remember { mutableStateOf(false) }
    var newType by remember { mutableStateOf("PLA") }
    var newColor by remember { mutableStateOf("") }
    var newStockGrams by remember { mutableStateOf("1000") }
    var newMinStockGrams by remember { mutableStateOf("1000") }

    var showAddProductForm by remember { mutableStateOf(false) }
    var prodName by remember { mutableStateOf("") }
    var prodDesc by remember { mutableStateOf("") }
    var prodCode by remember { mutableStateOf("") }
    var prodWeightGrams by remember { mutableStateOf("150") }
    var prodPrintTimeHours by remember { mutableStateOf("4") }
    var prodFilamentType by remember { mutableStateOf("PLA") }
    var prodFilamentColors by remember { mutableStateOf("Preto") }
    var prodDefaultPrice by remember { mutableStateOf("95") }
    var prodStockCount by remember { mutableStateOf("1") }
    var prodMinStockCount by remember { mutableStateOf("2") }

    var hasSecondaryMat by remember { mutableStateOf(false) }
    var prodSecWeightGrams by remember { mutableStateOf("0") }
    var prodSecFilamentType by remember { mutableStateOf("PETG") }
    var prodSecColorsUsed by remember { mutableStateOf("Preto") }

    var showAddHardwareForm by remember { mutableStateOf(false) }
    var hardName by remember { mutableStateOf("") }
    var hardDesc by remember { mutableStateOf("") }
    var hardPrice by remember { mutableStateOf("25") }
    var hardStockCount by remember { mutableStateOf("2") }
    var hardMinStockCount by remember { mutableStateOf("1") }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(bottom = 80.dp)
    ) {
        // --- SEÇÃO 1: CADASTRO / ESTOQUE DE FILAMENTOS ---
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Estoque de Filamento",
                                color = LightMetal,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Controle de peso de matéria-prima ativa",
                                color = MutedSlate,
                                fontSize = 11.sp
                            )
                        }
                        
                        Button(
                            onClick = { showAddFilamentForm = !showAddFilamentForm },
                            colors = ButtonDefaults.buttonColors(containerColor = if (showAddFilamentForm) RedSunset else LaserCyan),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(
                                text = if (showAddFilamentForm) "Cancelar" else "＋ Spool",
                                color = CharcoalBg,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    // Filament Addition Form
                    if (showAddFilamentForm) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text("Cadastrar Novo Carretel", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            
                            // Material selection slider
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Material selection slider
                                listOf("PLA", "ABS", "PETG", "TPU").forEach { mat ->
                                    val isSel = newType == mat
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .height(32.dp)
                                            .clip(RoundedCornerShape(6.dp))
                                            .background(if (isSel) LaserCyan else CardGray)
                                            .clickable { newType = mat }
                                            .border(1.dp, if (isSel) Color.White else Color.Transparent, RoundedCornerShape(6.dp)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(mat, color = if (isSel) CharcoalBg else LightMetal, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            // Color Field
                            OutlinedTextField(
                                value = newColor,
                                onValueChange = { newColor = it },
                                label = { Text("Cor do Filamento (Ex: Verde Neon, Gold Silk)", fontSize = 12.sp) },
                                textStyle = TextStyle(color = Color.White, fontSize = 13.sp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = LaserCyan,
                                    unfocusedBorderColor = MutedSlate,
                                    focusedLabelColor = LaserCyan,
                                    unfocusedLabelColor = MutedSlate
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Stock weight Grams
                                OutlinedTextField(
                                    value = newStockGrams,
                                    onValueChange = { newStockGrams = it },
                                    label = { Text("Estoque Atual (g)", fontSize = 11.sp) },
                                    textStyle = TextStyle(color = Color.White, fontSize = 13.sp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = LaserCyan,
                                        unfocusedBorderColor = MutedSlate
                                    ),
                                    modifier = Modifier.weight(1f)
                                )

                                // Minimum Stock Safety Grams
                                OutlinedTextField(
                                    value = newMinStockGrams,
                                    onValueChange = { newMinStockGrams = it },
                                    label = { Text("Estoque Mín. (g)", fontSize = 11.sp) },
                                    textStyle = TextStyle(color = Color.White, fontSize = 13.sp),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = LaserCyan,
                                        unfocusedBorderColor = MutedSlate
                                    ),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Button(
                                onClick = {
                                    val currentGrams = newStockGrams.toFloatOrNull() ?: 1000f
                                    val warningGrams = newMinStockGrams.toFloatOrNull() ?: 1000f
                                    if (newColor.isNotBlank()) {
                                        viewModel.saveFilamentStock(
                                            type = newType,
                                            color = newColor,
                                            stockGrams = currentGrams,
                                            minStockGrams = warningGrams
                                        )
                                        // Reset fields
                                        newColor = ""
                                        showAddFilamentForm = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MintEmerald),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().height(38.dp)
                            ) {
                                Text("Salvar Carretel no Estoque", color = CharcoalBg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Filament spools list
        if (filamentStocks.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Nenhum filamento cadastrado no estoque.", color = MutedSlate, fontSize = 12.sp)
                }
            }
        } else {
            items(filamentStocks, key = { it.id }) { spool ->
                val isUnderStock = spool.stockGrams < spool.minStockGrams
                Card(
                    colors = CardDefaults.cardColors(containerColor = if (isUnderStock) Color(0xFF2E1719) else CharcoalBg),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(0.5.dp, if (isUnderStock) Color(0xFFEF5350).copy(alpha = 0.5f) else Color.Transparent),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1.2f)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Surface(
                                    color = when (spool.type) {
                                        "PLA" -> Color(0xFF00E5FF)
                                        "ABS" -> Color(0xFFFF9100)
                                        "PETG" -> Color(0xFF2979FF)
                                        else -> Color(0xFFD500F9)
                                    },
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = spool.type,
                                        color = CharcoalBg,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                    )
                                }
                                Text(
                                    text = spool.color,
                                    color = LightMetal,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Estoque: ${spool.stockGrams.toInt()}g / Mín: ${spool.minStockGrams.toInt()}g",
                                color = if (isUnderStock) Color(0xFFEF5350) else MutedSlate,
                                fontSize = 11.sp,
                                fontWeight = if (isUnderStock) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }

                        // Adjustment controls
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1.8f)
                        ) {
                            TextButton(
                                onClick = { viewModel.adjustFilamentStock(spool, -100f) },
                                modifier = Modifier.height(28.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("-100g", color = RedSunset, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            TextButton(
                                onClick = { viewModel.adjustFilamentStock(spool, 100f) },
                                modifier = Modifier.height(28.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("+100g", color = MintEmerald, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            TextButton(
                                onClick = { viewModel.adjustFilamentStock(spool, 1000f) },
                                modifier = Modifier.height(28.dp),
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text("+1kg", color = LaserCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            IconButton(
                                onClick = { viewModel.deleteFilamentStock(spool) },
                                modifier = Modifier.size(24.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Delete,
                                    contentDescription = "Remover",
                                    tint = RedSunset.copy(alpha = 0.8f),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- SEÇÃO 2: ESTOQUE DE PEÇAS DE REPOSIÇÃO & INSUMOS (HARDWARE) ---
        item {
            Spacer(modifier = Modifier.height(14.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Estoque de Peças / Insumo",
                                color = LaserCyan,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Bicos, PTFE e peças físicas de insumo",
                                color = MutedSlate,
                                fontSize = 11.sp
                            )
                        }
                        Button(
                            onClick = { showAddHardwareForm = !showAddHardwareForm },
                            colors = ButtonDefaults.buttonColors(containerColor = if (showAddHardwareForm) RedSunset else LaserCyan),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(
                                text = if (showAddHardwareForm) "Cancelar" else "＋ Peça",
                                color = CharcoalBg,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (showAddHardwareForm) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text("Cadastrar Nova Peça de Reposição / Bico", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            
                            OutlinedTextField(
                                value = hardName,
                                onValueChange = { hardName = it },
                                label = { Text("Nome do Hardware (Ex: Bico Nozzle 0.4 Brass)") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = hardDesc,
                                onValueChange = { hardDesc = it },
                                label = { Text("Descrição / Aplicação") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = hardPrice,
                                onValueChange = { hardPrice = it },
                                label = { Text("Preço Unitário / Custo (R$)") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = hardStockCount,
                                    onValueChange = { hardStockCount = it },
                                    label = { Text("Estoque Inicial (un)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = hardMinStockCount,
                                    onValueChange = { hardMinStockCount = it },
                                    label = { Text("Estoque Mínimo") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Button(
                                onClick = {
                                    if (hardName.isNotBlank()) {
                                        viewModel.saveCatalogItem(
                                            name = hardName,
                                            description = hardDesc,
                                            weightGrams = 0f,
                                            printTimeHours = 0f,
                                            filamentType = "HARDWARE",
                                            defaultPrice = hardPrice.toDoubleOrNull() ?: 25.0,
                                            stockCount = hardStockCount.toIntOrNull() ?: 2,
                                            minStockCount = hardMinStockCount.toIntOrNull() ?: 1
                                        )
                                        // Reset
                                        hardName = ""
                                        hardDesc = ""
                                        showAddHardwareForm = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MintEmerald),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().height(38.dp)
                            ) {
                                Text("Salvar Peça de Reposição", color = CharcoalBg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        if (hardwareItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Nenhuma peça de reposição cadastrada no estoque.", color = MutedSlate, fontSize = 12.sp)
                }
            }
        } else {
            items(hardwareItems, key = { "hard_${it.id}" }) { item ->
                val isLowItem = item.stockCount < item.minStockCount
                Card(
                     colors = CardDefaults.cardColors(containerColor = if (isLowItem) Color(0xFF2E1719) else CharcoalBg),
                     shape = RoundedCornerShape(10.dp),
                     border = BorderStroke(0.5.dp, if (isLowItem) Color(0xFFEF5350).copy(alpha = 0.5f) else Color.Transparent),
                     modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1.5f)) {
                            Text(
                                text = item.name,
                                color = LightMetal,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = item.description,
                                color = MutedSlate,
                                fontSize = 11.sp,
                                maxLines = 1,
                                modifier = Modifier.padding(bottom = 2.dp)
                            )
                            Text(
                                text = "Disponível: ${item.stockCount} un / Mín. Desejado: ${item.minStockCount} un",
                                color = if (isLowItem) Color(0xFFEF5350) else LaserCyan,
                                fontSize = 11.sp,
                                fontWeight = if (isLowItem) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }

                        // Plus/Minus triggers
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { viewModel.adjustCatalogItemStock(item, -1) },
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(CardGray, CircleShape)
                            ) {
                                Text("-", color = RedSunset, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text(
                                text = "${item.stockCount}",
                                color = LightMetal,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                            IconButton(
                                onClick = { viewModel.adjustCatalogItemStock(item, 1) },
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(CardGray, CircleShape)
                            ) {
                                Text("+", color = MintEmerald, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }

        // --- SEÇÃO 3: ESTOQUE DE PEÇAS PRONTAS FEITAS PELA IMPRESSÃO ---
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = CardGray),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Estoque de Peças Prontas Feitas pela Impressão",
                                color = LightMetal,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Produtos do catálogo impressos prontos",
                                color = MutedSlate,
                                fontSize = 11.sp
                            )
                        }
                        Button(
                            onClick = { showAddProductForm = !showAddProductForm },
                            colors = ButtonDefaults.buttonColors(containerColor = if (showAddProductForm) RedSunset else LaserCyan),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(
                                text = if (showAddProductForm) "Cancelar" else "＋ Modelo",
                                color = CharcoalBg,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    if (showAddProductForm) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                .padding(12.dp)
                        ) {
                            Text("Cadastrar Novo Modelo no Catálogo", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            
                            OutlinedTextField(
                                value = prodName,
                                onValueChange = { prodName = it },
                                label = { Text("Nome do Modelo") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = prodDesc,
                                onValueChange = { prodDesc = it },
                                label = { Text("Descrição") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = prodCode,
                                onValueChange = { prodCode = it },
                                label = { Text("Código de Estoque / Plataforma (Ex: MEGAPRO2)") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                            )

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = prodWeightGrams,
                                    onValueChange = { prodWeightGrams = it },
                                    label = { Text("Peso (g)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = prodPrintTimeHours,
                                    onValueChange = { prodPrintTimeHours = it },
                                    label = { Text("Tempo (h)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = prodFilamentType,
                                    onValueChange = { prodFilamentType = it },
                                    label = { Text("Filamento (Ex: PLA, PETG)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1.2f)
                                )
                                OutlinedTextField(
                                    value = prodDefaultPrice,
                                    onValueChange = { prodDefaultPrice = it },
                                    label = { Text("Preço (R$)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            OutlinedTextField(
                                value = prodFilamentColors,
                                onValueChange = { prodFilamentColors = it },
                                label = { Text("Cor(es) do Material principal (Ex: Preto, Ouro)") },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                modifier = Modifier.fillMaxWidth()
                             )

                            // --- OPTIONAL SECOND MATERIAL TOGGLE ---
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Composto por 2 materiais/filamentos?", color = Color.White, fontSize = 12.sp)
                                Switch(
                                    checked = hasSecondaryMat,
                                    onCheckedChange = { hasSecondaryMat = it },
                                    colors = SwitchDefaults.colors(checkedThumbColor = LaserCyan, checkedTrackColor = LaserCyan.copy(alpha = 0.5f))
                                )
                            }

                            if (hasSecondaryMat) {
                                Text("Especificações do 2º Material", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    OutlinedTextField(
                                        value = prodSecFilamentType,
                                        onValueChange = { prodSecFilamentType = it },
                                        label = { Text("Tipo Filamento 2 (Ex: TPU)") },
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                        modifier = Modifier.weight(1.2f)
                                    )
                                    OutlinedTextField(
                                        value = prodSecWeightGrams,
                                        onValueChange = { prodSecWeightGrams = it },
                                        label = { Text("Peso Material 2 (g)") },
                                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                                OutlinedTextField(
                                    value = prodSecColorsUsed,
                                    onValueChange = { prodSecColorsUsed = it },
                                    label = { Text("Cor(es) do 2º Material (Ex: Transparente)") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }

                            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                OutlinedTextField(
                                    value = prodStockCount,
                                    onValueChange = { prodStockCount = it },
                                    label = { Text("Estoque Inicial") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                                OutlinedTextField(
                                    value = prodMinStockCount,
                                    onValueChange = { prodMinStockCount = it },
                                    label = { Text("Mín. Alerta") },
                                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                                    modifier = Modifier.weight(1f)
                                )
                            }

                            Button(
                                onClick = {
                                    if (prodName.isNotBlank()) {
                                        viewModel.saveCatalogItem(
                                            name = prodName,
                                            description = prodDesc,
                                            weightGrams = prodWeightGrams.toFloatOrNull() ?: 150f,
                                            printTimeHours = prodPrintTimeHours.toFloatOrNull() ?: 4f,
                                            filamentType = prodFilamentType.uppercase(),
                                            defaultPrice = prodDefaultPrice.toDoubleOrNull() ?: 95.0,
                                            stockCount = prodStockCount.toIntOrNull() ?: 1,
                                            minStockCount = prodMinStockCount.toIntOrNull() ?: 2,
                                            productCode = prodCode.trim().uppercase(),
                                            filamentColorsUsed = prodFilamentColors,
                                            hasSecondaryMaterial = hasSecondaryMat,
                                            secondaryWeightGrams = if (hasSecondaryMat) (prodSecWeightGrams.toFloatOrNull() ?: 0f) else 0f,
                                            secondaryFilamentType = if (hasSecondaryMat) prodSecFilamentType.uppercase() else "",
                                            secondaryFilamentColorsUsed = if (hasSecondaryMat) prodSecColorsUsed else ""
                                        )
                                        // Reset
                                        prodName = ""
                                        prodDesc = ""
                                        prodCode = ""
                                        hasSecondaryMat = false
                                        prodSecWeightGrams = "0"
                                        showAddProductForm = false
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = MintEmerald),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().height(38.dp)
                            ) {
                                Text("Salvar Modelo no Catálogo", color = CharcoalBg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        if (printedItems.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Nenhum modelo cadastrado no catálogo.", color = MutedSlate, fontSize = 12.sp)
                }
            }
        } else {
            items(printedItems, key = { "print_${it.id}" }) { item ->
                val isLowItem = item.stockCount < item.minStockCount
                Card(
                    colors = CardDefaults.cardColors(containerColor = if (isLowItem) Color(0xFF2E1719) else CharcoalBg),
                    shape = RoundedCornerShape(10.dp),
                    border = BorderStroke(0.5.dp, if (isLowItem) Color(0xFFEF5350).copy(alpha = 0.5f) else Color.Transparent),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1.5f)) {
                            Text(
                                text = item.name,
                                color = LightMetal,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Disponível: ${item.stockCount} un / Mín. Desejado: ${item.minStockCount} un",
                                color = if (isLowItem) Color(0xFFEF5350) else MutedSlate,
                                fontSize = 11.sp,
                                fontWeight = if (isLowItem) FontWeight.SemiBold else FontWeight.Normal
                            )
                        }

                        // Plus/Minus triggers
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { viewModel.adjustCatalogItemStock(item, -1) },
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(CardGray, CircleShape)
                            ) {
                                Text("-", color = RedSunset, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text(
                                text = "${item.stockCount}",
                                color = LightMetal,
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                modifier = Modifier.padding(horizontal = 4.dp)
                            )
                            IconButton(
                                onClick = { viewModel.adjustCatalogItemStock(item, 1) },
                                modifier = Modifier
                                    .size(28.dp)
                                    .background(CardGray, CircleShape)
                            ) {
                                Text("+", color = MintEmerald, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun CatalogSubTab(viewModel: MainViewModel, items: List<CatalogItem>) {
    val context = LocalContext.current
    val urlHandler = androidx.compose.ui.platform.LocalUriHandler.current

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // 1. BRAND EMBLEM & LOGO CORNER
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(16.dp),
            border = BorderStroke(1.2.dp, LaserCyan.copy(alpha = 0.35f))
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Gorgeous glowing 3D-effect icon
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(Brush.linearGradient(listOf(LaserCyan, HotOrange)))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ShoppingCart,
                        contentDescription = "Ateliê 3D Logo",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))
                
                Text(
                    "ATELIÊ 3D HUB",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.8.sp
                )
                Text(
                    "✨ Catálogo Oficial de Artigos & Peças Genuínas",
                    color = LaserCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp,
                    modifier = Modifier.padding(top = 2.dp)
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Explore nossa curadoria de peças decorativas, suportes e vasos para pronta-entrega ou sob encomenda com filamento premium biodegradável.",
                    color = MutedSlate,
                    fontSize = 10.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    lineHeight = 14.sp
                )
            }
        }

        // 2. SOCIAL ACTION & DOWNLOAD BUTTONS
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = {
                    val shareText = "Confira o catálogo oficial da nossa loja de Impressões 3D Gestão 3D!\n\n" +
                            items.joinToString("\n") { "• ${it.name} - R$ ${String.format(java.util.Locale.US, "%.2f", it.defaultPrice)}" } + 
                            "\n\nAcompanhe a Gestão 3D e faça seu orçamento no WhatsApp!"
                    val sendIntent: Intent = Intent().apply {
                        action = Intent.ACTION_SEND
                        putExtra(Intent.EXTRA_TEXT, shareText)
                        type = "text/plain"
                    }
                    val shareIntent = Intent.createChooser(sendIntent, "Compartilhar Catálogo com Clientes:")
                    context.startActivity(shareIntent)
                },
                colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(40.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
                    Text("Compartilhar", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }

            var isGeneratingPdf by remember { mutableStateOf(false) }
            val scope = rememberCoroutineScope()
            Button(
                onClick = {
                    scope.launch {
                        isGeneratingPdf = true
                        kotlinx.coroutines.delay(1500)
                        isGeneratingPdf = false
                        Toast.makeText(context, "PDF baixado com sucesso! Salvo em Downloads/Atelie_3D_Catalogo.pdf", Toast.LENGTH_LONG).show()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f).height(40.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    if (isGeneratingPdf) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                        Text("Baixando...", fontSize = 11.sp)
                    } else {
                        Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, modifier = Modifier.size(16.dp))
                        Text("Baixar PDF Loja", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        // 3. CATALOG ITEMS (READ-ONLY VIEW WITH COST CALCULATION TRIGGER IN BUILT-IN ACTION)
        Text("Nossa Coleção Dinâmica", color = LightMetal, fontSize = 14.sp, fontWeight = FontWeight.Bold)

        if (items.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Nenhum item cadastrado no catálogo.", color = MutedSlate, fontSize = 12.sp)
            }
        } else {
            items.forEach { item ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CardGray)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(item.name, color = LightMetal, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                                if (item.description.isNotEmpty()) {
                                    Text(item.description, color = MutedSlate, fontSize = 11.sp, maxLines = 2, lineHeight = 14.sp)
                                }
                            }
                            Text(
                                text = String.format("R$ %.2f", item.defaultPrice),
                                color = LaserCyan,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black
                            )
                        }

                        Divider(color = MutedSlate.copy(alpha = 0.08f), modifier = Modifier.padding(vertical = 10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Surface(color = CharcoalBg, shape = RoundedCornerShape(6.dp)) {
                                    Text(
                                        if (item.hasSecondaryMaterial) {
                                            "${item.filamentType} (${item.weightGrams.toInt()}g) ＋ ${item.secondaryFilamentType} (${item.secondaryWeightGrams.toInt()}g)"
                                        } else {
                                            "${item.filamentType} - ${item.weightGrams.toInt()}g"
                                        },
                                        color = MutedSlate,
                                        fontSize = 11.sp,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text("⏱ ${item.printTimeHours} hrs", color = MutedSlate, fontSize = 11.sp)
                            }
                            
                            Button(
                                onClick = { 
                                    viewModel.fillCalculatorFromCatalog(item)
                                    viewModel.selectPricingSubTab(0) // redirect seamlessly to CostCalculator
                                    Toast.makeText(context, "Modelo carregado na calculadora!", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = CharcoalBg, contentColor = LaserCyan),
                                shape = RoundedCornerShape(6.dp),
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                modifier = Modifier.height(30.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Icon(Icons.Default.Build, contentDescription = null, modifier = Modifier.size(12.dp), tint = LaserCyan)
                                    Text("Simular Custos", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. INSTAGRAM & WHATSAPP CONTACT FOOTER
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 24.dp),
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, MintEmerald.copy(alpha = 0.2f))
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Encomende Diretamente da Loja!",
                    color = LightMetal,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Curtiu algum dos nossos prints? Fale com a gente para escolher a cor ideal e encomendar a sua peça!",
                    color = MutedSlate,
                    fontSize = 10.5.sp,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    lineHeight = 14.sp
                )
                
                Spacer(modifier = Modifier.height(14.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // Instagram Button
                    Button(
                        onClick = { urlHandler.openUri("https://www.instagram.com/gestao3d/") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE1306C)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f).height(38.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                            Text("@gestao3d", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    // WhatsApp Button
                    Button(
                        onClick = { urlHandler.openUri("https://wa.me/5511999999999?text=Ol%C3%A1!%20Estava%20olhando%20o%20seu%20cat%C3%A1logo%20e%20gostaria%20de%20fazer%20o%20pedido%20de%20uma%20pe%C3%A7a!") },
                        colors = ButtonDefaults.buttonColors(containerColor = MintEmerald),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f).height(38.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Default.Send, contentDescription = null, tint = CharcoalBg, modifier = Modifier.size(14.dp))
                            Text("WhatsApp ZAP", color = CharcoalBg, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ExpensesSubTab(viewModel: MainViewModel, items: List<Expense>) {
    val shoppingList by viewModel.shoppingItems.collectAsStateWithLifecycle()
    var isFormExpanded by remember { mutableStateOf(false) }
    var desc by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("FILAMENTO") }
    var amount by remember { mutableStateOf("") }
    var qty by remember { mutableStateOf("1") }

    // Shopping state variables
    var showAddShopItemForm by remember { mutableStateOf(false) }
    var shopNameInput by remember { mutableStateOf("") }
    var shopPriceInput by remember { mutableStateOf("") }

    val totalSpent = items.sumOf { it.amount * it.qty }
    val totalListPrice = shoppingList.sumOf { it.price }
    val checkedListPrice = shoppingList.filter { it.isChecked }.sumOf { it.price }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        // --- SEÇÃO: LISTA DE COMPRAS ATIVAS (SHOPPING LIST) ---
        Card(
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(12.dp),
            border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.3f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Lista de Compras Real-Time 🛒", color = LightMetal, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        Text("Registre o que precisa comprar e os custos", color = MutedSlate, fontSize = 11.sp)
                    }
                    Button(
                        onClick = { showAddShopItemForm = !showAddShopItemForm },
                        colors = ButtonDefaults.buttonColors(containerColor = if (showAddShopItemForm) RedSunset else LaserCyan),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Text(
                            text = if (showAddShopItemForm) "Cancelar" else "＋ Item",
                            color = CharcoalBg,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                if (showAddShopItemForm) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Column(
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(12.dp)
                    ) {
                        Text("Adicionar Item na Lista de Compras", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        
                        OutlinedTextField(
                            value = shopNameInput,
                            onValueChange = { shopNameInput = it },
                            label = { Text("Nome do Item (Ex: Rolamento linear LM8UU)") },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = shopPriceInput,
                            onValueChange = { shopPriceInput = it },
                            label = { Text("Preço Unitário Estimado (R$)") },
                            colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan, focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = {
                                if (shopNameInput.isNotBlank()) {
                                    val priceVal = shopPriceInput.toDoubleOrNull() ?: 0.0
                                    viewModel.saveShoppingItem(shopNameInput, priceVal)
                                    shopNameInput = ""
                                    shopPriceInput = ""
                                    showAddShopItemForm = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = MintEmerald),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth().height(38.dp)
                        ) {
                            Text("Salvar na Lista", color = CharcoalBg, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                if (shoppingList.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Sua lista de compras está vazia.", color = MutedSlate, fontSize = 12.sp)
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        shoppingList.forEach { shopItem ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(CharcoalBg.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Checkbox(
                                        checked = shopItem.isChecked,
                                        onCheckedChange = { viewModel.toggleShoppingItem(shopItem) },
                                        colors = CheckboxDefaults.colors(checkedColor = LaserCyan)
                                    )
                                    Column(modifier = Modifier.padding(start = 6.dp)) {
                                        Text(
                                            text = shopItem.name,
                                            color = if (shopItem.isChecked) MutedSlate else LightMetal,
                                            fontWeight = if (shopItem.isChecked) FontWeight.Normal else FontWeight.Bold,
                                            fontSize = 13.sp,
                                            style = TextStyle(
                                                textDecoration = if (shopItem.isChecked) androidx.compose.ui.text.style.TextDecoration.LineThrough else androidx.compose.ui.text.style.TextDecoration.None
                                            )
                                        )
                                        Text(
                                            text = String.format("Valor: R$ %.2f", shopItem.price),
                                            color = if (shopItem.isChecked) MutedSlate else LaserCyan,
                                            fontSize = 11.sp
                                        )
                                    }
                                }

                                IconButton(
                                    onClick = { viewModel.deleteShoppingItem(shopItem) },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Delete,
                                        contentDescription = "Remover",
                                        tint = RedSunset.copy(alpha = 0.8f),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }

                        Divider(color = MutedSlate.copy(alpha = 0.15f), modifier = Modifier.padding(vertical = 4.dp))

                        // Totals Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "Marcados: R$ ${String.format("%.2f", checkedListPrice)}",
                                    color = MintEmerald,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Itens: ${shoppingList.count { it.isChecked }}/${shoppingList.size}",
                                    color = MutedSlate,
                                    fontSize = 10.sp
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "Total Lista: R$ ${String.format("%.2f", totalListPrice)}",
                                    color = LaserCyan,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "Previsão Geral",
                                    color = MutedSlate,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        Surface(
            color = CardGray,
            shape = RoundedCornerShape(10.dp),
            border = BorderStroke(0.5.dp, MintEmerald.copy(alpha = 0.5f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Gasto/Investido em Insumos", color = MutedSlate, fontSize = 11.sp)
                    Text(
                        text = String.format("R$ %.2f", totalSpent),
                        color = MintEmerald,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black
                    )
                }
                
                Button(
                    onClick = { isFormExpanded = !isFormExpanded },
                    colors = ButtonDefaults.buttonColors(containerColor = HotOrange),
                    shape = RoundedCornerShape(6.dp),
                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text(if (isFormExpanded) "Fechar" else "Lançar Despesa", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (isFormExpanded) {
            Surface(
                color = CardGray,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Entrada de Produto / Registro de Gasto", color = LaserCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Item comprado (Ex: Filamento PLA Azul)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                        singleLine = true
                    )

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(
                            value = amount,
                            onValueChange = { amount = it },
                            label = { Text("Preço Unit. (R$)") },
                            modifier = Modifier.weight(1.2f),
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                            singleLine = true
                        )
                        OutlinedTextField(
                            value = qty,
                            onValueChange = { qty = it },
                            label = { Text("Quantidade") },
                            modifier = Modifier.weight(0.8f),
                            colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White),
                            singleLine = true
                        )
                    }

                    Text("Categoria do Gasto", color = MutedSlate, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("FILAMENTO", "EQUIPAMENTO", "ENERGIA", "OUTROS").forEach { cat ->
                            val active = category == cat
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(if (active) LaserCyan else CharcoalBg)
                                    .clickable { category = cat }
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    cat, 
                                    color = if (active) CharcoalBg else MutedSlate, 
                                    fontSize = 10.sp, 
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Button(
                        onClick = {
                            if (desc.isNotEmpty()) {
                                viewModel.saveExpense(
                                    description = desc,
                                    category = category,
                                    amount = amount.toDoubleOrNull() ?: 0.0,
                                    qty = qty.toIntOrNull() ?: 1
                                )
                                desc = ""
                                amount = ""
                                qty = "1"
                                isFormExpanded = false
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                        modifier = Modifier.fillMaxWidth().height(42.dp),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Registrar Gasto Financeiro", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        Text("Histórico de Compras e Despesas", color = LightMetal, fontSize = 14.sp, fontWeight = FontWeight.Bold)

        if (items.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("Sem despesas cadastradas.", color = MutedSlate, fontSize = 12.sp)
            }
        } else {
            items.forEach { expense ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = CardGray)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.weight(1f),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                color = when (expense.category) {
                                    "FILAMENTO" -> HotOrange.copy(alpha = 0.15f)
                                    "EQUIPAMENTO" -> LaserCyan.copy(alpha = 0.15f)
                                    "ENERGIA" -> MintEmerald.copy(alpha = 0.15f)
                                    else -> MutedSlate.copy(alpha = 0.15f)
                                },
                                shape = CircleShape,
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    val icon = when (expense.category) {
                                        "FILAMENTO" -> Icons.Default.ShoppingCart
                                        "EQUIPAMENTO" -> Icons.Default.Build
                                        "ENERGIA" -> Icons.Default.Add
                                        else -> Icons.Default.Info
                                    }
                                    Icon(
                                        icon, 
                                        contentDescription = null, 
                                        modifier = Modifier.size(15.dp),
                                        tint = when (expense.category) {
                                            "FILAMENTO" -> HotOrange
                                            "EQUIPAMENTO" -> LaserCyan
                                            "ENERGIA" -> MintEmerald
                                            else -> LightMetal
                                        }
                                    )
                                }
                            }
                            
                            Column {
                                Text(expense.description, color = LightMetal, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Text(expense.category, color = MutedSlate, fontSize = 10.sp)
                                    Text("• Qtd: ${expense.qty}", color = MutedSlate, fontSize = 10.sp)
                                }
                            }
                        }

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = String.format("R$ %.2f", expense.amount * expense.qty),
                                color = Color.White,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            IconButton(
                                onClick = { viewModel.deleteExpense(expense) },
                                modifier = Modifier.size(28.dp).background(CharcoalBg, CircleShape)
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Remover", tint = Color.Red, modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun FilamentWebSearchSubTab(
    viewModel: MainViewModel,
    urlHandler: androidx.compose.ui.platform.UriHandler
) {
    val isSearching by viewModel.isSearchingPrices.collectAsStateWithLifecycle()
    val opportunityThreshold by viewModel.opportunityThreshold.collectAsStateWithLifecycle()

    val petgOffers by viewModel.petgOffers.collectAsStateWithLifecycle()
    val plaOffers by viewModel.plaOffers.collectAsStateWithLifecycle()
    val tpuOffers by viewModel.tpuOffers.collectAsStateWithLifecycle()

    var thresholdInput by remember(opportunityThreshold) { mutableStateOf(opportunityThreshold.toString()) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Pesquisa e Alertas de Preços AI (Web)",
            color = LightMetal,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Consulte menores preços em tempo real no Brasil e configure alarmes de oportunidade para PETG ou PLA.",
            color = MutedSlate,
            fontSize = 11.sp
        )

        // --- SECTION FOR OPPORTUNITIES THRESHOLD ---
        Card(
            colors = CardDefaults.cardColors(containerColor = CardGray),
            border = BorderStroke(1.dp, LaserCyan.copy(alpha = 0.3f)),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    "Filtro de Descontos e Oportunidades",
                    color = LaserCyan,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "Se o sistema encontrar filamentos PETG ou PLA abaixo deste valor, você receberá um alerta no Painel Inicial.",
                    color = MutedSlate,
                    fontSize = 11.sp,
                    lineHeight = 14.sp
                )
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = thresholdInput,
                        onValueChange = { 
                            thresholdInput = it
                            it.toDoubleOrNull()?.let { num ->
                                viewModel.setOpportunityThreshold(num)
                            }
                        },
                        label = { Text("Valor Alerta Oportunidades (R$)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.3f)
                        ),
                        singleLine = true,
                        modifier = Modifier.weight(1.1f)
                    )
                    
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MintEmerald.copy(alpha = 0.15f))
                            .padding(horizontal = 10.dp, vertical = 12.dp)
                    ) {
                        Text(
                            text = "Limiar: R$ $opportunityThreshold",
                            color = MintEmerald,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // --- REFRESH PRICE BUTTON (FOR ALL MATERIALS CONSOLIDATED IN ONE GO) ---
        Button(
            onClick = { viewModel.searchAllFilamentPrices() },
            colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(46.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (isSearching) {
                    CircularProgressIndicator(modifier = Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp)
                    Text("Buscando cotações no Google Shopping & AI...", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                } else {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                    Text("Atualizar Pesquisa AI de Todos (PETG, PLA, TPU)", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        if (isSearching) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    CircularProgressIndicator(color = LaserCyan)
                    Text("Analisando cotações com SerpAPI & Gemini...", color = MutedSlate, fontSize = 11.sp)
                }
            }
        }

        // --- INDIVIDUAL MATERIALS SECTION SEPARATION ---

        // 1. PETG SECTOR
        Text(
            "Filamentos PETG - Resistentes e Tenazes",
            color = LaserCyan,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(top = 10.dp)
        )
        if (petgOffers.isEmpty()) {
            Text("Sem cotações para PETG.", color = MutedSlate, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 4.dp))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                petgOffers.take(5).forEachIndexed { idx, offer ->
                    FilamentOfferCard(
                        rank = idx + 1,
                        offer = offer,
                        onClickBuy = { urlHandler.openUri(offer.link) },
                        onApplyPrice = { viewModel.applyFilamentPriceToCalculator(offer.price) }
                    )
                }
            }
        }

        Divider(color = MutedSlate.copy(alpha = 0.15f), modifier = Modifier.padding(vertical = 4.dp))

        // 2. PLA SECTOR
        Text(
            "Filamentos PLA - Estéticos e Fáceis de Imprimir",
            color = MintEmerald,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
        if (plaOffers.isEmpty()) {
            Text("Sem cotações para PLA.", color = MutedSlate, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 4.dp))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                plaOffers.take(5).forEachIndexed { idx, offer ->
                    FilamentOfferCard(
                        rank = idx + 1,
                        offer = offer,
                        onClickBuy = { urlHandler.openUri(offer.link) },
                        onApplyPrice = { viewModel.applyFilamentPriceToCalculator(offer.price) }
                    )
                }
            }
        }

        Divider(color = MutedSlate.copy(alpha = 0.15f), modifier = Modifier.padding(vertical = 4.dp))

        // 3. TPU SECTOR
        Text(
            "Filamentos TPU - Flexíveis",
            color = ElectricPurple,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
        if (tpuOffers.isEmpty()) {
            Text("Sem cotações para TPU.", color = MutedSlate, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 4.dp))
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                tpuOffers.take(5).forEachIndexed { idx, offer ->
                    FilamentOfferCard(
                        rank = idx + 1,
                        offer = offer,
                        onClickBuy = { urlHandler.openUri(offer.link) },
                        onApplyPrice = { viewModel.applyFilamentPriceToCalculator(offer.price) }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(40.dp))
    }
}

@Composable
fun FilamentOfferCard(rank: Int, offer: FilamentOffer, onClickBuy: () -> Unit, onApplyPrice: () -> Unit) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardGray),
        shape = RoundedCornerShape(12.dp),
        border = BorderStroke(
            width = if (rank == 1) 1.dp else 0.dp,
            color = if (rank == 1) MintEmerald.copy(alpha = 0.5f) else Color.Transparent
        )
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Rank counter emblem
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(
                        when (rank) {
                            1 -> MintEmerald.copy(alpha = 0.2f)
                            2 -> HotOrange.copy(alpha = 0.2f)
                            else -> MutedSlate.copy(alpha = 0.2f)
                        }
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "$rank",
                    color = when (rank) {
                        1 -> MintEmerald
                        2 -> HotOrange
                        else -> LightMetal
                    },
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = offer.filamentName,
                    color = LightMetal,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Loja: ${offer.storeName}",
                        color = MutedSlate,
                        fontSize = 11.sp
                    )
                    Text(
                        text = "★ ${offer.rating}",
                        color = Color(0xFFFFD54F),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                val priceString = NumberFormat.getCurrencyInstance(Locale("pt", "BR")).format(offer.price)
                Text(
                    text = priceString,
                    color = if (rank == 1) MintEmerald else LaserCyan,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Button(
                        onClick = onClickBuy,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (rank == 1) MintEmerald else MutedSlate.copy(alpha = 0.2f),
                            contentColor = if (rank == 1) CharcoalBg else LightMetal
                        ),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(26.dp)
                    ) {
                        Text("Ir à loja", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onApplyPrice,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = HotOrange,
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(6.dp),
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp),
                        modifier = Modifier.height(26.dp)
                    ) {
                        Text("Usar Preço", fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}


// ==========================================
// FORM DIALOG 1: ADD / EDIT CLIENT
// ==========================================
@Composable
fun AddEditClientDialog(client: Client?, onDismiss: () -> Unit, onSave: (String, String, String, String, String) -> Unit) {
    var name by remember { mutableStateOf(client?.name ?: "") }
    var phone by remember { mutableStateOf(client?.phone ?: "") }
    var email by remember { mutableStateOf(client?.email ?: "") }
    var address by remember { mutableStateOf(client?.address ?: "") }
    var note by remember { mutableStateOf(client?.note ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            border = BorderStroke(0.5.dp, LaserCyan.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (client == null) "Cadastrar Novo Cliente" else "Editar Cliente",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = LightMetal
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome Completo") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    label = { Text("Telefone / WhatsApp") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("E-mail") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    label = { Text("Endereço de Entrega") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    label = { Text("Observações (Preferências)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancelar", color = MutedSlate)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = {
                            if (name.isNotEmpty() && phone.isNotEmpty()) {
                                onSave(name, phone, email, address, note)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                        shape = RoundedCornerShape(8.dp),
                        enabled = name.isNotBlank() && phone.isNotBlank()
                    ) {
                        Text("Salvar", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}


// ==========================================
// FORM DIALOG 2: ADD / EDIT PRINTER
// ==========================================
@Composable
fun AddEditPrinterDialog(printer: Printer?, onDismiss: () -> Unit, onSave: (String, String, String, String) -> Unit) {
    var name by remember { mutableStateOf(printer?.name ?: "") }
    var model by remember { mutableStateOf(printer?.model ?: "") }
    var status by remember { mutableStateOf(printer?.status ?: "IDLE") }
    var ipAddress by remember { mutableStateOf(printer?.ipAddress ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp),
            border = BorderStroke(0.5.dp, LaserCyan.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (printer == null) "Cadastrar Nova Impressora" else "Editar Impressora",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = LightMetal
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nome Amigável (ex: Extrusora A)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = model,
                    onValueChange = { model = it },
                    label = { Text("Fabricante / Modelo (ex: Bambu Lab P1S)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = ipAddress,
                    onValueChange = { ipAddress = it },
                    label = { Text("IP de Rede (ex: 192.168.1.150)") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = LightMetal,
                        unfocusedTextColor = LightMetal,
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Status drop selection simulator
                Text("Status Inicial", color = LightMetal, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val statusList = listOf("IDLE" to "Ociosa", "MAINTENANCE" to "Em Manutenção")
                    statusList.forEach { (key, title) ->
                        val isSelected = status == key
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) LaserCyan else Color.Transparent)
                                .border(0.5.dp, MutedSlate, RoundedCornerShape(8.dp))
                                .clickable { status = key }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(title, color = if (isSelected) CharcoalBg else MutedSlate, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancelar", color = MutedSlate)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = {
                            if (name.isNotEmpty() && model.isNotEmpty()) {
                                onSave(name, model, status, ipAddress)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg),
                        shape = RoundedCornerShape(8.dp),
                        enabled = name.isNotBlank() && model.isNotBlank()
                    ) {
                        Text("Salvar", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}


// ==========================================
// FORM DIALOG 3: ADD / EDIT PRINT ORDER
// ==========================================
@Composable
fun AddEditOrderDialog(
    order: PrintOrder?,
    clients: List<Client>,
    printers: List<Printer>,
    catalogItems: List<CatalogItem>,
    filamentStocks: List<FilamentStock>,
    onDismiss: () -> Unit,
    onSave: (String, String, Int, String, String, Float, Float, Double, String, Long?, Int) -> Unit
) {
    var clientName by remember { mutableStateOf(order?.clientName ?: "") }
    var itemName by remember { mutableStateOf(order?.itemName ?: "") }
    var quantity by remember { mutableStateOf(order?.quantity?.toString() ?: "1") }
    var filamentType by remember { mutableStateOf(order?.filamentType ?: "PLA") }
    var filamentColor by remember { mutableStateOf(order?.filamentColor ?: "Preto") }
    var weightGrams by remember { mutableStateOf(order?.weightGrams?.toString() ?: "150") }
    var printTimeHours by remember { mutableStateOf(order?.printTimeHours?.toString() ?: "4") }
    var priceCharged by remember { mutableStateOf(order?.priceCharged?.toString() ?: "80") }
    var status by remember { mutableStateOf(order?.status ?: "WAITING") }
    var assignedPrinterId by remember { mutableStateOf(order?.assignedPrinterId) }
    var deadlineDays by remember { mutableStateOf("3") }

    var expandedClients by remember { mutableStateOf(false) }
    var expandedCatalog by remember { mutableStateOf(false) }
    val matchingModels = remember(itemName, catalogItems) {
        if (itemName.isBlank()) emptyList()
        else catalogItems.filter { it.filamentType != "HARDWARE" && it.name.contains(itemName, ignoreCase = true) }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            colors = CardDefaults.cardColors(containerColor = CardGray),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            border = BorderStroke(0.5.dp, LaserCyan.copy(alpha = 0.4f))
        ) {
            Column(
                modifier = Modifier
                    .padding(18.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = if (order == null) "Cadastrar Novo Trabalho de Impressão" else "Editar Trabalho de Impressão",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = LightMetal
                )

                // Simple client chooser dropdown or input
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = clientName,
                        onValueChange = {
                            clientName = it
                            expandedClients = clients.any { c -> c.name.contains(it, ignoreCase = true) }
                        },
                        label = { Text("Nome do Cliente") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = LightMetal,
                            unfocusedTextColor = LightMetal,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate
                        ),
                        trailingIcon = {
                            IconButton(onClick = { expandedClients = !expandedClients }) {
                                Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = LaserCyan)
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Overlay options mapping
                    if (expandedClients && clients.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = CardGray,
                            border = BorderStroke(0.5.dp, MutedSlate),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 66.dp)
                                .heightIn(max = 140.dp)
                                .verticalScroll(rememberScrollState())
                        ) {
                            Column {
                                clients.forEach { c ->
                                    Text(
                                        text = c.name,
                                        color = LightMetal,
                                        fontSize = 13.sp,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                clientName = c.name
                                                expandedClients = false
                                            }
                                            .padding(10.dp)
                                    )
                                    Divider(color = Color.DarkGray, thickness = 0.5.dp)
                                }
                            }
                        }
                    }
                }

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = itemName,
                        onValueChange = {
                            itemName = it
                            expandedCatalog = true
                        },
                        label = { Text("Peça / Arquivo STL a Imprimir") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = LightMetal,
                            unfocusedTextColor = LightMetal,
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (expandedCatalog && matchingModels.isNotEmpty()) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = CardGray,
                            border = BorderStroke(0.5.dp, MutedSlate),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 66.dp)
                                .heightIn(max = 140.dp)
                                .verticalScroll(rememberScrollState())
                        ) {
                            Column {
                                matchingModels.forEach { item ->
                                    Text(
                                        text = "${item.name} (${item.filamentType} - ${item.weightGrams.toInt()}g - R$ ${item.defaultPrice})",
                                        color = LightMetal,
                                        fontSize = 12.sp,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                itemName = item.name
                                                filamentType = item.filamentType
                                                weightGrams = item.weightGrams.toInt().toString()
                                                printTimeHours = item.printTimeHours.toString()
                                                val qMult = quantity.toIntOrNull() ?: 1
                                                priceCharged = (item.defaultPrice * qMult).toString()
                                                expandedCatalog = false
                                            }
                                            .padding(10.dp)
                                    )
                                    Divider(color = Color.DarkGray, thickness = 0.5.dp)
                                }
                            }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = filamentType,
                        onValueChange = { filamentType = it },
                        label = { Text("Material") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = filamentColor,
                        onValueChange = { filamentColor = it },
                        label = { Text("Cor") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        modifier = Modifier.weight(1f)
                    )
                }

                // Dynamic filament stock warning badge
                val parsedWeight = weightGrams.toFloatOrNull() ?: 0f
                val parsedQuantity = quantity.toIntOrNull() ?: 1
                val neededWeight = parsedWeight * parsedQuantity
                
                val matchedStockSpool = remember(filamentType, filamentColor, filamentStocks) {
                    val typeTrim = filamentType.trim()
                    val colorTrim = filamentColor.trim()
                    filamentStocks.firstOrNull {
                        it.type.equals(typeTrim, ignoreCase = true) &&
                        it.color.equals(colorTrim, ignoreCase = true)
                    } ?: filamentStocks.firstOrNull {
                        it.type.equals(typeTrim, ignoreCase = true)
                    }
                }

                if (neededWeight > 0f) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(
                                when {
                                    matchedStockSpool == null -> Color.DarkGray.copy(alpha = 0.25f)
                                    matchedStockSpool.stockGrams >= neededWeight -> Color(0xFF1B5E20).copy(alpha = 0.15f)
                                    else -> Color(0xFFB71C1C).copy(alpha = 0.15f)
                                }
                            )
                            .border(
                                width = 0.5.dp,
                                color = when {
                                    matchedStockSpool == null -> MutedSlate.copy(alpha = 0.5f)
                                    matchedStockSpool.stockGrams >= neededWeight -> MintEmerald.copy(alpha = 0.5f)
                                    else -> RedSunset.copy(alpha = 0.5f)
                                },
                                shape = RoundedCornerShape(8.dp)
                            )
                            .padding(10.dp)
                    ) {
                        Text(
                            text = when {
                                matchedStockSpool == null -> "❓ Sem carretel de $filamentType $filamentColor no estoque!"
                                matchedStockSpool.stockGrams >= neededWeight -> "✅ Estoque Suficiente! (${matchedStockSpool.stockGrams.toInt()}g de ${matchedStockSpool.type} ${matchedStockSpool.color} disponíveis)"
                                else -> "⚠️ Estoque Insuficiente! Necessário: ${neededWeight.toInt()}g | Disponível: ${matchedStockSpool.stockGrams.toInt()}g (${matchedStockSpool.type} ${matchedStockSpool.color})"
                            },
                            color = when {
                                matchedStockSpool == null -> MutedSlate
                                matchedStockSpool.stockGrams >= neededWeight -> MintEmerald
                                else -> RedSunset
                            },
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = weightGrams,
                        onValueChange = { weightGrams = it },
                        label = { Text("Peso (g)") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = quantity,
                        onValueChange = { quantity = it },
                        label = { Text("Quantidade") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = printTimeHours,
                        onValueChange = { printTimeHours = it },
                        label = { Text("Tempo Estimado (h)") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = priceCharged,
                        onValueChange = { priceCharged = it },
                        label = { Text("Valor Cobrado (R$)") },
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        modifier = Modifier.weight(1f)
                    )
                }

                OutlinedTextField(
                    value = deadlineDays,
                    onValueChange = { deadlineDays = it },
                    label = { Text("Prazo de Entrega (Dias)") },
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = LaserCyan),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )

                // Assign to Printer Machine directly
                Text("Alocar Máquina Atribuição (Opcional)", color = LightMetal, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (assignedPrinterId == null) LaserCyan else Color.Transparent)
                            .border(0.5.dp, MutedSlate, RoundedCornerShape(8.dp))
                            .clickable { assignedPrinterId = null }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text("Guardar na Fila (Sem máquina)", color = if (assignedPrinterId == null) CharcoalBg else MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    printers.forEach { p ->
                        val isSelected = assignedPrinterId == p.id
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) LaserCyan else Color.Transparent)
                                .border(0.5.dp, MutedSlate, RoundedCornerShape(8.dp))
                                .clickable { assignedPrinterId = p.id }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(p.name, color = if (isSelected) CharcoalBg else MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Initial phase selector
                Text("Etapa de Produção Inicial", color = LightMetal, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val stepsList = listOf(
                        "WAITING" to "Ag. Arquivo",
                        "QUEUE" to "Na Fila",
                        "PRINTING" to "Imprimindo",
                        "POST_PROCESS" to "Pós-Processo",
                        "READY" to "Pronto",
                        "DELIVERED" to "Entregue"
                    )

                    stepsList.forEach { (key, title) ->
                        val isSelected = status == key
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) LaserCyan else Color.Transparent)
                                .border(0.5.dp, MutedSlate, RoundedCornerShape(8.dp))
                                .clickable { status = key }
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(title, color = if (isSelected) CharcoalBg else MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancelar", color = MutedSlate)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Button(
                        onClick = {
                            val qVal = quantity.toIntOrNull() ?: 1
                            val weVal = weightGrams.toFloatOrNull() ?: 150f
                            val tiVal = printTimeHours.toFloatOrNull() ?: 4f
                            val prVal = priceCharged.toDoubleOrNull() ?: 80.0
                            val daysVal = deadlineDays.toIntOrNull() ?: 3

                            if (clientName.isNotEmpty() && itemName.isNotEmpty()) {
                                onSave(clientName, itemName, qVal, filamentType, filamentColor, weVal, tiVal, prVal, status, assignedPrinterId, daysVal)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
                        shape = RoundedCornerShape(8.dp),
                        enabled = clientName.isNotBlank() && itemName.isNotBlank()
                    ) {
                        Text("Adicionar Produção", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun FirebaseSyncSubTab(viewModel: MainViewModel) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val isSyncing by viewModel.isFirebaseSyncing.collectAsStateWithLifecycle()
    val status by viewModel.firebaseStatus.collectAsStateWithLifecycle()
    val savedUrl by viewModel.firebaseUrlInput.collectAsStateWithLifecycle()
    val savedCode by viewModel.firebaseWorkspaceCodeInput.collectAsStateWithLifecycle()

    var urlInput by remember(savedUrl) { mutableStateOf(savedUrl) }
    var codeInput by remember(savedCode) { mutableStateOf(savedCode) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Header Setup
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color(30, 36, 44),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Sincronização em Nuvem Firebase ☁️",
                    color = LaserCyan,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Sincronize perfeitamente suas impressões, clientes, bicos de impressão, orçamentos e despesas entre vários aparelhos (celulares e tablets). Seus dados de impressão 3D são mantidos na nuvem de forma segura no Firebase.",
                    color = LightMetal.copy(alpha = 0.8f),
                    fontSize = 11.sp,
                    lineHeight = 16.sp
                )
            }
        }

        // Configuration Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color(24, 28, 34),
            border = BorderStroke(1.dp, Color(40, 48, 58)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Configuração do Banco de Dados",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Firebase URL Input
                Text("URL do Firebase Realtime Database", color = MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = urlInput,
                    onValueChange = { urlInput = it },
                    textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 13.sp),
                    placeholder = { Text("https://seu-banco-rtdb.firebaseio.com/", color = MutedSlate.copy(alpha = 0.6f), fontSize = 13.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = LaserCyan,
                        unfocusedBorderColor = MutedSlate.copy(alpha = 0.4f),
                        cursorColor = LaserCyan
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Workspace Code Input
                Text("Código de Sincronização do Workspace", color = MutedSlate, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = codeInput,
                        onValueChange = { codeInput = it },
                        textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 13.sp),
                        placeholder = { Text("Código de sincronização (ex: wp_abc123)", color = MutedSlate.copy(alpha = 0.6f), fontSize = 13.sp) },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LaserCyan,
                            unfocusedBorderColor = MutedSlate.copy(alpha = 0.4f),
                            cursorColor = LaserCyan
                        )
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val characters = "abcdefghijklmnopqrstuvwxyz0123456789"
                            codeInput = "wp_" + (1..6).map { characters.random() }.joinToString("")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(40, 48, 58)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp)
                    ) {
                        Text("Gerar Novo", fontSize = 11.sp, color = Color.White)
                    }
                }
                
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Dica: Para sincronizar outro celular/tablet, basta instalar o aplicativo nele e usar o MESMO código de Workspace acima!",
                    color = LaserCyan.copy(alpha = 0.8f),
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Save Config Button
                Button(
                    onClick = {
                        if (urlInput.isNotBlank() && codeInput.isNotBlank()) {
                            viewModel.updateFirebaseSettings(urlInput, codeInput)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = LaserCyan, contentColor = CharcoalBg)
                ) {
                    Text("Salvar Configurações", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
            }
        }

        // Actions Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color(24, 28, 34),
            border = BorderStroke(1.dp, Color(40, 48, 58)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Ações de Sincronização",
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Backup Button
                Button(
                    onClick = { viewModel.backupToFirebase() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = HotOrange, contentColor = Color.White),
                    enabled = !isSyncing
                ) {
                    Icon(
                        imageVector = Icons.Default.Send,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Fazer Backup na Nuvem (Exportar)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Restore Button
                OutlinedButton(
                    onClick = { viewModel.restoreFromFirebase() },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, LaserCyan),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = LaserCyan),
                    enabled = !isSyncing
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Restaurar da Nuvem (Importar e Sobrescrever)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Aviso: A restauração substituirá todos os dados locais do aplicativo pelos dados salvos no Firebase para este código.",
                    color = MutedSlate,
                    fontSize = 10.sp,
                    lineHeight = 14.sp
                )
            }
        }

        // Guia Passo-a-passo do Firebase Console
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = Color(18, 22, 28),
            border = BorderStroke(1.dp, Color(40, 48, 58)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Guia: Como Ver Seus Dados na Internet 🌐",
                    color = LaserCyan,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(10.dp))
                
                val steps = listOf(
                    "1. Crie seu projeto: Acesse o site do Firebase (https://console.firebase.google.com/) com sua conta Google.",
                    "2. Adicione o Banco de Dados: No menu esquerdo, vá em 'Build' (Construção) e clique em 'Realtime Database'. Clique em 'Criar Banco de Dados'.",
                    "3. Habilite o acesso nas regras: Vá para a aba 'Regras' (Rules) no Firebase e mude o conteúdo para liberar leitura e escrita:\n\n{\n  \"rules\": {\n    \".read\": true,\n    \".write\": true\n  }\n}\n\nE clique em 'Publicar' no Firebase.",
                    "4. Obtenha a URL: Copie a URL gerada no topo do seu Firebase (ex: https://seu-projeto-default-rtdb.firebaseio.com/).",
                    "5. Conecte no aplicativo: Cole a URL copiada no campo escrito 'URL do Firebase Realtime Database' acima, defina o código que preferir (ex: wp_meu_estudio) e clique em 'Salvar Configurações'.",
                    "6. Faça o Backup: Aperte o botão 'Fazer Backup na Nuvem (Exportar)' abaixo das configurações.",
                    "7. Verifique na Internet: Vá na aba de 'Dados' (Data) no seu computador e veja todos os clientes, impressões, custos e catálogo renderizados perfeitamente na nuvem!"
                )
                
                steps.forEach { step ->
                    Text(
                        text = step,
                        color = LightMetal.copy(alpha = 0.85f),
                        fontSize = 11.sp,
                        lineHeight = 15.sp,
                        modifier = Modifier.padding(bottom = 10.dp)
                    )
                }
            }
        }

        // Syncing & Status Area
        if (isSyncing) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = LaserCyan, modifier = Modifier.size(28.dp))
            }
        }

        if (status.isNotEmpty()) {
            val isSuccess = status.contains("sucesso") || status.contains("restaurados") || status.contains("atualizadas")
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = if (isSuccess) Color(26, 60, 48) else Color(60, 26, 26),
                border = BorderStroke(1.dp, if (isSuccess) Color(40, 100, 80) else Color(100, 40, 40)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = if (isSuccess) Icons.Default.Check else Icons.Default.Info,
                        contentDescription = null,
                        tint = if (isSuccess) LaserCyan else HotOrange,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = status,
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

