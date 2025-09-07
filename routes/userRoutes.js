const express = require('express');
const { adicionarUsuario, logarUsuario, listarUsuarios } = require('../controllers/userController');
const authMidleware = require('../midlleware/authMidleware');
const { usuarioLogado } = require('../controllers/meController');
const router = express.Router();

//Rotas para registro de usuário
router.post('/registrar', adicionarUsuario);

//Rota para login de usuário
router.post('/login', logarUsuario);
router.get('/listar-usuarios', listarUsuarios);

//Usario logado
router.get('/me', authMidleware, usuarioLogado);

module.exports = router;