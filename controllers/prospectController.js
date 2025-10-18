const Prospec = require('../models/Prospec');
const Empresa = require('../models/Estabelecimento');
const Agendamento = require('../models/Agendamento');
const {toSaoPauloDate} = require('../util/calcularTempoRestante')
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
        funil        
      },
      { new: true, runValidators: true } // new:true retorna o documento atualizado, runValidators garante validações do schema
    );

    if (!prospecAtualizada) {
      return res.status(404).json({ erro: "Prospecção não encontrada" });
    }
    // 🟢 Busca empresa completa (com nome, telefone, site etc.)
    const empresa = await Empresa.findById(empresaId);
    
    if (!empresa) {
      return res.status(404).json({ erro: "Empresa não encontrada" });
    }

    // Atualiza apenas o status da empresa
    const empresaAtualizada = await Empresa.findByIdAndUpdate(
      empresaId,
      { statusAtual: indicador },
      { new: true }
    );

    // 3️⃣ Lógica de agendamento
    let agendamentoAtualizado = null;
    if (retornoAgendado  && dataTime) {
      // ➕ Cria ou atualiza agendamento existente da empresa
      agendamentoAtualizado = await Agendamento.findOneAndUpdate(
        { empresaId }, // busca pelo id da empresa
        {
          empresaId,
          nomeEmpresa: empresa.nome,
          usuarioId: prospecAtualizada.usuarioId,
          indicador,
          nicho: empresa.tipo,
          observacao,
          tempoGasto: prospecAtualizada.tempoGasto || 0,
          interesse,
          retornoAgendado,
          dataTime,
          telefone: empresa.telefone,
          site: empresa.site,
          funil,
          resultado: "",
          texto: observacao || "",
        },
        { new: true, upsert: true, runValidators: true } // cria se não existir
      );
    } else {
      // ❌ Se não há agendamento definido, remove o existente (se houver)
      const agendamentoExistente = await Agendamento.findOne({ empresaId });
      if (agendamentoExistente) {
        await Agendamento.deleteOne({ empresaId });
      }
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