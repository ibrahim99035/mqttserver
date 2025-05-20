/*
  ESP8266 MQTT Client for Node.js server
  This sketch connects to an MQTT broker and:
  - Publishes messages to the 'esp/message' topic
  - Subscribes to the 'esp/command' topic to receive commands
*/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker settings
const char* mqtt_server = "YOUR_MQTT_BROKER_IP"; // Use your server's IP address
const int mqtt_port = 1883;
const char* mqtt_client_id = "ESP8266Client";
const char* mqtt_username = ""; // Leave empty if no authentication
const char* mqtt_password = ""; // Leave empty if no authentication

// MQTT Topics
const char* mqtt_pub_topic = "esp/message";
const char* mqtt_sub_topic = "esp/command";

// Set up WiFi client and MQTT client
WiFiClient espClient;
PubSubClient client(espClient);

// Variables for message handling
unsigned long lastMsgTime = 0;
char msg[50];
int counter = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  // Convert payload to string
  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println(message);
  
  // Process the received command here
  // For example, you could control an LED or other hardware
  
  // Echo the received command back as a confirmation
  String response = "Received command: " + message;
  response.toCharArray(msg, response.length() + 1);
  client.publish(mqtt_pub_topic, msg);
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Attempt to connect
    if (client.connect(mqtt_client_id, mqtt_username, mqtt_password)) {
      Serial.println("connected");
      
      // Once connected, publish an announcement...
      client.publish(mqtt_pub_topic, "ESP8266 connected!");
      
      // ... and resubscribe
      client.subscribe(mqtt_sub_topic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  // Make sure we're connected to the MQTT broker
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Send a status message every 30 seconds
  unsigned long now = millis();
  if (now - lastMsgTime > 30000) {
    lastMsgTime = now;
    counter++;
    snprintf(msg, 50, "ESP8266 status update #%d", counter);
    Serial.print("Publishing message: ");
    Serial.println(msg);
    client.publish(mqtt_pub_topic, msg);
  }
}