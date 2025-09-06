const express = require('express');
const { adicionarUsuario, logarUsuario, listarUsuarios } = require('../controllers/userController');
const router = express.Router();

//Rotas para registro de usuário
router.post('/registrar', adicionarUsuario);

//Rota para login de usuário
router.post('/login', logarUsuario);
router.get('/listar-usuarios', listarUsuarios);

module.exports = router;