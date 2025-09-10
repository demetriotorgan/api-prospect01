const Prospec = require('../models/Prospec');

//registra nova prospecção
module.exports.adicionarProspeccao = async(req,res)=>{
    const {empresaId, usuarioId, indicador, observacao, tempoGasto, criadoEm, atualizadoEm, interesse, retornoAgendado, funil} = req.body;

    try {
        const novaProspec = new Prospec({empresaId, usuarioId, indicador, observacao, tempoGasto, criadoEm, atualizadoEm, interesse, retornoAgendado, funil});
        await novaProspec.save();
        res.status(201).json({msg:'Prospecção cadastrada com sucesso'});
    } catch (error) {
        res.status(500).json({msg:'Erro ao cadastrar prospecção'});
    };
};