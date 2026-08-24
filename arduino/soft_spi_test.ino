/*
 * Software SPI test - bypasses hardware SPI entirely
 * Uses manual bit-banging on different pins
 * 
 * WIRING FOR THIS TEST:
 *   SDA  -> D2
 *   SCK  -> D1
 *   MOSI -> D3
 *   MISO -> D4
 *   RST  -> D0
 *   3.3V -> 3V3
 *   GND  -> GND
 */

#define PIN_SDA   D2   // SS
#define PIN_SCK   D1   // Clock
#define PIN_MOSI  D3   // Data to RC522
#define PIN_MISO  D4   // Data from RC522
#define PIN_RST   D0   // Reset

// Manual SPI transfer (bit-bang)
byte softSPI(byte data) {
  byte reply = 0;
  for (int i = 7; i >= 0; i--) {
    digitalWrite(PIN_MOSI, (data >> i) & 1);
    digitalWrite(PIN_SCK, HIGH);
    delayMicroseconds(10);
    if (digitalRead(PIN_MISO)) reply |= (1 << i);
    digitalWrite(PIN_SCK, LOW);
    delayMicroseconds(10);
  }
  return reply;
}

void setup() {
  Serial.begin(9600);
  delay(1000);

  pinMode(PIN_SDA, OUTPUT);
  pinMode(PIN_SCK, OUTPUT);
  pinMode(PIN_MOSI, OUTPUT);
  pinMode(PIN_MISO, INPUT);
  pinMode(PIN_RST, OUTPUT);

  digitalWrite(PIN_SDA, HIGH);
  digitalWrite(PIN_SCK, LOW);

  // Hard reset
  digitalWrite(PIN_RST, LOW);
  delay(100);
  digitalWrite(PIN_RST, HIGH);
  delay(100);

  Serial.println("=== SOFTWARE SPI TEST ===");
  Serial.println("Wiring: SDA->D2, SCK->D1, MOSI->D3, MISO->D4, RST->D0");
  Serial.println();
}

void loop() {
  // Read VersionReg (0x37)
  digitalWrite(PIN_SDA, LOW);
  softSPI((0x37 << 1) | 0x80);
  byte version = softSPI(0x00);
  digitalWrite(PIN_SDA, HIGH);

  Serial.print("Version = 0x");
  Serial.print(version, HEX);

  if (version == 0x91 || version == 0x92) {
    Serial.println(" >> SUCCESS!");
  } else if (version == 0xFF) {
    Serial.println(" >> FAIL (0xFF)");
  } else if (version == 0x00) {
    Serial.println(" >> FAIL (0x00)");
  } else {
    Serial.println(" >> Unknown");
  }

  delay(2000);
}
