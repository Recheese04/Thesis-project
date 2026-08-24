// ============================================
// RC522 WIRE TEST - Adjust wires while running
// ============================================
// Upload this sketch, open Serial Monitor (115200 baud),
// then wiggle/adjust each wire one at a time.
// The serial output will tell you instantly if
// the RC522 is detected and if cards can be read.
//
// WIRING:
// SDA  -> D4
// RST  -> D3
// SCK  -> D5
// MISO -> D6
// MOSI -> D7
// 3.3V -> 3V3
// GND  -> GND
// ============================================

#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN   D2  // SDA -> D2
#define RST_PIN  D1  // RST -> D1

MFRC522 mfrc522(SS_PIN, RST_PIN);

int loopCount = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  SPI.begin();
  mfrc522.PCD_Init();
  delay(100);

  Serial.println(F("\n============================================="));
  Serial.println(F("   RC522 WIRE TEST - Adjust wires now!"));
  Serial.println(F("============================================="));
  Serial.println(F("This loops every 1 second."));
  Serial.println(F("Watch for OK / FAIL messages below.\n"));
}

void loop() {
  loopCount++;

  // Re-init every loop so loose wires get re-detected
  mfrc522.PCD_Init();
  delay(50);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  mfrc522.PCD_AntennaOn();

  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);

  Serial.print(F("[#"));
  Serial.print(loopCount);
  Serial.print(F("] RC522 chip: "));

  if (version == 0x91 || version == 0x92) {
    Serial.print(F("OK (0x"));
    Serial.print(version, HEX);
    Serial.print(F(")"));
  } else if (version == 0x00 || version == 0xFF) {
    Serial.print(F("FAIL - No connection! Check 3.3V, GND, SCK, MOSI, MISO, SDA wires"));
  } else {
    Serial.print(F("UNKNOWN (0x"));
    Serial.print(version, HEX);
    Serial.print(F(") - check wires"));
  }

  // Try to detect a card
  Serial.print(F("  |  Card: "));
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i]);
    }
    Serial.print(F("DETECTED! UID = "));
    Serial.print(uid);

    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  } else {
    Serial.print(F("none (tap a card to test)"));
  }

  Serial.println();
  delay(1000);
}
