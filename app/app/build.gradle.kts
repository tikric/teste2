plugins {
  alias(libs.plugins.android.application)
  alias(libs.plugins.kotlin.android)
  alias(libs.plugins.kotlin.compose)
  alias(libs.plugins.google.devtools.ksp)
  alias(libs.plugins.roborazzi)
  alias(libs.plugins.secrets)
}

import java.security.KeyStore
import java.io.FileInputStream

// Auto-gera ou carrega o keystore padrao fixo de forma inteligente e nao destrutiva.
// Se existir com formato valido, tenta carregar com as senhas candidatas usuais e detecta o alias correto
// para garantir que a mesma assinatura seja usada e nunca mais de conflito de atualizacao no celular!
val jksFile = file("${project.rootDir}/bambuzau-debug.jks")
var keystoreValid = false
var detectedAlias = "androiddebugkey"
var detectedPassword = "android"

if (jksFile.exists()) {
  if (jksFile.length() < 300) {
    println("⚠️ Existing keystore is a Git LFS pointer (${jksFile.length()} bytes). Deleting LFS file to pull proper layout...")
    try {
      jksFile.delete()
    } catch (e: Exception) {
      println("⚠️ Failed to delete Git LFS pointer: ${e.message}")
    }
  } else {
    // Tenta abrir de forma robusta e ler o alias dinamicamente com senhas comuns
    val candidatePasswords = listOf("android", "bambuzau", "bambuzau123", "bambuzau3d")
    var loadedSuccess = false
    for (pwd in candidatePasswords) {
      try {
        val ks = KeyStore.getInstance(KeyStore.getDefaultType())
        FileInputStream(jksFile).use { fis ->
          ks.load(fis, pwd.toCharArray())
        }
        val aliases = ks.aliases().toList()
        if (aliases.isNotEmpty()) {
          detectedAlias = aliases.first().toString()
          detectedPassword = pwd
          keystoreValid = true
          loadedSuccess = true
          println("✅ Existing keystore bambuzau-debug.jks loaded successfully! Alias: '$detectedAlias', Password: '$pwd'")
          break
        }
      } catch (e: Exception) {
        // Tenta a proxima senha candidata
      }
    }
    
    if (!loadedSuccess) {
      println("⚠️ WARNING: Existing keystore cannot be parsed with usual passwords. KEEPING THE FILE intact to avoid losing original signatures!")
      // Consideramos valido para tentar de boa no Gradle sem deletar o seu arquivo original binario
      keystoreValid = true
    }
  }
}

if (!keystoreValid && !jksFile.exists()) {
  println("⚠️ Keystore is missing. Generating a consistent development keystore.")
  try {
    val javaHome = System.getProperty("java.home")
    val keytoolExecutable = if (javaHome != null) file("$javaHome/bin/keytool").absolutePath else "keytool"
    println("🚀 Running keytool from absolute path: $keytoolExecutable to build $jksFile")
    val pb = ProcessBuilder(
      keytoolExecutable, "-genkeypair",
      "-v",
      "-keystore", jksFile.absolutePath,
      "-alias", "androiddebugkey",
      "-keyalg", "RSA",
      "-keysize", "2048",
      "-validity", "10000",
      "-storetype", "JKS",
      "-storepass", "android",
      "-keypass", "android",
      "-dname", "CN=Bambuzau, O=Bambuzau3D, C=BR"
    )
    pb.inheritIO()
    val process = pb.start()
    val exitCode = process.waitFor()
    if (exitCode == 0) {
      keystoreValid = true
      detectedAlias = "androiddebugkey"
      detectedPassword = "android"
      println("✅ Fresh keystore bambuzau-debug.jks generated successfully with standard configurations!")
    } else {
      println("⚠️ Falha ao gerar o keystore via keytool (exit code: $exitCode)")
    }
  } catch (e: Exception) {
    println("⚠️ Nao foi possivel gerar o keystore automaticamente: ${e.message}")
  }
}

val finalStoreFile = if (jksFile.exists()) jksFile else null
val finalStorePassword = detectedPassword
val finalKeyAlias = detectedAlias
val finalKeyPassword = detectedPassword

