const express = require('express');
const { getAgenda, getAgendaProximos7Dias, salvarAgendamento, excluirListaAgendamento, excluirAgendamento, listarAgendamentosSalvos, encerrarAgendamento } = require('../controllers/agendaController');

const router = express.Router();

router.post('/salvar-agendamento', salvarAgendamento);
router.get('/listar-agendamentos-salvos', listarAgendamentosSalvos);
router.delete('/deletar-agendamentos', excluirListaAgendamento);
module.exports = router;