/*
 * =====================================================================================
 * FINAL WORKING ARDUINO SKETCH FOR BISU THESIS RFID ATTENDANCE SYSTEM
 * Hardware: NodeMCU (ESP8266) + RC522 RFID Reader
 * 
 * Wi-Fi SSID  : BISU_WIFI
 * Wi-Fi Pass  : B!SU@wifi2026
 * Server API  : https://thesis-project-production-c531.up.railway.app/api/attendance/rfid-device
 * 
 * WIRING DIAGRAM:
 *   RC522 Pin  ->  NodeMCU Pin
 *   --------------------------
 *   SDA (SS)   ->  D2 (GPIO 4)
 *   RST        ->  D1 (GPIO 5)
 *   SCK        ->  D5 (GPIO 14)
 *   MISO       ->  D6 (GPIO 12)
 *   MOSI       ->  D7 (GPIO 13)
 *   3.3V       ->  3V3 (Do NOT connect to 5V!)
 *   GND        ->  GND
 * =====================================================================================
 */

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// Hardware Pin Definitions
#define SS_PIN   D2  // SDA -> D2 (GPIO 4)
#define RST_PIN  D1  // RST -> D1 (GPIO 5)

MFRC522 mfrc522(SS_PIN, RST_PIN);

// Wi-Fi Credentials & Server Configuration
const char *ssid = "BISU_WIFI";
const char *password = "B!SU@wifi2026";
const char* URL = "https://thesis-project-production-c531.up.railway.app/api/attendance/rfid-device";

// Card Scan Anti-Duplicate Cooldown (2 seconds for same card)
String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN_MS = 2000;

// Function Prototypes
void connectToWiFi();
void initRFIDReader();
void sendScanToServer(String cardUID);

// =====================================================================================
void setup() {
  delay(1000);
  Serial.begin(115200);

  // Set onboard Blue LED (Blinks on scan)
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // OFF (Active LOW)

  // Initialize Hardware SPI Bus
  SPI.begin();
  delay(100);

  Serial.println(F("\n========================================================"));
  Serial.println(F("  BISU NodeMCU RFID Attendance System (Production Final)"));
  Serial.println(F("========================================================"));

  // Step 1: Connect to Wi-Fi
  connectToWiFi();

  // Step 2: Initialize RC522 Reader & boost antenna gain to MAX
  initRFIDReader();

  Serial.println(F("\n[SYSTEM READY] Present an RFID Card / Keyfob near the reader..."));
}

// =====================================================================================
void loop() {
  // Auto-reconnect Wi-Fi if connection drops
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    initRFIDReader();
  }

  // Check for new card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Read card serial UID
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Convert raw card bytes to Decimal string UID (Database format)
  String cardUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    cardUID += String(mfrc522.uid.uidByte[i]);
  }

  // Prevent double scanning the exact same card within 2 seconds
  unsigned long now = millis();
  if (cardUID == lastScannedUID && (now - lastScanTime < SCAN_COOLDOWN_MS)) {
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(100);
    return;
  }

  // Update cooldown tracker
  lastScannedUID = cardUID;
  lastScanTime = now;

  // Flash blue onboard LED feedback
  digitalWrite(LED_BUILTIN, LOW);  // Turn ON LED
  delay(150);
  digitalWrite(LED_BUILTIN, HIGH); // Turn OFF LED

  Serial.println(F("\n--------------------------------------------------------"));
  Serial.print(F("🎉 CARD SCANNED! Decimal UID: "));
  Serial.println(cardUID);

  // Send Card UID to Railway Server
  sendScanToServer(cardUID);

  // Halt PICC & reset antenna field for immediate next scan
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  mfrc522.PCD_AntennaOn();

  delay(400); // Brief pause before ready for next student
}

// =====================================================================================
void initRFIDReader() {
  mfrc522.PCD_Init();
  delay(50);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max); // Max gain (48dB) for best range
  mfrc522.PCD_AntennaOn();

  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("RC522 Firmware Version: 0x"));
  Serial.println(version, HEX);

  if (version == 0x91 || version == 0x92) {
    Serial.println(F("✅ SUCCESS! RC522 Reader detected and ready!"));
  } else {
    Serial.println(F("⚠️ WARNING: RC522 check failed! Verify 3.3V power & wiring."));
  }
}

// =====================================================================================
void sendScanToServer(String cardUID) {
  Serial.println(F("Connecting to Railway server..."));

  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Required for Railway HTTPS SSL certificate

    HTTPClient http;
    Serial.print(F("Target URL: "));
    Serial.println(URL);

    if (http.begin(client, URL)) {
      http.addHeader("Content-Type", "application/json");

      // Construct JSON Payload with unique device MAC address
      String deviceID = WiFi.macAddress();
      String jsonPayload = "{\"rfid_uid\":\"" + cardUID + "\", \"device_id\":\"" + deviceID + "\"}";
      Serial.print(F("Device MAC    : "));
      Serial.println(deviceID);
      Serial.print(F("Posting Payload: "));
      Serial.println(jsonPayload);

      int httpCode = http.POST(jsonPayload);
      String response = http.getString();

      Serial.print(F("HTTP Status Code: "));
      Serial.println(httpCode);
      Serial.print(F("Server Response  : "));
      Serial.println(response);

      if (httpCode == 200 || httpCode == 201) {
        Serial.println(F("✅ ATTENDANCE RECORDED SUCCESSFULLY!"));
      } else if (httpCode == 404) {
        Serial.println(F("⚠️ CARD UNKNOWN OR NO ONGOING EVENT FOUND."));
      } else if (httpCode == 403) {
        Serial.println(F("⛔ ACCESS DENIED: Student is not an active member of this org."));
      }

      http.end();
    } else {
      Serial.println(F("❌ Failed to initiate HTTP connection."));
    }
  } else {
    Serial.println(F("❌ Wi-Fi disconnected! Cannot send scan."));
  }
}

// =====================================================================================
void connectToWiFi() {
  WiFi.mode(WIFI_OFF);
  delay(300);
  WiFi.mode(WIFI_STA);
  Serial.print(F("Connecting to Wi-Fi: "));
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start < 10000)) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println("");

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("✅ Connected to Wi-Fi!"));
    Serial.print(F("NodeMCU IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("⚠️ Wi-Fi connection timed out. Retrying..."));
  }
  delay(300);
}
