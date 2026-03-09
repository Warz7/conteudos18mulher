export default async function handler(req, res) {
    const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

    try {
        const { tipo, valor } = req.body;
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: tipo,
                    description: valor,
                    color: 0xff2a5f
                }]
            })
        });
        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}