import express from 'express';
import prisma from '../lib/prisma.js';

const router = express.Router();

router.get('/' , async(req,res)=>{
    try{
        const {search , muscle} = req.query;

        const where ={};
        if(search){
            where.name = {contains : search , mode: 'insensitive'}
        }
        if(muscle){
            where.muscleGroup = {contains : muscle , mode: 'insensitive'}
        }
        const exercise = await prisma.exercise.findMany(
            {where, take:50, orderBy :{name:'asc' },
        });
        res.json({exercise})
    }catch(error){
        console.error('greska pri dohvatanju vjezbi', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});
export default router;