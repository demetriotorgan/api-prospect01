const express = require('express');
const { adicionarListaEmpresas } = require('../controllers/estabelecimentoController');
const router = express.Router();

//rota para salvar lista de empresa
router.post('/salvar-lista-empresas', adicionarListaEmpresas);

module.exports = router;