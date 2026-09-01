/*
 * Standalone RFID Reader Test Sketch for NodeMCU (ESP8266) + RC522
 * 
 * Purpose: Tests card scanning in a continuous loop and prints the card UID
 *          in both Decimal (Database format) and Hexadecimal formats to Serial Monitor.
 *          No Wi-Fi or Internet required.
 * 
 * WIRING:
 *   RC522 Pin  ->  NodeMCU Pin
 *   --------------------------
 *   SDA (SS)   ->  D2 (GPIO 4)
 *   RST        ->  D1 (GPIO 5)
 *   SCK        ->  D5 (GPIO 14)
 *   MISO       ->  D6 (GPIO 12)
 *   MOSI       ->  D7 (GPIO 13)
 *   3.3V       ->  3V3 (Do NOT use 5V!)
 *   GND        ->  GND
 */

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   D2  // SDA -> D2
#define RST_PIN  D1  // RST -> D1

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Onboard Blue LED setup (Blinks when card is scanned)
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // OFF (Active LOW)

  // Initialize Hardware SPI
  SPI.begin();
  delay(100);

  // Initialize MFRC522 reader
  mfrc522.PCD_Init();
  delay(50);

  // Boost antenna gain to maximum (48dB) for best reading distance
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  mfrc522.PCD_AntennaOn();

  Serial.println(F("\n=================================================="));
  Serial.println(F("   RC522 RFID Standalone Reader Test (Loop)       "));
  Serial.println(F("=================================================="));

  // Check reader version register
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("MFRC522 Firmware Version: 0x"));
  Serial.println(version, HEX);

  if (version == 0x91 || version == 0x92) {
    Serial.println(F("✅ RC522 Reader detected and ready!"));
  } else {
    Serial.println(F("❌ WARNING: RC522 not detected! Check 3.3V power & wiring."));
  }

  Serial.println(F("\n👉 Tap an RFID Card or Keyfob near the reader..."));
  Serial.println(F("--------------------------------------------------"));
}

void loop() {
  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  // Select one of the cards
  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // Flash onboard LED on successful read
  digitalWrite(LED_BUILTIN, LOW);  // Turn ON LED
  delay(100);
  digitalWrite(LED_BUILTIN, HIGH); // Turn OFF LED

  // Build Card UID in Decimal format (Used by Thesis DB)
  String decUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    decUID += String(mfrc522.uid.uidByte[i]);
  }

  // Build Card UID in Hexadecimal format (Standard RFID format)
  String hexUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) hexUID += "0";
    hexUID += String(mfrc522.uid.uidByte[i], HEX);
    if (i < mfrc522.uid.size - 1) hexUID += " ";
  }
  hexUID.toUpperCase();

  // Get Card PICC Type (e.g. MIFARE 1KB, Ultralight, etc.)
  MFRC522::PICC_Type piccType = mfrc522.PICC_GetType(mfrc522.uid.sak);

  // Print Details to Serial Monitor
  Serial.println(F("\n🎉 CARD DETECTED!"));
  Serial.print(F(" 💳 Decimal UID (Database): "));
  Serial.println(decUID);
  Serial.print(F(" 🏷️  HEX UID:               "));
  Serial.println(hexUID);
  Serial.print(F(" ℹ️  Card Type:             "));
  Serial.println(mfrc522.PICC_GetTypeName(piccType));
  Serial.println(F("--------------------------------------------------"));

  // Halt PICC and stop encryption to prepare reader for next scan
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Re-init antenna so next scan works immediately
  mfrc522.PCD_Init();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  mfrc522.PCD_AntennaOn();

  delay(300); // Small pause before next read
}
