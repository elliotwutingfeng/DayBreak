import SunCalc from "./suncalc";

export function updateSunTimes(now, latitude, longitude) {
  const sunTimes_ = SunCalc.getSunTimes(now, latitude, longitude);
  const sunTimes = {};
  for (const k of Object.keys(sunTimes_)) {
    sunTimes[k] = sunTimes_[k].value;
  }

  const partsOfDay = [
    "astronomicalDawn",
    "amateurDawn",
    "nauticalDawn",
    "blueHourDawnStart",
    "civilDawn",
    "blueHourDawnEnd",
    "goldenHourDawnStart",
    "sunriseStart",
    "sunriseEnd",
    "goldenHourDawnEnd",
    "solarNoon",
    "goldenHourDuskStart",
    "sunsetStart",
    "sunsetEnd",
    "goldenHourDuskEnd",
    "blueHourDuskStart",
    "civilDusk",
    "blueHourDuskEnd",
    "nauticalDusk",
    "amateurDusk",
    "astronomicalDusk",
    "nadir",
  ].map((k) => [k, sunTimes[k]]);

  // because .find and .findIndex not supported by SDK

  const currentPart = (function (partsOfDay) {
    // starting from earliest day phase timing
    // find the first day phase timing that is later than now
    // the currentPart is the day phase timing just before that
    for (let idx = 0; idx < partsOfDay.length; idx++) {
      if (now < partsOfDay[idx][1]) {
        const currentPartIndex = idx - 1;
        // edge case where currentPart is day phase before earliest day phase
        return currentPartIndex === -1
          ? partsOfDay[partsOfDay.length - 1]
          : partsOfDay[currentPartIndex];
      }
    }
  })(partsOfDay);

  const upcomingPart = (function (partsOfDay, currentPart) {
    // starting from earliest day phase timing
    // find the day phase timing that is equal to currentPart day phase timing
    // the upcomingPart is the day phase timing just after that
    for (let idx = 0; idx < partsOfDay.length; idx++) {
      if (partsOfDay[idx][0] === currentPart[0]) {
        const upcomingPartIndex = idx + 1;
        // edge case where upcomingPart is day phase after latest day phase
        return upcomingPartIndex === partsOfDay.length
          ? partsOfDay[0]
          : partsOfDay[upcomingPartIndex];
      }
    }
  })(partsOfDay, currentPart);

  return { currentPart, upcomingPart };
}

// conversion table for displaying day phases on screen
export const partsOfDayNames = {
  astronomicalDawn: "Astronomical Dawn",
  amateurDawn: "Amateur Dawn",
  nauticalDawn: "Nautical Dawn",
  blueHourDawnStart: "Blue Hour Dawn Start",
  civilDawn: "Civil Dawn",
  blueHourDawnEnd: "Blue Hour Dawn End",
  goldenHourDawnStart: "Golden Hour Dawn Start",
  sunriseStart: "Sunrise Start",
  sunriseEnd: "Sunrise End",
  goldenHourDawnEnd: "Golden Hour Dawn End",
  solarNoon: "Solar Noon",
  goldenHourDuskStart: "Golden Hour Dusk Start",
  sunsetStart: "Sunset Start",
  sunsetEnd: "Sunset End",
  goldenHourDuskEnd: "Golden Hour Dusk End",
  blueHourDuskStart: "Blue Hour Dusk Start",
  civilDusk: "Civil Dusk",
  blueHourDuskEnd: "Blue Hour Dusk End",
  nauticalDusk: "Nautical Dusk",
  amateurDusk: "Amateur Dusk",
  astronomicalDusk: "Astronomical Dusk",
  nadir: "Solar Nadir",
};
