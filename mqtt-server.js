const express = require('express');
const http = require('http');
const mqtt = require('mqtt');
const socketIo = require('socket.io');
const path = require('path');

// Express app setup
const app = express();
const server = http.createServer(app);

// Configure Socket.IO with CORS - FIXED
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins 
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling'] // Explicitly define transports
  }
});

// MQTT Configuration
const mqttBroker = 'mqtt://test.mosquitto.org';
const mqttOptions = {
  clientId: 'nodeServer_' + Math.random().toString(16).substring(2, 8),
  clean: true
};

// MQTT Topics
const ESP_PUBLISH_TOPIC = 'esp/message'; // ESP8266 publishes to this topic
const ESP_SUBSCRIBE_TOPIC = 'esp/command'; // ESP8266 subscribes to this topic

// Connect to MQTT broker
const mqttClient = mqtt.connect(mqttBroker, mqttOptions);

// MQTT Connection events
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe(ESP_PUBLISH_TOPIC, (err) => {
    if (!err) {
      console.log(`Subscribed to ${ESP_PUBLISH_TOPIC}`);
    }
  });
});

mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Receive messages from MQTT and send to web clients
mqttClient.on('message', (topic, message) => {
  if (topic === ESP_PUBLISH_TOPIC) {
    const messageStr = message.toString();
    console.log(`Message from ESP8266: ${messageStr}`);
    io.emit('espMessage', messageStr);
  }
});

// Enable CORS for Express routes - ADDED
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API endpoint to send commands to ESP8266
app.post('/api/send', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  mqttClient.publish(ESP_SUBSCRIBE_TOPIC, message);
  console.log(`Sent to ESP8266: ${message}`);
  res.json({ success: true });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
  socket.on('sendToESP', (message) => {
    mqttClient.publish(ESP_SUBSCRIBE_TOPIC, message);
    console.log(`Sent to ESP8266 via WebSocket: ${message}`);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Closing MQTT connection');
  mqttClient.end();
  process.exit();
});