import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async(req,res)=>{
    try{
        const {email, password, name}= req.body;
        if(!email||!password||!name){
            return res.status(400).json({error: "email, lozinka i ime su obavezni"})
        }
        const existing = await prisma.user.findUnique({where: {email}});
        if(existing){
            return res.status(409).json({error:"Korisnik s tim emailom vec postoji "});
        } 
        const passwordHash = await bcrypt.hash(password,10);

        const user = await prisma.user.create({
            data: {email, passwordHash, name}
        })
        const token = jwt.sign({userId:user.id}, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        res.status(201).json({
            token, user:{id: user.id, email: user.email, name: user.name},
        });
    }catch(error){
        console.error('Greška pri registraciji:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }});

    router.post('/login', async(req,res)=>{
        try{
            const {email, password, name} = req.body;
            if(!email||!password){
                return res.status(400).json({error:'Email i lozinka su obaevzni '});
            }
            const user = await prisma.user.findUnique({where:{email}})
            if(!user){
                return res.status(401).json({error:'pogresan email ili lozinka'});
            }
            const valid = await bcrypt.compare(password, user.passwordHash);
            if(!valid){
                return res.json(401).json({error:'Pogresna lozinka'})
            }
            
            const token = jwt.sign({userId:user.id}, process.env.JWT_SECRET,{ expiresIn: '7d' } )

            res.json({
                token, user:{id:user.id, email:user.email, name: user.name},
            });
        }catch(error){
            console.error('Greška pri loginu:', error);
            res.status(500).json({ error: 'Greška na serveru.' });
        }
    });
    router.get('/me', authMiddleware, async (req,res)=>{
        try{
            const user = await prisma.user.findUnique({
                where:{id: req.userId},
                select: { id: true, email: true, name: true, goal: true, createdAt: true },
            });
            if (!user) {
            return res.status(404).json({ error: 'Korisnik nije pronađen.' });
            }
            res.json({ user });
        }catch(error){
            console.error('Greška pri dohvatu korisnika:', error);
            res.status(500).json({ error: 'Greška na serveru.' });
        }
    });
export default router;