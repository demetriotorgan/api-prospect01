const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//Registra novo usuário
module.exports.adicionarUsuario = async(req,res)=>{
    const {email, password} = req.body;

    try {
        const userExist = await User.findOne({email});
        if(userExist) return res.status(400).json({msg:'Usuário já cadastrado'});

        const user = new User({email, password});
        await user.save();
        res.status(201).json({msg:'Usuário cadastrado com sucesso'});
    } catch (error) {
        res.status(500).json({msg:'Erro ao cadastrar usuário'});
    }
};

//Rota de login
module.exports.logarUsuario = async(req,res)=>{
    const {email, password} = req.body;

    try {
        const user = await User.findOne({email});
        if(!user) return res.status(400).json({msg:'Usário não encontrado'});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({msg:'Senha inválida'});

        const token = jwt.sign({
            userId:user._id,
            email:user.email,
        },
        process.env.JWT_SECRET,{
            expiresIn: '1h'
        });
        res.json({token});
    } catch (error) {
        res.status(500).json({msg:'Erro no servidor'});
    }
};

module.exports.listarUsuarios = async(req,res)=>{
try {
    const usuarios = await User.find().exec();
    res.status(200).json(usuarios);
} catch (error) {
    res.status(500).json({msg:'Erro ao listar usuários'});
}
};