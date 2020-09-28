#include <dht.h>

#include <fontlargenumber.h>
#include <MicroView.h>
#include <space01.h>
#include <7segment.h>
#include <font8x16.h>
#include <space03.h>
#include <space02.h>
#include <font5x7.h>
#include <math.h>

double Thermistor(int RawADC) {
  double Temp;
  Temp = log(10000.0/(1024.0/RawADC-1));
  Temp = 1 / (0.001129148 + (0.000234125 + (0.0000000876741 * Temp * Temp )) * Temp);
  Temp = Temp - 273.15;
  return Temp;
}

void setup() {
  Serial.begin(9600);
  uView.begin();
  uView.clear(PAGE);
  uView.print("Yo yo yo");
  uView.display();
}

dht DHT;

void loop() {
  uView.clear(PAGE);
  uView.setCursor(0,0);
  double ti = Thermistor(analogRead(A0));
  int chk = DHT.read11(3);
  double tx = Thermistor(analogRead(A3));
  double hum = DHT.humidity;
  int dryness = 100 - 10 * analogRead(A2) / 103;
  uView.print(ti);
  uView.println("C i");
  uView.print(tx);
  uView.println("C x");
  uView.print(hum);
  uView.println("% x");
  uView.display();
  // 110=TI
  // 120=TX
  // 130=rain
  // 140=humidity
  Serial.println(110);
  Serial.println(ti);
  Serial.println(120);
  Serial.println(tx);
  Serial.println(130);
  Serial.println(dryness);
  Serial.println(140);
  Serial.println(hum);
  delay(300000);
}
