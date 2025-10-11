const express = require('express');
const {salvarAgendamento, excluirListaAgendamento, listarAgendamentosSalvos, encerrarAgendamento } = require('../controllers/agendaController');

const router = express.Router();

router.post('/salvar-agendamento', salvarAgendamento);
router.get('/listar-agendamentos-salvos', listarAgendamentosSalvos);
router.delete('/deletar-agendamentos', excluirListaAgendamento);
router.put('/encerrar-agendamento/:id', encerrarAgendamento);
module.exports = router;