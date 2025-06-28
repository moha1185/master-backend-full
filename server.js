
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const devicesPath = path.join(dataDir, 'devices.json');
if (!fs.existsSync(devicesPath)) fs.writeFileSync(devicesPath, '[]');

const configsPath = path.join(dataDir, 'configs.json');
if (!fs.existsSync(configsPath)) fs.writeFileSync(configsPath, '{}');

// Register device
app.post('/api/register-device', (req, res) => {
    console.log("Registering device:", req.body);
    const device = req.body;
    if (!device.deviceId) return res.status(400).json({ error: "Missing deviceId" });
    let devices = JSON.parse(fs.readFileSync(devicesPath));
    const index = devices.findIndex(d => d.deviceId === device.deviceId);
    if (index >= 0) {
        devices[index] = { ...devices[index], ...device, lastSeen: Date.now() };
    } else {
        device.lastSeen = Date.now();
        devices.push(device);
    }
    fs.writeFileSync(devicesPath, JSON.stringify(devices));
    res.sendStatus(200);
});

// Get active devices
app.get('/api/devices', (req, res) => {
    let devices = JSON.parse(fs.readFileSync(devicesPath));
    devices = devices.filter(d => Date.now() - d.lastSeen < 5 * 60 * 1000);
    res.json(devices);
});

// Get device config
app.get('/api/configs/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    let configs = JSON.parse(fs.readFileSync(configsPath));
    if (!configs[deviceId]) {
        configs[deviceId] = { email: "", kill: false, log: true };
        fs.writeFileSync(configsPath, JSON.stringify(configs));
    }
    res.json(configs[deviceId]);
});

// Update device config
app.post('/api/configs/:deviceId', (req, res) => {
    const deviceId = req.params.deviceId;
    const newConfig = req.body;
    let configs = JSON.parse(fs.readFileSync(configsPath));
    configs[deviceId] = newConfig;
    fs.writeFileSync(configsPath, JSON.stringify(configs));
    res.sendStatus(200);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
