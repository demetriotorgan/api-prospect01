const express = require('express');
const { adicionarUsuario, logarUsuario } = require('../controllers/userController');
const router = express.Router();

//Rotas para registro de usuário
router.post('/registrar', adicionarUsuario);

//Rota para login de usuário
router.post('/login', logarUsuario);

module.exports = router;