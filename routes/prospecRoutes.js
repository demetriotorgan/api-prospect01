const express = require('express');
const { adicionarProspeccao } = require('../controllers/prospectController');
const router = express.Router();

//rota para salvar prospec
router.post('/salvar-prospec', adicionarProspeccao);

module.exports = router;