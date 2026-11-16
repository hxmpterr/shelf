// Add a console with one line. core = EmulatorJS core, art = libretro-thumbnails repo, color/short = fallback cover.
const SYSTEMS = [
  { id: 'nes',  name: 'NES',                  short: 'NES',  color: '#b23a3a', exts: ['nes'],                core: 'nes',       art: 'Nintendo_-_Nintendo_Entertainment_System' },
  { id: 'snes', name: 'Super Nintendo',       short: 'SNES', color: '#7a6aa8', exts: ['smc', 'sfc', 'swc', 'fig'], core: 'snes', art: 'Nintendo_-_Super_Nintendo_Entertainment_System' },
  { id: 'n64',  name: 'Nintendo 64',          short: 'N64',  color: '#3f8f5a', exts: ['z64', 'n64', 'v64'],  core: 'n64',       art: 'Nintendo_-_Nintendo_64', note: 'Demanding. Runs best on a fast computer.' },
  { id: 'gb',   name: 'Game Boy',             short: 'GB',   color: '#8a9a5b', exts: ['gb'],                 core: 'gb',        art: 'Nintendo_-_Game_Boy' },
  { id: 'gbc',  name: 'Game Boy Color',       short: 'GBC',  color: '#4aa3a2', exts: ['gbc'],                core: 'gb',        art: 'Nintendo_-_Game_Boy_Color' },
  { id: 'gba',  name: 'Game Boy Advance',     short: 'GBA',  color: '#4a5fb0', exts: ['gba'],                core: 'gba',       art: 'Nintendo_-_Game_Boy_Advance' },
  { id: 'nds',  name: 'Nintendo DS',          short: 'NDS',  color: '#6a7f8f', exts: ['nds'],                core: 'nds',       art: 'Nintendo_-_Nintendo_DS' },
  { id: 'vb',   name: 'Virtual Boy',          short: 'VB',   color: '#a8323a', exts: ['vb'],                 core: 'vb',        art: 'Nintendo_-_Virtual_Boy' },
  { id: 'md',   name: 'Sega Genesis',         short: 'MD',   color: '#2f6fb5', exts: ['md', 'gen', 'smd'],   core: 'segaMD',    art: 'Sega_-_Mega_Drive_-_Genesis', note: 'A lone .bin under 16 MB is treated as a Genesis game.' },
  { id: 'sms',  name: 'Master System',        short: 'SMS',  color: '#b5532f', exts: ['sms'],                core: 'segaMS',    art: 'Sega_-_Master_System_-_Mark_III' },
  { id: 'gg',   name: 'Game Gear',            short: 'GG',   color: '#3d4350', exts: ['gg'],                 core: 'segaGG',    art: 'Sega_-_Game_Gear' },
  { id: '32x',  name: 'Sega 32X',             short: '32X',  color: '#7a2f8f', exts: ['32x'],                core: 'sega32x',   art: 'Sega_-_32X' },
  { id: 'pce',  name: 'PC Engine',            short: 'PCE',  color: '#d98b2b', exts: ['pce'],                core: 'pce',       art: 'NEC_-_PC_Engine_-_TurboGrafx_16' },
  { id: 'a26',  name: 'Atari 2600',           short: '2600', color: '#8a5a2b', exts: ['a26'],                core: 'atari2600', art: 'Atari_-_2600', note: 'A lone .bin under 64 KB is treated as an Atari 2600 game.' },
  { id: 'a78',  name: 'Atari 7800',           short: '7800', color: '#556b7a', exts: ['a78'],                core: 'atari7800', art: 'Atari_-_7800' },
  { id: 'lynx', name: 'Atari Lynx',           short: 'LYNX', color: '#c99a2b', exts: ['lnx'],                core: 'lynx',      art: 'Atari_-_Lynx' },
  { id: 'ngp',  name: 'Neo Geo Pocket',       short: 'NGP',  color: '#a89a2b', exts: ['ngp'],                core: 'ngp',       art: 'SNK_-_Neo_Geo_Pocket' },
  { id: 'ngc',  name: 'Neo Geo Pocket Color', short: 'NGPC', color: '#2ba39a', exts: ['ngc'],                core: 'ngp',       art: 'SNK_-_Neo_Geo_Pocket_Color' },
  { id: 'ws',   name: 'WonderSwan',           short: 'WS',   color: '#5aa0d9', exts: ['ws'],                 core: 'ws',        art: 'Bandai_-_WonderSwan' },
  { id: 'wsc',  name: 'WonderSwan Color',     short: 'WSC',  color: '#d95a8a', exts: ['wsc'],                core: 'ws',        art: 'Bandai_-_WonderSwan_Color' },
  { id: 'col',  name: 'ColecoVision',         short: 'COL',  color: '#2a6fa8', exts: ['col'],                core: 'coleco',    art: 'Coleco_-_ColecoVision' },
  { id: 'psx',  name: 'PlayStation',          short: 'PS1',  color: '#4a5a78', exts: ['iso', 'pbp', 'chd'],  core: 'psx',       art: 'Sony_-_PlayStation',
    note: 'Disc games come as a .cue and a .bin: select both together. Single .iso, .chd and .pbp work too.' }
];
const ARCHIVES = ['zip', '7z', 'rar'];
