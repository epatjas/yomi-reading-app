import { supabase } from './readingSessionsHelpers';

const INITIAL_ENERGY = 60;
const MAX_ENERGY = 100;
const MIN_ENERGY = 0;
const ENERGY_DECAY_PER_HOUR = 5;
const ENERGY_GAIN_PER_10_SECONDS = 10;
const STORY_COMPLETION_BONUS = 50;

export async function initializeYomiEnergy(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ energy: INITIAL_ENERGY, last_energy_update: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return INITIAL_ENERGY;
}

export async function getYomiEnergy(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('current_energy, max_energy, last_energy_update')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching Yomi energy:', error);
    return 0;
  }

  if (!data) return 0;

  // Implement energy decay logic here if needed
  // For now, just return the current_energy
  return data.current_energy;
}

export async function updateYomiEnergy(userId: string, newEnergy: number) {
  const energy = Math.min(100, Math.max(0, newEnergy)); // Ensure energy is between 0 and 100
  const { data, error } = await supabase
    .from('users')
    .update({ current_energy: energy, last_energy_update: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return energy;
}

export async function addReadingEnergy(userId: string, readingDurationSeconds: number) {
  const energyGain = Math.floor(readingDurationSeconds / 10) * ENERGY_GAIN_PER_10_SECONDS;
  const currentEnergy = await getYomiEnergy(userId);
  return updateYomiEnergy(userId, currentEnergy + energyGain);
}

export async function addStoryCompletionBonus(userId: string) {
  const currentEnergy = await getYomiEnergy(userId);
  return updateYomiEnergy(userId, currentEnergy + STORY_COMPLETION_BONUS);
}
