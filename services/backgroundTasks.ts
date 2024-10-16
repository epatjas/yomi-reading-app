import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './readingSessionsHelpers';

const BACKGROUND_FETCH_TASK = 'background-fetch';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, energy, last_energy_update')
      .gt('energy', 0);

    if (error) throw error;

    const currentTime = new Date();
    const updates = data.map(user => {
      const lastUpdateTime = new Date(user.last_energy_update);
      const hoursPassed = (currentTime.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60);
      const newEnergy = Math.max(0, Math.round(user.energy - (5 * hoursPassed)));
      return { id: user.id, energy: newEnergy, last_energy_update: currentTime.toISOString() };
    });

    const { error: updateError } = await supabase
      .from('users')
      .upsert(updates);

    if (updateError) throw updateError;

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Background fetch failed:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60, // 1 hour
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log("Background fetch registered");
  } catch (err) {
    console.error("Background fetch failed to register:", err);
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log("Background fetch unregistered");
  } catch (err) {
    console.error("Background fetch failed to unregister:", err);
  }
}
