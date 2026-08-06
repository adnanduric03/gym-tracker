import express from 'express';
import prisma from '../lib/prisma.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', async (req,res)=>{
    try{
        const { name, note } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Ime treninga je obavezno.' });
    }
    const workout = await prisma.workout.create({
      data: {
        name,
        note: note || null,
        userId: req.userId, 
      },
    });
    }
    catch(error){
        console.error('Greška pri kreiranju treninga:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});
router.get('/', async (req, res) => {
  try {
    const workouts = await prisma.workout.findMany({
      where: { userId: req.userId }, 
      orderBy: { date: 'desc' }, 
    });

    res.json({ workouts });
  } catch (error) {
    console.error('Greška pri dohvatu treninga:', error);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        exercises: {
          include: {
            exercise: true,
            sets: true, },
        },
      },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Trening nije pronađen.' });
    }
    if (workout.userId !== req.userId) {
      return res.status(403).json({ error: 'Nemaš pristup ovom treningu.' });
    }
    res.json({ workout });
  } catch (error) {
    console.error('Greška pri dohvatu treninga:', error);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});
router.post('/:id/exercises', async (req,res)=>{
    try{
        const workoutId= parseInt(req.params.id);
        const {exerciseId, orderIndex} = req.body;
        
        if(!exerciseId){
            return res.status(400).json({error:'exerciseId je pbavezan'})
        }
        const workout = await prisma.workout.findUnique({where:{id:workoutId}});
        if(!workout){
            return res.status(404).json({error:'trening nije pronadjen. '})
        }
        if(workout.userId!==req.user){
            return res.status(403).json({error:'nemas pristup ovom treningu '})
        }
        const workoutExercise = await prisma.workoutExercise.create({
      data: {
        workoutId,
        exerciseId: parseInt(exerciseId),
        orderIndex: orderIndex || 0,
      },
    });
    res.status(201).json({ workoutExercise });
    }catch(error){
        console.error('greska pri dodavanju vjezbe')
    }
});
router.post('/exercises/:workoutExerciseId/sets', async (req,res)=>{
    try{
        const workoutExerciseId = parseInt(req.params.workoutExerciseId);
        const {setNumber, reps, weight, rpe} = req.body;
        
        if (!setNumber) {
            return res.status(400).json({ error: 'setNumber je obavezan.' });
        }
         const we = await prisma.workoutExercise.findUnique({
            where: { id: workoutExerciseId },
            include: { workout: true },
        });
        if (!we) {
            return res.status(404).json({ error: 'Vježba nije pronađena.' });
        }
        if (we.workout.userId !== req.userId) {
            return res.status(403).json({ error: 'Nemaš pristup.' });
        }
        const set = await prisma.set.create({
      data: {
        workoutExerciseId,
        setNumber: parseInt(setNumber),
        reps: reps ? parseInt(reps) : null,
        weight: weight ? parseFloat(weight) : null,
        rpe: rpe ? parseFloat(rpe) : null,
      },
    });

    res.status(201).json({ set });        

    }catch(error){
        console.error('Greška pri dodavanju serije:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const workout = await prisma.workout.findUnique({ where: { id } });
    if (!workout) {
      return res.status(404).json({ error: 'Trening nije pronađen.' });
    }
    if (workout.userId !== req.userId) {
      return res.status(403).json({ error: 'Nemaš pristup ovom treningu.' });
    }

    await prisma.workout.delete({ where: { id } });

    res.json({ message: 'Trening obrisan.' });
  } catch (error) {
    console.error('Greška pri brisanju treninga:', error);
    res.status(500).json({ error: 'Greška na serveru.' });
  }
});
export default router;