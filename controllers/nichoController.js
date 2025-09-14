const Nicho = require('../models/Nicho');

//registra nova nicho
module.exports.adicionarNicho = async(req,res)=>{
    const {tipo} = req.body;

    try {
        const nichoExistente = await Nicho.findOne({tipo});
        if(nichoExistente) return res.status(400).json({msg:'Nicho já existente'});
        
        const novoNicho = new Nicho({tipo});
        await novoNicho.save();
        res.status(201).json(novoNicho);
        
    } catch (error) {
        res.status(500).json({msg:'Erro ao cadastrar nicho'});
    }
};

//listar nichos
module.exports.listarNichos = async(req,res)=>{
 try {
    const nichos = await Nicho.find().exec();
    res.status(200).json(nichos);
 } catch (error) {
    res.status(500).json({mes:'Erro ao listar nichos'});
 }   
};

//deletar nicho
module.exports.deletarNicho = async(req,res)=>{
    try {
        const {id} = req.params;
        const nicho = await Nicho.findById(id);
        if(!nicho){
            return res.status(404).json({msg:'Nicho não encontrado'});
        }
        await Nicho.findByIdAndDelete(id);
        return res.status(200).json({msg:'Nicho deletado com sucesso'});
    } catch (error) {
        console.error('Erro ao deletar nicho', error);
        return res.status(500).json({erro:'Erro interno no servidor'});
    }
};  