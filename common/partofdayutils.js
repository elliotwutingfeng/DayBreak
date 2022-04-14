import SunCalc from "./suncalc";

export function updateSunTimes(now, latitude, longitude) {
  const oneDayAgo = new Date(now.getTime());
  oneDayAgo.setDate(now.getDate() - 1);
  const oneDayInTheFuture = new Date(now.getTime());
  oneDayInTheFuture.setDate(now.getDate() + 1);

  const sunTimes_oneDayAgo = SunCalc.getSunTimes(
    oneDayAgo,
    latitude,
    longitude,
    0,
    false,
    true
  );
  const sunTimes_ = SunCalc.getSunTimes(
    now,
    latitude,
    longitude,
    0,
    false,
    true
  );
  const sunTimes_oneDayInTheFuture = SunCalc.getSunTimes(
    oneDayInTheFuture,
    latitude,
    longitude,
    0,
    false,
    true
  );

  const partsOfDay = [];
  for (const s of [sunTimes_oneDayAgo, sunTimes_, sunTimes_oneDayInTheFuture]) {
    const sunTimes = {};
    for (const k of Object.keys(s)) {
      sunTimes[k] = s[k].value;
    }
    const partsOfDay_ = Object.keys(partsOfDayNames).map((k) => [
      k,
      sunTimes[k],
    ]);
    partsOfDay.push(...partsOfDay_);
  }

  /*
  // partsOfDay should already be in ascending order of timestamp
  let dNow = partsOfDay[0][1];
  let notSorted = false;
  for (const x of partsOfDay) {
    if (dNow > x[1]) {
      notSorted = true;
      break;
    }
    dNow = x[1];
  }
  console.log(`partsOfDay is ${notSorted ? "not " : ""}sorted`);
  */

  // because .find and .findIndex not supported by SDK

  const { currentPart, upcomingPart } = (function (partsOfDay) {
    // starting from earliest day phase timing
    // find upcomingPart; the first day phase timing that is later than now
    // the currentPart is the day phase timing just before upcomingPart
    for (let idx = 0; idx < partsOfDay.length; idx++) {
      if (now < partsOfDay[idx][1]) {
        return {
          currentPart: partsOfDay[idx - 1],
          upcomingPart: partsOfDay[idx],
        };
      }
    }
  })(partsOfDay);

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
