const Prospec = require('../models/Prospec');
const Empresa = require('../models/Estabelecimento');
const mongoose = require('mongoose');

//registra nova prospecção
module.exports.adicionarProspeccao = async(req,res)=>{
    const {
        empresaId, 
        nomeEmpresa,
        usuarioId, 
        indicador,
        nicho, 
        observacao, 
        tempoGasto,         
        interesse, 
        retornoAgendado, 
        dataTime,
        telefone,
        site,
        funil} = req.body;    

    try {
        const novaProspec = new Prospec({
            empresaId, 
            nomeEmpresa,
            usuarioId, 
            indicador, 
            nicho,
            observacao, 
            tempoGasto,             
            interesse, 
            retornoAgendado, 
            dataTime,
            telefone,
            site,
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
        const listaProspec = await Prospec.find()
        .sort({criadoEm: -1})
        .exec();
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

//-----------Atualiza uma prospecção
module.exports.atualizarProspec = async(req, res)=>{
try {
  const { id } = req.params; // ID da prospecção a ser atualizada
    const {
      empresaId,
      indicador,
      observacao,
      interesse,
      retornoAgendado,
      dataTime,
      telefone,
      site,
      funil
    } = req.body;

    // Valida se o ID foi enviado
    if (!id) {
      return res.status(400).json({ erro: "ID da prospecção não fornecido" });
    }

    // Busca e atualiza o registro, retornando o novo documento
    const prospecAtualizada = await Prospec.findByIdAndUpdate(
      id,
      {
        empresaId,
        indicador,
        observacao,
        interesse,
        retornoAgendado,
        dataTime,
        telefone,
        site,
        funil,
        atualizadoEm: new Date()
      },
      { new: true, runValidators: true } // new:true retorna o documento atualizado, runValidators garante validações do schema
    );

    if (!prospecAtualizada) {
      return res.status(404).json({ erro: "Prospecção não encontrada" });
    }

    
    // Atualiza o status da empresa relacionada
    let empresaAtualizada = null;
    if (empresaId && indicador) {      
      empresaAtualizada = await Empresa.findByIdAndUpdate(
        empresaId,
        { statusAtual: indicador},
        { new: true }
      );
    }
   
     return res.status(200).json({
      prospecAtualizada,
      empresaAtualizada
    });
} catch (error) {
  console.error('Erro ao atualizar prospecção:', error);
  return res.status(500).json({ erro: "Erro ao atualizar prospecção" });
}
};