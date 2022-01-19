// Include libraries needed to compile the code
#include <Arduino.h>
#if defined(ESP32)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif
#include <Firebase_ESP_Client.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <TridentTD_OpenWeather.h>
#include <SPI.h>
#include <Adafruit_GFX.h>      // Core graphics library
#include <Adafruit_ST7735.h  > // Hardware-specific library
#include <WiFiManager.h>

// Set DHT connections
#define DHTPIN 2 // What digital pin we're connected to
// Uncomment whatever type you're using!
#define DHTTYPE DHT11 // DHT 11
//#define DHTTYPE DHT22   // DHT 22, AM2302, AM2321
//#define DHTTYPE DHT21   // DHT 21, AM2301
DHT dht(DHTPIN, DHTTYPE);

// Define the LCD pin connections
#define TFT_CS D2
#define TFT_RST D3 // Or set to -1 and connect to Arduino RESET pin
#define TFT_DC D8
Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);

// Set RGB led pins
#define red 16
#define blue 12
#define green 5

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

// Insert Firebase project API Key
#define API_KEY "KEY"

// Insert Authorized Email and Corresponding Password
#define USER_EMAIL "USER"
#define USER_PASSWORD "PASSWORD"

// Insert RTDB URLefine the RTDB URL
#define DATABASE_URL "URL"

// Define API Weather Key
#define OpenWeather_APIKEY "KEY"

// Variable for weather location data
TridentTD_OpenWeather myPlace(OpenWeather_APIKEY);

// Define Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Variable to save USER UID
String uid;

// Variables to save database paths
String databasePath;
String tempPath;
String humPath;

// DHT sensor
float temperature;
float humidity;

// Timer variables (send new readings every three minutes)
unsigned long sendDataPrevMillis = 0;
unsigned long timerDelay = 3000;

// Data variables used to retrieve and switch between cases
String tempOutStr;
String humOutStr;
float tempAux;
float humAux;
float tempOut;
float humOut;
String tempPref;
String humPref;

// Initialize WiFi
void initWiFi()
{
    WiFi.mode(WIFI_STA); // explicitly set mode, esp defaults to STA+AP
    // it is a good practice to make sure your code sets wifi mode how you want it.
    // Debug console

    //WiFiManager, Local intialization. Once its business is done, there is no need to keep it around
    WiFiManager wifiMgr;
    wifiMgr.autoConnect("SmartHome", "smarthome8266"); // password protected ap
}

// Write float values to the database
void sendFloat(String path, float value)
{
    if (Firebase.RTDB.setFloat(&fbdo, path.c_str(), value))
    {
        Serial.print("Writing value: ");
        Serial.print(value);
        Serial.print(" on the following path: ");
        Serial.println(path);
        Serial.println("PASSED");
        Serial.println("PATH: " + fbdo.dataPath());
        Serial.println("TYPE: " + fbdo.dataType());
    }
    else
    {
        Serial.println("FAILED");
        Serial.println("REASON: " + fbdo.errorReason());
    }
}

void RGBColor(int red_light_value, int green_light_value, int blue_light_value)
{
    analogWrite(red, red_light_value);
    analogWrite(green, green_light_value);
    analogWrite(blue, blue_light_value);
}

void getUserInput()
{
    // Get input data from user
    Firebase.RTDB.getString(&fbdo, "tempPref/temp", &tempPref);
    Serial.println(tempPref);
    if (tempPref.toInt() >= 15 && tempPref.toInt() <= 30)
        tempAux = tempPref.toInt();
    Firebase.RTDB.deleteNode(&fbdo, "tempPref");
    Firebase.RTDB.getString(&fbdo, "humPref/hum", &humPref);
    if (humPref.toInt() >= 30 && humPref.toInt() <= 60)
        humAux = humPref.toInt();
    Firebase.RTDB.deleteNode(&fbdo, "humPref");
}

void getWeatherData()
{
    // Update weather data from database
    Firebase.RTDB.getString(&fbdo, "tempOut/tempOut", &tempOutStr);
    Firebase.RTDB.getString(&fbdo, "humOut/humOut", &humOutStr);
    char tempOutChar[8];
    char humOutChar[8];
    tempOutStr.toCharArray(tempOutChar, tempOutStr.length() + 1);
    tempOut = atof(tempOutChar);
    humOutStr.toCharArray(humOutChar, humOutStr.length() + 1);
    humOut = atof(humOutChar);
    //Serial.println(tempAux);
    //Serial.println(tempOut);
}

