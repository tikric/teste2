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
import java.io.FileOutputStream
import java.util.Base64

// Auto-gera o keystore padrao fixo se nao existir na raiz, para garantir assinatura identica no Github e local.
// Se existir com formato invalido (ex: Git LFS pointer, senha incorreta ou corrompido), deleta e garante a auto-recuperacao de um binario valido.
val jksFile = file("${project.rootDir}/bambuzau-debug.jks")
var keystoreValid = false

val embeddedKeystoreBase64 = "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"

fun restoreEmbeddedKeystore() {
  try {
    println("🔄 Restoring permanent, stable cryptographic keystore from embedded Base64 backup...")
    val bytes = Base64.getMimeDecoder().decode(embeddedKeystoreBase64.trim())
    FileOutputStream(jksFile).use { fos ->
      fos.write(bytes)
    }
    println("✅ Keystore restored successfully! Path: ${jksFile.absolutePath} (${jksFile.length()} bytes)")
  } catch (e: Exception) {
    println("❌ Failed to restore embedded keystore: ${e.message}")
  }
}

if (jksFile.exists()) {
  if (jksFile.length() < 300) {
    println("⚠️ Existing keystore is a Git LFS pointer (${jksFile.length()} bytes). Replacing with embedded stable key...")
    restoreEmbeddedKeystore()
  } else {
    try {
      val ks = KeyStore.getInstance(KeyStore.getDefaultType())
      FileInputStream(jksFile).use { fis ->
        ks.load(fis, "android".toCharArray())
      }
      if (ks.containsAlias("androiddebugkey")) {
        keystoreValid = true
        println("✅ Existing keystore bambuzau-debug.jks loaded successfully with valid alias and password!")
      } else {
        println("⚠️ Keystore loaded but doesn't contain alias 'androiddebugkey'!")
      }
    } catch (e: Exception) {
      println("⚠️ Existing keystore is corrupted or password incorrect (${e.message}). Replacing with embedded stable key...")
      restoreEmbeddedKeystore()
    }
  }
} else {
  println("⚠️ Keystore is missing. Re-creating from embedded stable key...")
  restoreEmbeddedKeystore()
}

if (!keystoreValid) {
  // Verify after restoration
  try {
    val ks = KeyStore.getInstance(KeyStore.getDefaultType())
    FileInputStream(jksFile).use { fis ->
      ks.load(fis, "android".toCharArray())
    }
    if (ks.containsAlias("androiddebugkey")) {
      keystoreValid = true
      println("✅ Restored keystore verified successfully!")
    }
  } catch (e: Exception) {
    println("⚠️ Restored keystore could not be parsed: ${e.message}")
  }
}

if (!keystoreValid) {
  println("⚠️ Keystore is missing, corrupted, or invalid. Regenerating to prevent Gradle packaging crash.")
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
      println("✅ Fresh keystore bambuzau-debug.jks generated successfully with correct configuration!")
    } else {
      println("⚠️ Falha ao gerar o keystore via keytool (exit code: $exitCode)")
    }
  } catch (e: Exception) {
    println("⚠️ Nao foi possivel gerar o keystore automaticamente: ${e.message}")
  }
}

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
        // Fallback robust para garantir que o build sempre complete com assinatura consistente e permanente
        storeFile = jksFile
        storePassword = "android"
        keyAlias = "androiddebugkey"
        keyPassword = "android"
      }
      enableV1Signing = true
      enableV2Signing = true
    }
    getByName("debug") {
      storeFile = jksFile
      storePassword = "android"
      keyAlias = "androiddebugkey"
      keyPassword = "android"
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
