const Prospec = require('../models/Prospec');
const Empresa = require('../models/Estabelecimento');

//registra nova prospecção
module.exports.adicionarProspeccao = async(req,res)=>{
    const {
        empresaId, 
        usuarioId, 
        indicador,
        nicho, 
        observacao, 
        tempoGasto,         
        interesse, 
        retornoAgendado, 
        dataTime,
        funil} = req.body;    

    try {
        const novaProspec = new Prospec({
            empresaId, 
            usuarioId, 
            indicador, 
            nicho,
            observacao, 
            tempoGasto,             
            interesse, 
            retornoAgendado, 
            dataTime,
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

module.exports.apagarListaProspec = async(req,res)=>{
  try {
    const resultado = await Prospec.deleteMany({});
    res.status(200).json({msg:'Prospecções excluidas com sucesso'});
  } catch (error) {
    res.status(500).json({msg:'Erro ao excluir registros'});
  }
};

module.exports.listarProspec = async(req,res)=>{
    try {
        const listaProspec = await Prospec.find().exec();
        res.status(200).json(listaProspec);
    } catch (error) {
        res.status(500).json({msg:'Erro ao buscar lista de empresas prospecctadas'});
    }
};

//----Exibi o ultimo registro de um nicho----
module.exports.ultimoRegistroPorNicho = async(req, res)=>{
  try {
    const nicho = req.params.nicho;
    const ultimoRegistro = await Prospec.findOne({ nicho })
      .sort({ criadoEm: -1 })
      .select('criadoEm');

       if (!ultimoRegistro) {
      return res.status(404).json({ msg: 'Nenhum registro encontrado para esse nicho' });
    }

    res.status(200).json({ ultimoRegistro: ultimoRegistro.criadoEm });
  } catch (error) {
    res.status(500).json({ msg: 'Erro ao buscar último registro', erro: error.message });
  }
};