const User = require('../models/User')

module.exports.usuarioLogado = async(req,res)=>{
    try {
        const user = await User.findById(req.userId).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({error:'Erro ao buscar usuário'});
    }
};