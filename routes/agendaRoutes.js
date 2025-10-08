const express = require('express');
const { getAgenda, getAgendaProximos7Dias, salvarAgendamento, excluirListaAgendamento, excluirAgendamento, listarAgendamentosSalvos, encerrarAgendamento } = require('../controllers/agendaController');

const router = express.Router();

router.get('/agenda', getAgenda);
router.get('/agenda/proximos-7-dias', getAgendaProximos7Dias);
router.post('/salvar-agendamento', salvarAgendamento);
router.get('/listar-agendamentos-salvos', listarAgendamentosSalvos);
router.delete('/deletar-agendamentos', excluirListaAgendamento);
router.delete('/excluir-agendamento/:empresaId', excluirAgendamento);
module.exports = router;