/*
 * Pin Identifier - Blinks each pin one at a time
 * Connect an LED (or just watch the voltage with the RC522 LED)
 * Move the SDA wire to each pin to find the one that blinks
 */

void setup() {
  Serial.begin(9600);
  delay(1000);
  Serial.println("PIN BLINK TEST");
  Serial.println("Move your SDA wire to find the blinking pin!");
  Serial.println();
}

void loop() {
  // Test each D-pin one by one
  int pins[] = {D0, D1, D2, D3, D4, D5, D6, D7, D8};
  String names[] = {"D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"};
  
  for (int i = 0; i < 9; i++) {
    pinMode(pins[i], OUTPUT);
    
    Serial.print(">>> NOW BLINKING: ");
    Serial.print(names[i]);
    Serial.print(" (GPIO");
    Serial.print(pins[i]);
    Serial.println(") <<<");
    
    // Blink 5 times
    for (int j = 0; j < 5; j++) {
      digitalWrite(pins[i], HIGH);
      delay(300);
      digitalWrite(pins[i], LOW);
      delay(300);
    }
    
    delay(1000);  // pause between pins
  }
  
  Serial.println("=== RESTARTING TEST ===");
  Serial.println();
}
