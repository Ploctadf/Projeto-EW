const express = require('express')

const { serviceProxy } = require('../lib/proxy')
const { config } = require('../lib/config')

const router = express.Router()

// ─── Bloqueio de rotas internas ───────────────────────────────────────────────
// POST /api/news/system é um endpoint interno (auth → api).
// Nenhum cliente externo deve conseguir chamá-lo através do gateway.
router.all('/news/system', (req, res) => {  // ← NOVO
    res.status(403).json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'rota interna não acessível pelo gateway',
    })
})

// ─── Proxy para o serviço API ─────────────────────────────────────────────────
router.use(
    '/',
    serviceProxy(config.services.apiUrl, {
        pathRewrite: (path) => `/api${path}`,
    })
)

module.exports = router