const express = require('express');
const { adicionarNicho, listarNichos } = require('../controllers/nichoController');
const router = express.Router();

//rota para registrar novo nicho
router.post('/salvar-nicho', adicionarNicho);
router.get('/listar-nichos', listarNichos);

module.exports = router;