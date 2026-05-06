/**
 * New Boston street props (cars, signs, street debris). Cache keys match the
 * existing PreloadScene names (`car_*`, `sign_*`, `prop_*`).
 */
import carBlack       from './assets/props/cars/Car Black.png';
import carWhite       from './assets/props/cars/Car White.png';
import carRed         from './assets/props/cars/Car Red.png';
import carBlue        from './assets/props/cars/Car Blue.png';
import carTaxi        from './assets/props/cars/Car Taxi.png';
import carGreen       from './assets/props/cars/Car Green.png';

import signBase       from './assets/props/signs/Sign Base.png';
import signDanger     from './assets/props/signs/Sign Danger.png';
import signNoEntry    from './assets/props/signs/Sign No Entry.png';
import signStop       from './assets/props/signs/Sign Stop.png';
import signRadioact   from './assets/props/signs/Sign RadioActive.png';

import propBarrel     from './assets/props/misc/Barrel.png';
import propCrate      from './assets/props/misc/Crate.png';
import propCone       from './assets/props/misc/Cone.png';
import propSkull      from './assets/props/misc/Skull.png';
import propTrash1     from './assets/props/misc/Trash Can 1.png';
import propTrash2     from './assets/props/misc/Trash Can 2.png';
import propTrash3     from './assets/props/misc/Trash Can 3.png';
import propBarrierRed from './assets/props/misc/Barrier red.png';
import propBarrierYel from './assets/props/misc/Barrier yellow.png';

export const NEW_BOSTON_ASSET_URLS: Record<string, string> = {
  car_black:        carBlack,
  car_white:        carWhite,
  car_red:          carRed,
  car_blue:         carBlue,
  car_taxi:         carTaxi,
  car_green:        carGreen,

  sign_base:        signBase,
  sign_danger:      signDanger,
  sign_no_entry:    signNoEntry,
  sign_stop:        signStop,
  sign_radioact:    signRadioact,

  prop_barrel:      propBarrel,
  prop_crate:       propCrate,
  prop_cone:        propCone,
  prop_skull:       propSkull,
  prop_trash1:      propTrash1,
  prop_trash2:      propTrash2,
  prop_trash3:      propTrash3,
  prop_barrier_red: propBarrierRed,
  prop_barrier_yel: propBarrierYel,
};
