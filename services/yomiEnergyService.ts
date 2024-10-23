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

export async function getYomiEnergy(readingSessionId: string): Promise<number> {
  try {
    console.log('Fetching Yomi Energy for reading session:', readingSessionId);
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('energy_gained')
      .eq('id', readingSessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('No energy data found for this reading session');
        return 0;
      }
      throw error;
    }

    if (data && typeof data.energy_gained === 'number') {
      console.log('Energy gained:', data.energy_gained);
      return data.energy_gained;
    } else {
      console.log('Unexpected data structure:', data);
      return 0;
    }
  } catch (error) {
    console.error('Error fetching Yomi Energy:', error);
    return 0;
  }
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
  
  const currentEnergy = await getCurrentYomiEnergy(userId);
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

export async function getCurrentYomiEnergy(userId: string): Promise<number> {
  try {
    console.log('Fetching current Yomi Energy for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('current_energy')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    if (data && typeof data.current_energy === 'number') {
      console.log('Current Yomi Energy:', data.current_energy);
      return data.current_energy;
    } else {
      console.log('Unexpected data structure:', data);
      return 0;
    }
  } catch (error) {
    console.error('Error fetching current Yomi Energy:', error);
    return 0;
  }
}
