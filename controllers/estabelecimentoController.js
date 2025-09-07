const Estabelecimento = require('../models/Estabelecimento');

//registra novo estabelecimento
module.exports.adicionarListaEmpresas = async(req,res)=>{
    const estabelecimentos = req.body;

    if(!Array.isArray(estabelecimentos)){
        return res.status(400).json({msg:'Crie uma lista de empresas a serem salvas'});
    }    
    try {
        const resultados = [];
        for(const est of estabelecimentos){
            const {nome, tipo, endereco, telefone, site, cidade, estado, statusAtual} = est;
            
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