android {
  namespace = "com.bambuzau3d"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.aistudio.bambuzau.yqwmkb"
    minSdk = 24
    targetSdk = 35

    // Obter automaticamente a versao do package.json na raiz do projeto
    val packageJsonFile = file("${project.rootDir}/package.json")
    var pkgVersion = "3.2.1.0"
    if (packageJsonFile.exists()) {
        val text = packageJsonFile.readText()
        val match = "\"version\"\\s*:\\s*\"([^\"]+)\"".toRegex().find(text)
        if (match != null) {
            pkgVersion = match.groupValues[1]
        }
    }

    // Calcula de forma segura o versionCode de acordo com o versionName (ex: "3.2.0.0" -> 3020000)
    val versionParts = pkgVersion.split(".").map { it.toIntOrNull() ?: 0 }
    val major = versionParts.getOrElse(0) { 3 }
    val minor = versionParts.getOrElse(1) { 2 }
    val patch = versionParts.getOrElse(2) { 0 }
    val buildVal = versionParts.getOrElse(3) { 0 }
    versionCode = major * 1000000 + minor * 10000 + patch * 100 + buildVal
    versionName = pkgVersion

    testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
  }

  signingConfigs {
    create("release") {
      val customKeystorePath = System.getenv("KEYSTORE_PATH")
      val keystoreFile = if (customKeystorePath.isNullOrBlank()) null else {
        if (customKeystorePath.startsWith("/") || customKeystorePath.contains(":\\") || customKeystorePath.contains(":/")) {
          file(customKeystorePath)
        } else {
          file("${project.rootDir}/$customKeystorePath")
        }
      }
      
      val customStorePass = System.getenv("STORE_PASSWORD")
      val customKeyPass = System.getenv("KEY_PASSWORD")
      val customAlias = System.getenv("KEY_ALIAS")
      
      var hasCustomFile = false
      var finalAlias = customAlias ?: "upload"
      
      if (keystoreFile != null && keystoreFile.exists() && !customStorePass.isNullOrBlank()) {
        try {
          if (keystoreFile.length() < 300) {
            println("⚠️ WARNING [Gradle]: Custom keystore file is too small (${keystoreFile.length()} bytes) and is likely a Git LFS pointer! Skipping...")
          } else {
            val ks = KeyStore.getInstance(KeyStore.getDefaultType())
            FileInputStream(keystoreFile).use { fis ->
              ks.load(fis, customStorePass.toCharArray())
            }
            // Auto-detect alias or verify specified one
            val aliases = ks.aliases().toList().map { it.toString() }
            if (aliases.isNotEmpty()) {
              if (customAlias.isNullOrBlank() || !ks.containsAlias(customAlias)) {
                finalAlias = aliases.first()
                println("✨ Auto-detected keystore alias: $finalAlias")
              }
              hasCustomFile = true
              println("✅ Custom keystore '${keystoreFile.name}' validated successfully in Gradle!")
            } else {
              println("⚠️ WARNING [Gradle]: Custom keystore contains no aliases!")
            }
          }
        } catch (e: Exception) {
          println("⚠️ WARNING [Gradle]: Custom keystore is invalid or password incorrect (${e.message})! Falling back to persistent debug key.")
        }
      }
      
      val useProduction = hasCustomFile && !customStorePass.isNullOrBlank() && !customKeyPass.isNullOrBlank()
      
      if (useProduction) {
        storeFile = keystoreFile
        storePassword = customStorePass
        keyAlias = finalAlias
        keyPassword = customKeyPass
      } else {
        // Fallback robusto e inteligente que usa as credenciais autodetectadas da JKS para evitar novos pares aleatorios
        if (finalStoreFile != null && finalStoreFile.exists()) {
          storeFile = finalStoreFile
          storePassword = finalStorePassword
          keyAlias = finalKeyAlias
          keyPassword = finalKeyPassword
        } else {
          // Deixa o default nativo para que o Gradle use a debug key padrao estável da sua propria maquina
          println("⚠️ [Signature-Warning]: fall-backing to native system debug.keystore")
        }
      }
      enableV1Signing = true
      enableV2Signing = true
    }
    getByName("debug") {
      if (finalStoreFile != null && finalStoreFile.exists()) {
        storeFile = finalStoreFile
        storePassword = finalStorePassword
        keyAlias = finalKeyAlias
        keyPassword = finalKeyPassword
      } else {
        println("⚙️ [Signature-Info]: using native system debug.keystore on this machine")
      }
      enableV1Signing = true
      enableV2Signing = true
    }
  }

  buildTypes {
    release {
      isCrunchPngs = false
      isMinifyEnabled = false
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
      
      // Sempre usa a configuracao "release" que agora possui garantias de inicializacao com fallback
      signingConfig = signingConfigs.getByName("release")
    }
    debug {
      // Usa de forma consistente a mesma chave
      signingConfig = signingConfigs.getByName("debug")
    }
  }
  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
  }
  kotlinOptions {
    jvmTarget = "17"
  }
  buildFeatures {
    compose = true
    buildConfig = true
  }
  testOptions { unitTests { isIncludeAndroidResources = true } }
}

