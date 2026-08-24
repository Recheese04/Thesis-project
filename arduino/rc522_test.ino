/*
 * Minimal RC522 SPI Test for NodeMCU
 * If this prints 0x91 or 0x92 = working!
 * If 0xFF or 0x00 = wiring problem
 *
 * WIRING:  SDA->D2, SCK->D5, MOSI->D7, MISO->D6, RST->D1, 3.3V, GND
 */
#include <SPI.h>

// Using GPIO numbers directly (in case D-labels are wrong on your board)
#define SS_PIN   4    // D2 = GPIO4
#define RST_PIN  5    // D1 = GPIO5
// SPI hardware pins (cannot change): SCK=GPIO14(D5), MISO=GPIO12(D6), MOSI=GPIO13(D7)

void setup() {
  Serial.begin(9600);
  delay(1000);
  
  pinMode(RST_PIN, OUTPUT);
  pinMode(SS_PIN, OUTPUT);
  digitalWrite(SS_PIN, HIGH);  // deselect RC522
  
  // Hard reset the RC522
  digitalWrite(RST_PIN, LOW);
  delay(100);
  digitalWrite(RST_PIN, HIGH);
  delay(100);
  
  SPI.begin();
  SPI.beginTransaction(SPISettings(1000000, MSBFIRST, SPI_MODE0));
  
  Serial.println("SPI Test - Reading RC522 version register...");
  Serial.println();
}

void loop() {
  // Read register 0x37 (VersionReg) manually via SPI
  digitalWrite(SS_PIN, LOW);
  SPI.transfer(0x37 << 1 | 0x80);  // read command for reg 0x37
  byte version = SPI.transfer(0x00);
  digitalWrite(SS_PIN, HIGH);
  
  Serial.print("Version register = 0x");
  Serial.println(version, HEX);
  
  if (version == 0x91) {
    Serial.println(">> SUCCESS! RC522 v1.0 detected!");
  } else if (version == 0x92) {
    Serial.println(">> SUCCESS! RC522 v2.0 detected!");
  } else if (version == 0xFF) {
    Serial.println(">> FAIL: MISO floating (check SCK, MISO, SDA wires)");
  } else if (version == 0x00) {
    Serial.println(">> FAIL: No response (check MOSI, SCK, power)");
  } else {
    Serial.print(">> Unknown response: 0x");
    Serial.println(version, HEX);
  }
  
  Serial.println("---");
  delay(2000);
}
