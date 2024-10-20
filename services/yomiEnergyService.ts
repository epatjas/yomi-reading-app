import { supabase } from './readingSessionsHelpers';

export const INITIAL_ENERGY = 60;
const MAX_ENERGY = 100;
const MIN_ENERGY = 0;
const ENERGY_DECAY_PER_HOUR = 1;
export const ENERGY_GAIN_PER_10_SECONDS = 5;

export async function initializeYomiEnergy(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ current_energy: INITIAL_ENERGY, last_energy_update: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return INITIAL_ENERGY;
}

export async function getYomiEnergy(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('current_energy, last_energy_update')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching Yomi energy:', error);
    return 0;
  }

  if (!data) return 0;

  // Calculate energy decay
  const lastUpdate = new Date(data.last_energy_update);
  const now = new Date();
  const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  const energyDecay = Math.floor(hoursPassed * ENERGY_DECAY_PER_HOUR);

  let newEnergy = Math.max(MIN_ENERGY, Math.round(data.current_energy - energyDecay));

  // Update the energy if it has changed
  if (newEnergy !== data.current_energy) {
    await updateYomiEnergy(userId, newEnergy);
  }

  return newEnergy;
}

export async function updateYomiEnergy(userId: string, newEnergy: number) {
  console.log(`updateYomiEnergy called with newEnergy: ${newEnergy}`);
  const energy = Math.min(MAX_ENERGY, Math.max(MIN_ENERGY, Math.round(newEnergy)));
  console.log(`Energy after min/max check: ${energy}`);
  const { data, error } = await supabase
    .from('users')
    .update({ current_energy: energy, last_energy_update: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error in updateYomiEnergy:', error);
    throw error;
  }
  console.log(`updateYomiEnergy returning: ${energy}`);
  return energy;
}

export async function addReadingEnergy(userId: string, readingDurationSeconds: number) {
  console.log(`addReadingEnergy called with readingDurationSeconds: ${readingDurationSeconds}`);
  
  const energyGain = Math.floor(readingDurationSeconds / 10) * ENERGY_GAIN_PER_10_SECONDS;
  console.log(`Calculated energyGain: ${energyGain}`);
  
  const currentEnergy = await getYomiEnergy(userId);
  console.log(`Current energy before update: ${currentEnergy}`);
  
  const newEnergy = await updateYomiEnergy(userId, currentEnergy + energyGain);
  console.log(`addReadingEnergy returning newEnergy: ${newEnergy}`);
  
  return newEnergy;
}

export async function updateUserEnergy(userId: string, newEnergy: number) {
  console.log(`Updating user energy. User ID: ${userId}, New Energy: ${newEnergy}`);
  const energy = Math.min(MAX_ENERGY, Math.max(MIN_ENERGY, Math.round(newEnergy)));
  const { data, error } = await supabase
    .from('users')
    .update({ current_energy: energy, last_energy_update: new Date().toISOString() })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error in updateUserEnergy:', error);
    throw error;
  }
  if (data && data.length > 0) {
    console.log(`Energy updated successfully. New energy: ${data[0].current_energy}`);
    return data[0].current_energy;
  } else {
    console.error('No data returned from energy update');
    throw new Error('Failed to update energy');
  }
}