void executeCase()
{
    // User cases
    if (temperature > tempAux)
    {
        if (temperature > tempOut)
        {
            //open window
            RGBColor(69, 176, 140);
            delay(3000);
            //Serial.println(tempAux);
        }
        else
        {
            //turn on AC
            RGBColor(0, 255, 255);
            delay(3000);
            //Serial.println(tempAux);
        }
    }
    else if (temperature < tempAux)
    {
        if (temperature < tempOut)
        {
            //open window
            RGBColor(128, 0, 0);
            delay(3000);
            //Serial.println(tempAux);
        }
        else
        {
            //turn on heating
            RGBColor(255, 165, 0);
            delay(3000);
            //Serial.println(tempAux);
        }
    }
    else if (humidity < humAux)
    {
        if (humidity < humOut)
        {
            //open window
            RGBColor(0, 0, 128);
            delay(3000);
            //Serial.println(humAux);
        }
        else
        {
            //turn on air humidifier
            RGBColor(0, 128, 128);
            delay(3000);
            //Serial.println(humAux);
        }
    }
    else if (humidity > humAux)
    {
        if (humidity > humOut)
        {
            //open window
            RGBColor(255, 191, 0);
            delay(3000);
            //Serial.println(humAux);
        }
        else
        {
            //turn on AC
            RGBColor(255, 127, 80);
            delay(3000);
            //Serial.println(humAux);
        }
    }
}

void setup()
{
    Serial.begin(115200);
    //initialize tft LCD
    tft.initR(INITR_144GREENTAB); // Init ST7735R chip, green tab
    tft.fillScreen(ST77XX_BLACK);
    tft.setRotation(2); // set display orientation

    //set led pins to output
    pinMode(red, OUTPUT);
    pinMode(green, OUTPUT);
    pinMode(blue, OUTPUT);

    // Initialize WiFi connection
    initWiFi();

    // Assign the api key (required)
    config.api_key = API_KEY;

    // Assign the user sign in credentials
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;

    // Assign the RTDB URL (required)
    config.database_url = DATABASE_URL;

    Firebase.reconnectWiFi(true);
    fbdo.setResponseSize(4096);

    // Assign the callback function for the long running token generation task */
    config.token_status_callback = tokenStatusCallback; //see addons/TokenHelper.h

    // Assign the maximum retry of token generation
    config.max_token_generation_retry = 5;

    // Initialize the library with the Firebase authen and config
    Firebase.begin(&config, &auth);
    dht.begin();

    // Getting the user UID might take a few seconds
    Serial.println("Getting User UID");
    while ((auth.token.uid) == "")
    {
        Serial.print('.');
        delay(1000);
    }
    // Print user UID
    uid = auth.token.uid.c_str();
    Serial.print("User UID: ");
    Serial.println(uid);

    // Update database path
    databasePath = "/UsersData/" + uid;

    // Update database path for sensor readings
    tempPath = databasePath + "/temperature"; // --> UsersData/<user_uid>/temperature
    humPath = databasePath + "/humidity";     // --> UsersData/<user_uid>/humidity
}

void loop()
{
    //set default led color
    RGBColor(143, 0, 255);

    // Send new readings to database
    if (Firebase.ready() && (millis() - sendDataPrevMillis > timerDelay || sendDataPrevMillis == 0))
    {
        sendDataPrevMillis = millis();

        // Get latest sensor readings
        temperature = dht.readTemperature();
        humidity = dht.readHumidity();
        tempAux = temperature;
        humAux = humidity;
        // Send readings to database:
        sendFloat(tempPath, temperature);
        sendFloat(humPath, humidity);

        //show indoors data on screen
        inToScreen();
        delay(1500);

        //get data and execute commands based on the retrieved data
        getUserInput();
        getWeatherData();
        executeCase();

        //show indoors data on screen
        outToScreen();
        delay(1500);
    }
}

void printText(byte x_pos, byte y_pos, String text, byte text_size, uint16_t color)
{
    tft.setCursor(x_pos, y_pos);
    tft.setTextSize(text_size);
    tft.setTextColor(color);
    tft.setTextWrap(true);
    tft.print(text);
}

void printCustom(byte x_pos, byte y_pos, float number, int decimal, String text, byte text_size, uint16_t color)
{
    tft.setCursor(x_pos, y_pos);
    tft.setTextSize(text_size);
    tft.setTextColor(color);
    tft.setTextWrap(true);
    tft.print(number, decimal);
    tft.print(text);
}

void inToScreen()
{
    if (isnan(humidity) || humidity == 2147483648)
        humidity = 0;
    if (isnan(temperature))
        temperature = 0;
    tft.fillScreen(ST77XX_BLACK);
    printText(13, 5, "INAUNTRU", 2, ST77XX_WHITE);
    printCustom(10, 40, temperature, 1, "C", 3, ST77XX_ORANGE);
    printCustom(10, 80, humidity, 0, "%", 3, ST77XX_BLUE);
    //delay(2000);
}

void outToScreen()
{
    if (isnan(humOut) || humOut == 2147483648)
        humOut = 0;
    if (isnan(tempOut))
        tempOut = 0;
    tft.fillScreen(ST77XX_BLACK);
    printText(15, 5, "AFARA", 2, ST77XX_WHITE);
    printCustom(10, 40, tempOut, 1, "C", 3, ST77XX_ORANGE);
    printCustom(10, 80, humOut, 0, "%", 3, ST77XX_BLUE);
    //delay(2000);
}
