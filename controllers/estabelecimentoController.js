const Estabelecimento = require('../models/Estabelecimento');
const mongoose = require("mongoose");

//registra novo estabelecimento
module.exports.adicionarListaEmpresas = async(req,res)=>{
    const estabelecimentos = req.body;

    if(!Array.isArray(estabelecimentos)){
        return res.status(400).json({msg:'Crie uma lista de empresas a serem salvas'});
    }    
    try {
        const resultados = [];
        for(const est of estabelecimentos){
            const {nome, tipo, endereco, telefone, site, cidade, bairro, estado, statusAtual} = est;
            
            const estabelecimentoExiste = await Estabelecimento.findOne({nome});

            if(estabelecimentoExiste){
                resultados.push({nome, status:'Já esta cadastrada'});
            }else{
                const novoEstabelecimento = new Estabelecimento({
                    nome, 
                    tipo, 
                    endereco, 
                    telefone, 
                    site, 
                    cidade, 
                    bairro,
                    estado, 
                    statusAtual
                });
                await novoEstabelecimento.save();
                resultados.push({nome, status:'Cadastrado com sucesso'});
            }
        }
        res.status(201).json({msg:'Processamento concluído', resultados});
    } catch (error) {
        console.error(error);
        res.status(500).json({msg:'Erro ao cadastrar'});
    }
};

module.exports.listarEmpresas = async(req,res)=>{
    try {
        const empresas = await Estabelecimento.find().exec();
        res.status(200).json(empresas);
    } catch (err) {
        res.status(200).json({msg:'Erro ao exibir empresas salvas'});
    }
};

module.exports.apagarListaEmpresas = async(req,res)=>{
    try {
        await Estabelecimento.deleteMany({});
        res.status(200).json({msg:'Lista de empresas salvas deletada com sucesso'});
    } catch (err) {
        res.status(500).json({msg:'Erro ao apagar lista de empresas'});
    }
};

module.exports.verificarEmpresas = async(req,res)=>{
    try {
        const {telefones} = req.body;
        if(!Array.isArray(telefones)){
            return res.status(400).json({erro:'Lista de telefones inválida'});
        }

        const empresasExistentes = await Estabelecimento.find({
            telefone:{$in: telefones},
        }).select("nome telefone");

        res.json({
            existentes: empresasExistentes.map((e)=>({
                nome: e.nome,
                telefone: e.telefone,
            })),
        });
    } catch (err) {
        res.status(500).json({erro:'Erro ao verificar empresas'});
    }
};

module.exports.exibirEmpresaPorId = async (req, res) => {
  try {
    const { empresaId } = req.params;

    // 🔹 Verifica se o parâmetro foi enviado
    if (!empresaId) {
      return res.status(400).json({ msg: "Parâmetro empresaId é obrigatório" });
    }

    // 🔹 Verifica se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(empresaId)) {
      return res.status(400).json({ msg: "Formato de empresaId inválido" });
    }

    // 🔹 Busca o estabelecimento cujo _id corresponde ao empresaId do Agendamento
    const estabelecimento = await Estabelecimento.findById(empresaId);

    if (!estabelecimento) {
      return res.status(404).json({ msg: "Nenhum estabelecimento encontrado para o empresaId fornecido." });
    }

    // 🔹 Retorna o documento encontrado
    return res.status(200).json(estabelecimento);

  } catch (error) {
    console.error("❌ Erro ao buscar registro de estabelecimento:", error);
    return res.status(500).json({ msg: "Erro interno ao buscar registro de estabelecimento." });
  }
};
