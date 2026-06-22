package com.bambuzau3d

import android.os.Bundle
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.app.Activity
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import com.bambuzau3d.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {

    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> }

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (filePathCallback != null) {
            val intentData = result.data
            val results = if (result.resultCode == Activity.RESULT_OK && intentData != null) {
                if (intentData.data != null) {
                    arrayOf(intentData.data!!)
                } else if (intentData.clipData != null) {
                    val count = intentData.clipData!!.itemCount
                    Array(count) { i -> intentData.clipData!!.getItemAt(i).uri }
                } else {
                    null
                }
            } else {
                null
            }
            filePathCallback?.onReceiveValue(results)
            filePathCallback = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        if (androidx.core.content.ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.RECORD_AUDIO
            ) != android.content.pm.PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
        }

        setContent {
            MyApplicationTheme {
                val localUrl = "https://appassets.androidplatform.net/assets/index.html"
                WebViewScreen(
                    url = localUrl,
                    onShowFileChooser = { callback, params ->
                        filePathCallback?.onReceiveValue(null)
                        filePathCallback = callback
                        try {
                            val intent = params.createIntent()
                            fileChooserLauncher.launch(intent)
                            true
                        } catch (e: Exception) {
                            filePathCallback?.onReceiveValue(null)
                            filePathCallback = null
                            false
                        }
                    }
                )
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    url: String,
    onShowFileChooser: (ValueCallback<Array<Uri>>, WebChromeClient.FileChooserParams) -> Boolean
) {
    var webViewInstance by remember { mutableStateOf<WebView?>(null) }
    var loadedUrl by remember { mutableStateOf("") }

    BackHandler(enabled = webViewInstance?.canGoBack() == true) {
        try {
            webViewInstance?.goBack()
        } catch (e: Exception) {}
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            val assetLoader = WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                .build()

            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                
                setDownloadListener { downloadUrl, _, _, _, _ ->
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl))
                        context.startActivity(intent)
                    } catch (e: Exception) {}
                }
                
                webViewClient = object : WebViewClient() {
                    override fun doUpdateVisitedHistory(view: WebView?, url: String?, isReload: Boolean) {
                        super.doUpdateVisitedHistory(view, url, isReload)
                        webViewInstance = view
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView,
                        request: WebResourceRequest
                    ): Boolean {
                        val requestUrl = request.url
                        val urlString = requestUrl?.toString() ?: ""
                        if (urlString.isNotEmpty() && !urlString.contains("appassets.androidplatform.net")) {
                            try {
                                val intent = Intent(Intent.ACTION_VIEW, requestUrl)
                                context.startActivity(intent)
                                return true
                            } catch (e: Exception) {}
                        }
                        return false
                    }

                    override fun shouldInterceptRequest(
                        view: WebView,
                        request: WebResourceRequest
                    ): WebResourceResponse? {
                        return try {
                            assetLoader.shouldInterceptRequest(request.url)
                        } catch (e: Exception) {
                            null
                        }
                    }
                }
                
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    javaScriptCanOpenWindowsAutomatically = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    loadWithOverviewMode = true
                    useWideViewPort = true
                }
                
                webChromeClient = object : WebChromeClient() {
                    override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                        android.util.Log.d("WebViewConsole", "${consoleMessage?.message()} -- From line ${consoleMessage?.lineNumber()} of ${consoleMessage?.sourceId()}")
                        return true
                    }

                    override fun onPermissionRequest(request: android.webkit.PermissionRequest?) {
                        request?.grant(request.resources)
                    }

                    override fun onShowFileChooser(
                        webView: WebView?,
                        filePathCallback: ValueCallback<Array<Uri>>?,
                        fileChooserParams: FileChooserParams?
                    ): Boolean {
                        if (filePathCallback == null || fileChooserParams == null) return false
                        return onShowFileChooser(filePathCallback, fileChooserParams)
                    }
                }
                
                addJavascriptInterface(WebAppInterface(context), "AndroidInterface")

                webViewInstance = this
            }
        },
        update = { webView ->
            if (url.isNotEmpty() && url != loadedUrl) {
                loadedUrl = url
                try {
                    webView.loadUrl(url)
                } catch (e: Exception) {}
            }
        }
    )
}

class WebAppInterface(private val context: Context) {
    @android.webkit.JavascriptInterface
    fun getNativeVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "3.2.0.0"
        } catch (e: Exception) {
            BuildConfig.VERSION_NAME
        }
    }

    @android.webkit.JavascriptInterface
    fun copyToClipboard(text: String) {
        (context as? Activity)?.runOnUiThread {
            try {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("Gestão 3D", text)
                clipboard.setPrimaryClip(clip)
                android.widget.Toast.makeText(context, "Texto copiado com sucesso! ✓", android.widget.Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                android.util.Log.e("WebAppInterface", "Copy failed", e)
            }
        }
    }

    @android.webkit.JavascriptInterface
    fun saveFile(fileName: String, base64DataOrText: String, mimeType: String) {
        (context as? Activity)?.runOnUiThread {
            try {
                val bytes = if (base64DataOrText.contains(",")) {
                    val base64Clean = base64DataOrText.substringAfter(",")
                    android.util.Base64.decode(base64Clean, android.util.Base64.DEFAULT)
                } else {
                    try {
                        android.util.Base64.decode(base64DataOrText, android.util.Base64.DEFAULT)
                    } catch (e: Exception) {
                        base64DataOrText.toByteArray(Charsets.UTF_8)
                    }
                }

                val resolver = context.contentResolver
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    val contentValues = android.content.ContentValues().apply {
                        put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                        put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mimeType)
                        put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
                    }
                    val uri = resolver.insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                    if (uri != null) {
                        resolver.openOutputStream(uri).use { outputStream ->
                            outputStream?.write(bytes)
                        }
                        android.widget.Toast.makeText(context, "Salvo na pasta Downloads: $fileName ✓", android.widget.Toast.LENGTH_LONG).show()
                    } else {
                        throw Exception("Falha ao criar URI no MediaStore")
                    }
                } else {
                    val downloadsDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                    val file = java.io.File(downloadsDir, fileName)
                    java.io.FileOutputStream(file).use { outputStream ->
                        outputStream.write(bytes)
                    }
                    android.media.MediaScannerConnection.scanFile(context, arrayOf(file.toString()), null, null)
                    android.widget.Toast.makeText(context, "Salvo na pasta Downloads: $fileName ✓", android.widget.Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                android.widget.Toast.makeText(context, "Erro ao salvar arquivo: ${e.message}", android.widget.Toast.LENGTH_LONG).show()
            }
        }
    }
}
