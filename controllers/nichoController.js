const Nicho = require('../models/Nicho');

//registra nova nicho
module.exports.adicionarNicho = async(req,res)=>{
    const {tipo} = req.body;

    try {
        const nicho = new Nicho({tipo});
        await nicho.save();
        res.status(201).json({msg:'Nicho cadastrado com sucesso'});
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