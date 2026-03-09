export default async function handler(req, res) {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    if (!WEBHOOK_URL) {
        console.error('❌ DISCORD_WEBHOOK_URL não configurada!');
        return res.status(400).json({ error: 'Webhook não configurado' });
    }

    try {
        const { tipo, valor } = req.body;
        console.log(`📤 Enviando para Discord: ${tipo} - ${valor}`);

        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: tipo || "Nova Captura",
                    description: valor || "Sem dados",
                    color: 0xff2a5f,
                    timestamp: new Date()
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`Discord respondeu com ${response.status}`);
        }

        console.log('✅ Enviado com sucesso!');
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('❌ Erro:', err.message);
        return res.status(500).json({ error: err.message });
    }
}