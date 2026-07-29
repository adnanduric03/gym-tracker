import 'dotenv/config';
import prisma from '../lib/prisma.js';

const BASE_URL = 'https://wger.de/api/v2/exerciseinfo/';
const ENGLISH = 2; 

async function fetchExercises() {
  let url = `${BASE_URL}?limit=100&format=json`;
  const all = [];

  while (url) {
    console.log('Dohvatam:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`wger greška: ${res.status}`);
    const data = await res.json();
    all.push(...data.results);
    url = data.next; 
  }
 return all;
}
function extractExercise(item) {
  const english = item.translations?.find((t) => t.language === ENGLISH);
  if (!english || !english.name) return null; 

  const muscles = (item.muscles || []).map((m) => m.name_en || m.name).join(', ');

  const equipment = (item.equipment || []).map((e) => e.name).join(', ');

  const image = item.images?.[0]?.image || null;

  const instructions = english.description
    ? english.description.replace(/<[^>]*>/g, '').trim()
    : null;

  return {
    externalId: String(item.id),
    name: english.name,
    muscleGroup: muscles || null,
    equipment: equipment || null,
    instructions: instructions || null,
    gifUrl: image,
  };
}

async function main() {
  console.log('Počinjem dohvat vježbi iz wger-a...');
  const raw = await fetchExercises();
  console.log(`Dohvaćeno ${raw.length} vježbi. Obrađujem...`);

  let ubaceno = 0;
  let preskoceno = 0;

  for (const item of raw) {
    const exercise = extractExercise(item);
    if (!exercise) {
      preskoceno++;
      continue;
    }

    // upsert = ubaci ako ne postoji, ažuriraj ako postoji (po externalId)
    await prisma.exercise.upsert({
      where: { externalId: exercise.externalId },
      update: exercise,
      create: exercise,
    });
    ubaceno++;
  }

  console.log(`Gotovo! Ubačeno/ažurirano: ${ubaceno}, preskočeno (bez engleskog imena): ${preskoceno}`);
}

main()
  .catch((e) => {
    console.error('Greška:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
