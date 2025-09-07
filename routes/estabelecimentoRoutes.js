const express = require('express');
const { adicionarListaEmpresas, listarEmpresas } = require('../controllers/estabelecimentoController');
const router = express.Router();

//rota para salvar lista de empresa
router.post('/salvar-lista-empresas', adicionarListaEmpresas);
router .get('/listar-empresas', listarEmpresas);
module.exports = router;