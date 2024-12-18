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
  console.log(`updateYomiEnergy called with newEnergy: ${newEnergy}`);
  const energy = Math.min(MAX_ENERGY, Math.max(MIN_ENERGY, Math.round(newEnergy)));
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ 
        current_energy: energy,
        last_energy_update: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error in updateYomiEnergy:', error);
      throw error;
    }
    
    console.log(`Successfully updated energy to: ${energy}`);
    return energy;
  } catch (error) {
    console.error('Error updating Yomi Energy:', error);
    throw error;
  }
}

export async function addReadingEnergy(userId: string, readingDurationSeconds: number) {
  console.log('=== Energy Update Flow ===');
  console.log(`1. Starting energy update for user ${userId}`);
  console.log(`2. Reading duration: ${readingDurationSeconds} seconds`);
  
  const energyGainIntervals = Math.floor(readingDurationSeconds / ENERGY_GAIN_INTERVAL);
  const energyGain = energyGainIntervals * ENERGY_GAIN_AMOUNT;
  console.log(`3. Calculated energy gain: ${energyGain}`);
  
  const currentEnergy = await getCurrentYomiEnergy(userId);
  console.log(`4. Current energy before update: ${currentEnergy}`);
  
  const newTotalEnergy = Math.min(currentEnergy + energyGain, MAX_ENERGY);
  console.log(`5. New total energy to be set: ${newTotalEnergy}`);
  
  const updatedEnergy = await updateYomiEnergy(userId, newTotalEnergy);
  console.log(`6. Final energy in database: ${updatedEnergy}`);
  console.log('=== Energy Update Complete ===');
  
  return energyGain;
}

export async function getCurrentYomiEnergy(userId: string): Promise<number> {
  try {
    console.log('Getting current energy for user:', userId);
    const { data, error } = await supabase
      .from('users')
      .select('current_energy, last_energy_update')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!data?.current_energy || !data?.last_energy_update) {
      console.log('No current energy data found, returning 0');
      return 0;
    }

    // Calculate energy decay
    const lastUpdate = new Date(data.last_energy_update);
    const now = new Date();
    const hoursPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));
    
    // Decrease energy by 1 point per hour
    let newEnergy = Math.max(MIN_ENERGY, data.current_energy - hoursPassed);

    // Update the energy in the database if it has changed
    if (newEnergy !== data.current_energy) {
      console.log(`Energy decayed from ${data.current_energy} to ${newEnergy}`);
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          current_energy: newEnergy,
          last_energy_update: now.toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;
    }

    console.log(`Returning current energy: ${newEnergy}`);
    return newEnergy;
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

export const getUserEnergy = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('current_energy')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    return data?.current_energy || 0;
  } catch (error) {
    console.error('Error fetching user energy:', error);
    return 0;
  }
};
