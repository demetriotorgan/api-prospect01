const express = require('express');
const { adicionarProspeccao, listarProspec, apagarListaProspec, ultimoRegistroPorNicho } = require('../controllers/prospectController');
const router = express.Router();

//rota para salvar prospec
router.post('/salvar-prospec', adicionarProspeccao);
router.get('/listar-prospec', listarProspec);
router.delete('/apagar-lista-prospec', apagarListaProspec);
router.get('/ultimo-registro/:nicho', ultimoRegistroPorNicho);

module.exports = router;