// Configure the Secrets Gradle Plugin to use .env and .env.example files
// to match the convention used in Web projects.
secrets {
  propertiesFileName = ".env"
  defaultPropertiesFileName = ".env.example"
  // Exclude keys that are strictly for node/server or are not used in compile-time Kotlin,
  // preventing illegal expression compilation errors on empty environment setups.
  ignoreList.add("SERPER_API_KEY")
  ignoreList.add("ANTHROPIC_API_KEY")
  ignoreList.add("TAVILY_API_KEY")
  ignoreList.add("JINA_API_KEY")
  ignoreList.add("GROQ_API_KEY")
}

// Some unused dependencies are commented out below instead of being removed.
// This makes it easy to add them back in the future if needed.
dependencies {
  implementation(platform(libs.androidx.compose.bom))
  implementation(platform(libs.firebase.bom))
  // implementation(libs.accompanist.permissions)
  implementation(libs.androidx.activity.compose)
  // implementation(libs.androidx.camera.camera2)
  // implementation(libs.androidx.camera.core)
  // implementation(libs.androidx.camera.lifecycle)
  // implementation(libs.androidx.camera.view)
  implementation(libs.androidx.compose.material.icons.core)
  // implementation(libs.androidx.compose.material.icons.extended)
  implementation(libs.androidx.compose.material3)
  implementation(libs.androidx.compose.ui)
  implementation(libs.androidx.compose.ui.graphics)
  implementation(libs.androidx.compose.ui.tooling.preview)
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.webkit)
  // implementation(libs.androidx.datastore.preferences)
  implementation(libs.androidx.lifecycle.runtime.compose)
  implementation(libs.androidx.lifecycle.runtime.ktx)
  implementation(libs.androidx.lifecycle.viewmodel.compose)
  // implementation(libs.androidx.navigation.compose)
  implementation(libs.androidx.room.ktx)
  implementation(libs.androidx.room.runtime)
  // implementation(libs.coil.compose)
  implementation(libs.converter.moshi)
  // implementation(libs.firebase.ai)
  implementation(libs.kotlinx.coroutines.android)
  implementation(libs.kotlinx.coroutines.core)
  implementation(libs.logging.interceptor)
  implementation(libs.moshi.kotlin)
  implementation(libs.okhttp)
  // implementation(libs.play.services.location)
  implementation(libs.retrofit)
  testImplementation(libs.androidx.compose.ui.test.junit4)
  testImplementation(libs.androidx.core)
  testImplementation(libs.androidx.junit)
  testImplementation(libs.junit)
  testImplementation(libs.kotlinx.coroutines.test)
  testImplementation(libs.robolectric)
  testImplementation(libs.roborazzi)
  testImplementation(libs.roborazzi.compose)
  testImplementation(libs.roborazzi.junit.rule)
  androidTestImplementation(platform(libs.androidx.compose.bom))
  androidTestImplementation(libs.androidx.compose.ui.test.junit4)
  androidTestImplementation(libs.androidx.espresso.core)
  androidTestImplementation(libs.androidx.junit)
  androidTestImplementation(libs.androidx.runner)
  debugImplementation(libs.androidx.compose.ui.test.manifest)
  debugImplementation(libs.androidx.compose.ui.tooling)
  "ksp"(libs.androidx.room.compiler)
  "ksp"(libs.moshi.kotlin.codegen)
}
