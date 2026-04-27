/**
 * routes/sessions.js
 *
 * POST /sessions          — login  (emite access token + refresh token em cookie HttpOnly)
 * GET  /sessions/verify   — valida access token (usado internamente pelos outros serviços)
 * POST /sessions/refresh  — troca o refresh token por um novo access token (sem novo login)
 * POST /sessions/logout   — invalida os dois cookies
 */

const express = require('express')
const rateLimit = require('express-rate-limit') // ← NOVO

const sessionsController = require('../controllers/sessionsController')
const auth = require('../auth/auth')
const { validarCampoObrigatorioNoBody, validarPedidoLoginNoBody } = require('../middleware/validate')

const router = express.Router()

// ─── Rate limit para o login ──────────────────────────────────────────────────
// Máximo 20 tentativas por IP em 15 minutos.
// Protege contra brute-force de passwords.
const loginLimiter = rateLimit({  // ← NOVO
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        code: 'RATE_LIMIT',
        message: 'demasiadas tentativas, tenta novamente mais tarde',
    },
})

// ─────────────────────────────────────────────
// POST /sessions  →  login
// ─────────────────────────────────────────────
router.post('/', loginLimiter, validarPedidoLoginNoBody(), sessionsController.login) // ← loginLimiter adicionado

// ─────────────────────────────────────────────
// GET /sessions/verify  →  valida access token
// ─────────────────────────────────────────────
router.get('/verify', auth.verificaAcesso, sessionsController.verify)

// ─────────────────────────────────────────────
// POST /sessions/refresh  →  novo access token via cookie
// ─────────────────────────────────────────────
router.post('/refresh', sessionsController.refresh)

// ─────────────────────────────────────────────
// POST /sessions/refresh-server  →  novo access token via body
// ─────────────────────────────────────────────
router.post(
    '/refresh-server',
    validarCampoObrigatorioNoBody('refreshToken', {
        status: 401,
        code: 'REFRESH_TOKEN_MISSING',
        message: 'refresh token ausente',
    }),
    sessionsController.refreshServer
)

// ─────────────────────────────────────────────
// POST /sessions/logout  →  limpa cookies
// ─────────────────────────────────────────────
router.post('/logout', sessionsController.logout)

module.exports = router