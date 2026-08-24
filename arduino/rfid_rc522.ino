//*******************************libraries********************************
//RFID-----------------------------
#include <SPI.h>
#include <MFRC522.h>
#include <WiFiClientSecure.h>
//NodeMCU--------------------------
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

//************************************************************************
// NODEMCU GPIO WIRING:
// SDA -> D4
// RST -> D3
// SCK  -> D5
// MISO -> D6
// MOSI -> D7
// 3.3V -> 3V3
// GND  -> GND
//************************************************************************
#define SS_PIN   D2  // SDA -> D2
#define RST_PIN  D1  // RST -> D1

MFRC522 mfrc522(SS_PIN, RST_PIN); 

//************************************************************************
/* Wi-Fi & Backend Server Credentials */
const char *ssid = "POSTANES WIFI";
const char *password = "Rechie@James!4!";
const char* device_token = "2c4f3c61aa79d533";

String URL = "https://thesis-project-production-c531.up.railway.app/api/attendance/rfid-scan"; 

// Track last card scanned and time to prevent duplicate rapid scans of the same card
String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN_MS = 2000; // 2 seconds delay for same card

//************************************************************************
void setup() {
  delay(1000);
  Serial.begin(115200);
  
  // Onboard Blue LED setup
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // Turn OFF LED (Active LOW)

  // Initialize Standard Hardware SPI
  SPI.begin();
  delay(100);

  Serial.println(F("\n=================================================="));
  Serial.println(F("   NodeMCU RFID Attendance System (Continuous Scan) "));
  Serial.println(F("=================================================="));

  // Connect to Wi-Fi first
  connectToWiFi();

  // Initialize MFRC522 after Wi-Fi setup & boost antenna gain to MAX (48dB)
  initRFIDReader();

  Serial.println(F("\n[SYSTEM READY] Present your RFID Card / Keyfob near the reader..."));
}

//************************************************************************
void loop() {
  // Ensure Wi-Fi stays connected
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    initRFIDReader();
  }

  // Check for new card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Read card serial
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Build Card UID string (Decimal format used by database)
  String CardID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    CardID += String(mfrc522.uid.uidByte[i]);
  }

  // Prevent double scanning the EXACT SAME card within 2 seconds
  unsigned long now = millis();
  if (CardID == lastScannedUID && (now - lastScanTime < SCAN_COOLDOWN_MS)) {
    // Same card tapped too quickly, ignore repeat
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(100);
    return;
  }

  // Update last scan tracker
  lastScannedUID = CardID;
  lastScanTime = now;

  // Visual LED Flash Feedback on Card Scan (Blinks Blue LED)
  digitalWrite(LED_BUILTIN, LOW);  // Turn ON LED
  delay(150);
  digitalWrite(LED_BUILTIN, HIGH); // Turn OFF LED

  Serial.println(F("\n--------------------------------------------------"));
  Serial.print(F("🎉 CARD SCANNED! UID: "));
  Serial.println(CardID);

  // Send Card ID to Railway backend API
  SendCardID(CardID);

  // Reset card state and prepare reader for next card immediately
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  
  // Re-enable RF Field so next card scans reliably
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  mfrc522.PCD_AntennaOn();

  delay(500); // 0.5s pause before ready for next student
}

//************Initialize/Reset RFID Reader*************
void initRFIDReader() {
  mfrc522.PCD_Init(); 
  delay(50);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max); // Set max gain (48dB) for best reading distance
  mfrc522.PCD_AntennaOn();
  
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("MFRC522 Firmware Version: 0x"));
  Serial.println(version, HEX);

  if (version == 0x91 || version == 0x92) {
    Serial.println(F(">>> SUCCESS! RC522 READER READY FOR CONTINUOUS SCANS! <<<"));
  } else {
    Serial.println(F("WARNING: RC522 check failed or loose wires!"));
  }
}

//************send the Card UID to the website*************
void SendCardID(String Card_uid) {
  Serial.println(F("Sending Card ID to Railway server..."));
  
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Required for HTTPS Railway domain

    HTTPClient http;
    String getData = "?rfid_uid=" + String(Card_uid) + "&device_token=" + String(device_token);
    String Link = URL + getData;

    Serial.print(F("Requesting URL: "));
    Serial.println(Link);
    
    if (http.begin(client, Link)) {
      int httpCode = http.GET();
      String payload = http.getString();

      Serial.print(F("HTTP Response Code: "));
      Serial.println(httpCode);
      Serial.print(F("Server Payload: "));
      Serial.println(payload);

      http.end();
    } else {
      Serial.println(F("Failed to initiate HTTP connection."));
    }
  } else {
    Serial.println(F("Wi-Fi not connected! Cannot send scan."));
  }
}

//********************connect to the WiFi******************
void connectToWiFi() {
  WiFi.mode(WIFI_OFF);
  delay(300);
  WiFi.mode(WIFI_STA);
  Serial.print(F("Connecting to "));
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  unsigned long startTime = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - startTime < 10000)) {
    delay(500);
    Serial.print(F("."));
  }
  Serial.println("");
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("Connected to Wi-Fi!"));
    Serial.print(F("IP address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("Wi-Fi connection timed out. Retrying..."));
  }
  
  delay(300);
}
