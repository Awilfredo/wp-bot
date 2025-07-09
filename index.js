const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const client = new Client({
    authStrategy: new LocalAuth(), // Guarda sesión automáticamente
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});



client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async message => {
    console.log(message);
    // if (message.body == 'hola') {
    //     client.sendMessage(message.from, '¡Hola!');
    // }
    const chat = await message.getChat();
    await chat.sendSeen();
    
    const urlTest = 'http://n8n-n8n-1:5678/webhook-test/ca2d1492-8e8a-486b-ac3b-d2e87a68bab0'
    const urlProd = 'http://n8n-n8n-1:5678/webhook/ca2d1492-8e8a-486b-ac3b-d2e87a68bab0'
    fetch(urlProd, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message
        })
    })
    .then(response => response.json())
    .then(async data => {
        console.log("data", data);
        if (data.length > 0) {

            // Mostrar estado "escribiendo..."
            await chat.sendStateTyping();
            // Esperar 3 segundos simulando que escribe
            let i = 0;
            setTimeout(async () => {
                await chat.clearState(); // quitar "escribiendo..."
                client.sendMessage(message.from, data[i].output);
                i++;
            }, 3000);
        }
    })
    .catch(error => console.error(error));

        

});


client.initialize();

const app = express();
app.use(express.json());
app.listen(3000, () => {
    console.log('Server running on port 3000');
});

app.post('/test', (req, res) => {
    console.log(req.body);
    const data = req.body;
    const mensajeFormateado = data.output.replace(/\\n/g, '\n');
    client.sendMessage(data.to, mensajeFormateado);
    res.send(data);
});