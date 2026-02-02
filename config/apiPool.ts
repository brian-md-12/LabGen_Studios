
/**
 * Admin API Infrastructure v5.0
 * Manages rotation, capability routing, and failover for LabGen Studio.
 */

export interface AdminKey {
  id: string;
  key: string;
  capabilities: ('text' | 'image' | 'video' | 'tts')[];
  status: 'active' | 'exhausted' | 'error';
  lastUsed: number;
  label: string;
}

// Internal pool of high-performance admin keys
// These are prioritized based on the required capability.
const ADMIN_POOL: AdminKey[] = [
  {
    id: 'primary-core',
    // Obtained from environment as per primary-core rules
    key: process.env.API_KEY || '',
    label: 'Primary Neural Core',
    capabilities: ['text', 'image', 'video', 'tts'],
    status: 'active',
    lastUsed: 0
  },
  {
    id: 'secondary-core',
    // STRICTLY HARDCODED BY RESEARCHER (KEVIN BRIAN)
    key: 'AIzaSyB1ZMKjSHhTB8Ly7VB1o4qavN6sG63rUwA',
    label: 'Secondary Neural Core',
    capabilities: ['text', 'image', 'video', 'tts'],
    status: 'active',
    lastUsed: 0
  },
  // Specialized sub-APIs for optimized quota management
  {
    id: 'imaging-sub-api',
    key: '', 
    label: 'Imaging Sub-API',
    capabilities: ['image'],
    status: 'active',
    lastUsed: 0
  },
  {
    id: 'motion-sub-api',
    key: '', 
    label: 'Motion Sub-API (Veo)',
    capabilities: ['video'],
    status: 'active',
    lastUsed: 0
  }
];

export const getAdminKeyForCapability = (capability: 'text' | 'image' | 'video' | 'tts'): AdminKey => {
  // 1. Filter for active keys that have the capability and a non-empty key
  let availableKeys = ADMIN_POOL.filter(k => k.status === 'active' && k.key && k.capabilities.includes(capability));
  
  // 2. If no specialized key found, fallback to any active core key (primary or secondary)
  if (availableKeys.length === 0) {
    availableKeys = ADMIN_POOL.filter(k => k.status === 'active' && k.key && k.capabilities.length === 4);
  }

  // 3. If everything is exhausted or empty, return the primary as a last resort
  if (availableKeys.length === 0) {
    return ADMIN_POOL[0];
  }

  // 4. Load Balancing: Pick the one that hasn't been used in the longest time
  const selected = availableKeys.sort((a, b) => a.lastUsed - b.lastUsed)[0];
  selected.lastUsed = Date.now();
  return selected;
};

export const markKeyAsExhausted = (key: string) => {
  const k = ADMIN_POOL.find(item => item.key === key);
  if (k) {
    k.status = 'exhausted';
    console.error(`API Key ${k.id} marked as EXHAUSTED.`);
  }
};

export const getPoolDiagnostics = () => {
  return ADMIN_POOL.map(k => ({
    label: k.label,
    status: k.status,
    capabilities: k.capabilities
  }));
};

export const resetPoolStatus = () => {
  ADMIN_POOL.forEach(k => k.status = 'active');
};
