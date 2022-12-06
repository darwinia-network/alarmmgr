export enum Bridge {
  DarwiniaCrab = 'darwinia-crab',
  CrabCrabParachain = 'crab-crabparachain',
  PangolinPangoro = 'pangolin-pangoro',
  PangolinPangolinParachain = 'pangolin-pangolinparachain',
  PangolinPangolinParachainAlpha = 'pangolin-pangolinparachainalpha',
}


export namespace Bridge {
  export function of(bridge: string): Bridge | undefined {
    const names = Object.keys(Bridge)
      .filter(item => item.toLowerCase() === bridge.replace('-', '').toLowerCase());
    if (names.length == 0) return;
    return Bridge[names[0]];
  }
}

