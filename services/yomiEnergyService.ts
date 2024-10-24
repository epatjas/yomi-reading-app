import { supabase } from './readingSessionsHelpers';

export const INITIAL_ENERGY = 60;
export const MAX_ENERGY = 100;
const MIN_ENERGY = 0;
export const ENERGY_GAIN_AMOUNT = 5;
export const ENERGY_GAIN_INTERVAL = 15; // 15 seconds

export async function initializeYomiEnergy(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .update({ current_energy: INITIAL_ENERGY, last_energy_update: new Date().toISOString() })
    .eq('id', userId);

  if (error) throw error;
  return INITIAL_ENERGY;
}

export async function updateYomiEnergy(userId: string, newEnergy: number) {
  const energy = Math.min(MAX_ENERGY, Math.max(MIN_ENERGY, Math.round(newEnergy)));
  try {
    const { error } = await supabase
      .from('users')
      .update({ current_energy: energy, last_energy_update: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
    return energy;
  } catch (error) {
    console.error('Error updating Yomi Energy:', error);
    throw error;
  }
}

export async function addReadingEnergy(userId: string, readingDurationSeconds: number) {
  console.log(`addReadingEnergy called with readingDurationSeconds: ${readingDurationSeconds}`);
  
  const energyGainIntervals = Math.floor(readingDurationSeconds / ENERGY_GAIN_INTERVAL);
  const energyGain = energyGainIntervals * ENERGY_GAIN_AMOUNT;
  console.log(`Calculated energyGain: ${energyGain}`);
  
  const currentEnergy = await getCurrentYomiEnergy(userId);
  console.log(`Current energy before update: ${currentEnergy}`);
  
  const newEnergy = await updateYomiEnergy(userId, Math.min(currentEnergy + energyGain, MAX_ENERGY));
  console.log(`addReadingEnergy returning newEnergy: ${newEnergy}`);
  
  return newEnergy;
}

export async function getCurrentYomiEnergy(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('current_energy')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.current_energy || 0;
  } catch (error) {
    console.error('Error fetching current Yomi Energy:', error);
    return 0;
  }
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
