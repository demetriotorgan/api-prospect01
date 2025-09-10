const Prospec = require('../models/Prospec');
const Empresa = require('../models/Estabelecimento');

//registra nova prospecção
module.exports.adicionarProspeccao = async(req,res)=>{
    const {
        empresaId, 
        usuarioId, 
        indicador, 
        observacao, 
        tempoGasto, 
        criadoEm, 
        atualizadoEm, 
        interesse, 
        retornoAgendado, 
        funil} = req.body;

    try {
        const novaProspec = new Prospec({
            empresaId, 
            usuarioId, 
            indicador, 
            observacao, 
            tempoGasto, 
            criadoEm, 
            atualizadoEm, 
            interesse, 
            retornoAgendado, 
            funil
        });
        await novaProspec.save();
    
        // 2) Atualizar o statusAtual da empresa correspondente
    const empresaAtualizada = await Empresa.findByIdAndUpdate(
    empresaId,
      { statusAtual: indicador },
      { new: true } // retorna a versão atualizada
    );

    if (!empresaAtualizada) {
      return res.status(404).json({ msg: 'Empresa não encontrada para atualizar' });
    }
        res.status(201).json({
            msg:'Prospecção cadastrada com sucesso',
            prospec: novaProspec,
            empresa: empresaAtualizada
        });

    } catch (error) {
        res.status(500).json({msg:'Erro ao cadastrar prospecção'});
    };
};