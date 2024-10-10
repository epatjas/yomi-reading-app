/**
 * Supabase Connection Test
 * 
 * This script tests the connection to Supabase and attempts to perform
 * basic read and write operations. It's currently not in use due to
 * Row Level Security (RLS) policy restrictions.
 * 
 * TODO: Revisit this test when implementing user authentication and
 * setting up proper RLS policies.
 */

require('ts-node').register({
  project: 'tsconfig.json',
  transpileOnly: true,
})

const { testSupabaseConnection } = require('./supabase-test.ts')

console.log('Starting Supabase test...')

testSupabaseConnection()
  .then((result) => {
    if (result.success) {
      console.log('Test completed successfully:', result.message)
    } else {
      console.error('Test failed:', result.message)
    }
  })
  .catch(error => console.error('Test failed:', error))
  .finally(() => console.log('Script execution completed'))