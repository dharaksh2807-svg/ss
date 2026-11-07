import assert from 'node:assert';
import { EnvironmentalEncounterDirector } from '../src/environment/EnvironmentalEncounterDirector';
import { EnvironmentDirector } from '../src/environment/EnvironmentDirector';

console.log('🧪 Starting Atmosphere Preset & Precedence Verification Suite...\n');

const director = EnvironmentalEncounterDirector.getInstance();

// 1. Chrono Kingdom
const chronoNormal = director.resolveAtmospherePreset(100, 'CHRONO_KINGDOM');
console.log('Chrono Kingdom at 100m:', chronoNormal);
assert.strictEqual(chronoNormal, 'CHRONO_CELESTIAL_CLOCKWORK', 'Chrono Kingdom must resolve to celestial clockwork');

const chronoWeather = director.resolveAtmospherePreset(1500, 'CHRONO_KINGDOM'); // 1500 > 1400 and 1500 % 1200 = 300 (not > 800)
const chronoRain = director.resolveAtmospherePreset(2100, 'CHRONO_KINGDOM'); // 2100 > 1400 and 2100 % 1200 = 900 (> 800)
console.log('Chrono Kingdom at 2100m (weather window):', chronoRain);
assert.strictEqual(chronoRain, 'CHRONO_STEAM_RAIN', 'Chrono Kingdom must resolve to steam rain during weather pacing');

// 2. Midnight Velvet
const velvetNormal = director.resolveAtmospherePreset(100, 'MIDNIGHT_VELVET');
console.log('Midnight Velvet at 100m:', velvetNormal);
assert.strictEqual(velvetNormal, 'MIDNIGHT_VELVET_AFTERDARK', 'Midnight Velvet must resolve to afterdark');

const velvetRain = director.resolveAtmospherePreset(2100, 'MIDNIGHT_VELVET');
console.log('Midnight Velvet at 2100m (weather window):', velvetRain);
assert.strictEqual(velvetRain, 'MIDNIGHT_VELVET_RAIN', 'Midnight Velvet must resolve to luxury rain during weather pacing');

// 3. Other Premium Worlds
assert.strictEqual(director.resolveAtmospherePreset(100, 'VIP_EXPRESS'), 'VIP_CEREMONIAL_SUNSET');
assert.strictEqual(director.resolveAtmospherePreset(100, 'RAHULVERSE'), 'RAHULVERSE_MORNING_YATRA');
assert.strictEqual(director.resolveAtmospherePreset(100, 'INFERNO_EXPRESS'), 'INFERNO_VOLCANIC_MAGMA');
assert.strictEqual(director.resolveAtmospherePreset(100, 'JURASSIC_RUSH'), 'JURASSIC_PRIMORDIAL_DAWN');
assert.strictEqual(director.resolveAtmospherePreset(100, 'VIVA_HEAT'), 'VIVA_HEAT_SUNSET_FEVER');

// 4. Modern & Historic Base Worlds
assert.strictEqual(director.resolveAtmospherePreset(100, 'MODERN_METRO'), 'CLEAR_DAYLIGHT');
assert.strictEqual(director.resolveAtmospherePreset(2100, 'MODERN_METRO'), 'LIGHT_RAIN');
assert.strictEqual(director.resolveAtmospherePreset(100, 'HISTORIC_QUARTER'), 'WARM_GOLDEN_HOUR');

console.log('\n🏆 ALL ATMOSPHERE PRESET PRECEDENCE TESTS PASSED!');
