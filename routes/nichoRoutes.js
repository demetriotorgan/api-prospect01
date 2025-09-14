const express = require('express');
const { adicionarNicho, listarNichos, deletarNicho } = require('../controllers/nichoController');
const router = express.Router();

//rota para registrar novo nicho
router.post('/salvar-nicho', adicionarNicho);
router.get('/listar-nichos', listarNichos);

//deletar nicho
router.delete('/deletar-nicho/:id', deletarNicho);

module.exports = router;