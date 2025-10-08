const express = require('express');
const { adicionarListaEmpresas, listarEmpresas, apagarListaEmpresas, verificarEmpresas, exibirEmpresaPorId } = require('../controllers/estabelecimentoController');
const router = express.Router();

//rota para salvar lista de empresa
router.post('/salvar-lista-empresas', adicionarListaEmpresas);
router .get('/listar-empresas', listarEmpresas);
router.delete('/apagar-lista-empresas', apagarListaEmpresas);
router.post('/verificar-empresas', verificarEmpresas);
router.get('/exibir-empresa/:empresaId', exibirEmpresaPorId);
module.exports = router;