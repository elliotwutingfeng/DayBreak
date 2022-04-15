/*
 (c) 2011-2015, Vladimir Agafonkin
 SunCalc is a JavaScript library for calculating sun/moon position and light phases.
 https://github.com/mourner/suncalc

 Reworked and enhanced by Robert Gester
 Additional Copyright (c) 2022 Robert Gester
 https://github.com/hypnos3/suncalc3
*/

"use strict";
// sun calculations are based on http://aa.quae.nl/en/reken/zonpositie.html formulas

// shortcuts for easier to read formulas
const sin = Math.sin;
const cos = Math.cos;
const tan = Math.tan;
const asin = Math.asin;
const atan = Math.atan2;
const acos = Math.acos;
const rad = Math.PI / 180;
const degr = 180 / Math.PI;

// date/time constants and conversions
const dayMs = 86400000; // 1000 * 60 * 60 * 24;
const J1970 = 2440587.5;
const J2000 = 2451545;

/**
 * convert date from Julian calendar
 * @param {number} j    -    day number in Julian calendar to convert
 * @return {number} result date as timestamp
 */
function fromJulianDay(j) {
  return (j - J1970) * dayMs;
}

/**
 * get number of days for a dateValue since 2000
 * @param {number} dateValue date as timestamp to get days
 * @return {number} count of days
 */
function toDays(dateValue) {
  return dateValue / dayMs + J1970 - J2000;
}

// general calculations for position

const e = rad * 23.4397; // obliquity of the Earth

/**
 * get right ascension
 * @param {number} l
 * @param {number} b
 * @returns {number}
 */
function rightAscension(l, b) {
  return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l));
}

/**
 * get declination
 * @param {number} l
 * @param {number} b
 * @returns {number}
 */
function declination(l, b) {
  return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l));
}

/**
 * get azimuth
 * @param {number} H - siderealTime
 * @param {number} phi - PI constant
 * @param {number} dec - The declination of the sun
 * @returns {number} azimuth in rad
 */
function azimuthCalc(H, phi, dec) {
  return atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) + Math.PI;
}

/**
 * get altitude
 * @param {number} H - siderealTime
 * @param {number} phi - PI constant
 * @param {number} dec - The declination of the sun
 * @returns {number}
 */
function altitudeCalc(H, phi, dec) {
  return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

/**
 * side real time
 * @param {number} d
 * @param {number} lw
 * @returns {number}
 */
function siderealTime(d, lw) {
  return rad * (280.16 + 360.9856235 * d) - lw;
}

// general sun calculations
/**
 * get solar mean anomaly
 * @param {number} d
 * @returns {number}
 */
function solarMeanAnomaly(d) {
  return rad * (357.5291 + 0.98560028 * d);
}

/**
 * ecliptic longitude
 * @param {number} M
 * @returns {number}
 */
function eclipticLongitude(M) {
  const C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M));
  // equation of center
  const P = rad * 102.9372; // perihelion of the Earth
  return M + C + P + Math.PI;
}

/**
 * sun coordinates
 * @param {number} d days in Julian calendar
 * @returns {ISunCoordinates}
 */
function sunCoords(d) {
  const M = solarMeanAnomaly(d);
  const L = eclipticLongitude(M);

  return {
    dec: declination(L, 0),
    ra: rightAscension(L, 0),
  };
}

const SunCalc = {};

/**
 * calculates sun position for a given date and latitude/longitude
 * @param {number|Date} dateValue Date object or timestamp for calculating sun-position
 * @param {number} lat latitude for calculating sun-position
 * @param {number} lng longitude for calculating sun-position
 * @return {ISunPosition} result object of sun-position
 */
SunCalc.getPosition = function (dateValue, lat, lng) {
  // console.log(`getPosition dateValue=${dateValue}  lat=${lat}, lng=${lng}`);
  if (isNaN(lat)) {
    throw new Error("latitude missing");
  }
  if (isNaN(lng)) {
    throw new Error("longitude missing");
  }
  if (dateValue instanceof Date) {
    dateValue = dateValue.valueOf();
  }
  const lw = rad * -lng;
  const phi = rad * lat;
  const d = toDays(dateValue);
  const c = sunCoords(d);
  const H = siderealTime(d, lw) - c.ra;
  const azimuth = azimuthCalc(H, phi, c.dec);
  const altitude = altitudeCalc(H, phi, c.dec);
  // console.log(`getPosition date=${date}, M=${H}, L=${H}, c=${JSON.stringify(c)}, d=${d}, lw=${lw}, phi=${phi}`);

  return {
    azimuth,
    altitude,
    zenith: (90 * Math.PI) / 180 - altitude,
    azimuthDegrees: degr * azimuth,
    altitudeDegrees: degr * altitude,
    zenithDegrees: 90 - degr * altitude,
    declination: c.dec,
  };
};

/** sun times configuration
 * @type {Array.<ISunTimeNames>}
 */
const sunTimes = (SunCalc.times = [
  { angle: 6, riseName: "goldenHourDawnEnd", setName: "goldenHourDuskStart" }, // GOLDEN_HOUR_2
  { angle: -0.3, riseName: "sunriseEnd", setName: "sunsetStart" }, // SUNRISE_END
  { angle: -0.833, riseName: "sunriseStart", setName: "sunsetEnd" }, // SUNRISE
  { angle: -1, riseName: "goldenHourDawnStart", setName: "goldenHourDuskEnd" }, // GOLDEN_HOUR_1
  { angle: -4, riseName: "blueHourDawnEnd", setName: "blueHourDuskStart" }, // BLUE_HOUR
  { angle: -6, riseName: "civilDawn", setName: "civilDusk" }, // DAWN
  { angle: -8, riseName: "blueHourDawnStart", setName: "blueHourDuskEnd" }, // BLUE_HOUR
  { angle: -12, riseName: "nauticalDawn", setName: "nauticalDusk" }, // NAUTIC_DAWN
  { angle: -15, riseName: "amateurDawn", setName: "amateurDusk" },
  { angle: -18, riseName: "astronomicalDawn", setName: "astronomicalDusk" }, // ASTRO_DAWN
]);

/** alternate time names for backward compatibility
 * @type {Array.<[string, string]>}
 */
const suntimesDeprecated = (SunCalc.timesDeprecated = [
  ["dawn", "civilDawn"],
  ["dusk", "civilDusk"],
  ["nightEnd", "astronomicalDawn"],
  ["night", "astronomicalDusk"],
  ["nightStart", "astronomicalDusk"],
  ["goldenHour", "goldenHourDuskStart"],
  ["sunrise", "sunriseStart"],
  ["sunset", "sunsetEnd"],
  ["goldenHourEnd", "goldenHourDawnEnd"],
  ["goldenHourStart", "goldenHourDuskStart"],
]);

/** adds a custom time to the times config
 * @param {number} angleAltitude - angle of Altitude/elevation above the horizont of the sun in degrees
 * @param {string} riseName - name of sun rise (morning name)
 * @param {string} setName  - name of sun set (evening name)
 * @param {number} [risePos]  - (optional) position at rise (morning)
 * @param {number} [setPos]  - (optional) position at set (evening)
 * @param {boolean} [degree=true] defines if the elevationAngle is in degree not in radians
 * @return {Boolean} true if new time could be added, false if not (parameter missing; riseName or setName already existing)
 */
SunCalc.addTime = function (
  angleAltitude,
  riseName,
  setName,
  risePos,
  setPos,
  degree
) {
  let isValid =
    typeof riseName === "string" &&
    riseName.length > 0 &&
    typeof setName === "string" &&
    setName.length > 0 &&
    typeof angleAltitude === "number";
  if (isValid) {
    const EXP = /^(?![0-9])[a-zA-Z0-9$_]+$/;
    // check for invalid names
    for (let i = 0; i < sunTimes.length; ++i) {
      if (
        !EXP.test(riseName) ||
        riseName === sunTimes[i].riseName ||
        riseName === sunTimes[i].setName
      ) {
        isValid = false;
        break;
      }
      if (
        !EXP.test(setName) ||
        setName === sunTimes[i].riseName ||
        setName === sunTimes[i].setName
      ) {
        isValid = false;
        break;
      }
    }
    if (isValid) {
      const angleDeg =
        degree === false ? angleAltitude * (180 / Math.PI) : angleAltitude;
      sunTimes.push({ angle: angleDeg, riseName, setName, risePos, setPos });
      for (let i = suntimesDeprecated.length - 1; i >= 0; i--) {
        if (
          suntimesDeprecated[i][0] === riseName ||
          suntimesDeprecated[i][0] === setName
        ) {
          suntimesDeprecated.splice(i, 1);
        }
      }
      return true;
    }
  }
  return false;
};

/**
 * add an alternate name for a sun time
 * @param {string} alternameName    - alternate or deprecated time name
 * @param {string} originalName     - original time name from SunCalc.times array
 * @return {Boolean} true if could be added, false if not (parameter missing; originalName does not exists; alternameName already existis)
 */
SunCalc.addDeprecatedTimeName = function (alternameName, originalName) {
  let isValid =
    typeof alternameName === "string" &&
    alternameName.length > 0 &&
    typeof originalName === "string" &&
    originalName.length > 0;
  if (isValid) {
    let hasOrg = false;
    const EXP = /^(?![0-9])[a-zA-Z0-9$_]+$/;
    // check for invalid names
    for (let i = 0; i < sunTimes.length; ++i) {
      if (
        !EXP.test(alternameName) ||
        alternameName === sunTimes[i].riseName ||
        alternameName === sunTimes[i].setName
      ) {
        isValid = false;
        break;
      }
      if (
        originalName === sunTimes[i].riseName ||
        originalName === sunTimes[i].setName
      ) {
        hasOrg = true;
      }
    }
    if (isValid && hasOrg) {
      suntimesDeprecated.push([alternameName, originalName]);
      return true;
    }
  }
  return false;
};
// calculations for sun times

const J0 = 0.0009;

/**
 * Julian cycle
 * @param {number} d - number of days
 * @param {number} lw - rad * -lng;
 * @returns {number}
 */
function julianCycle(d, lw) {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

/**
 * approx transit
 * @param {number} Ht - hourAngle
 * @param {number} lw - rad * -lng
 * @param {number} n - Julian cycle
 * @returns {number} approx transit
 */
function approxTransit(Ht, lw, n) {
  return J0 + (Ht + lw) / (2 * Math.PI) + n;
}

/**
 * solar transit in Julian
 * @param {number} ds - approxTransit
 * @param {number} M - solar mean anomal
 * @param {number} L - ecliptic longitude
 * @returns {number} solar transit in Julian
 */
function solarTransitJ(ds, M, L) {
  return J2000 + ds + 0.0053 * sin(M) - 0.0069 * sin(2 * L);
}

/**
 * hour angle
 * @param {number} h - heigh at 0
 * @param {number} phi -  rad * lat;
 * @param {number} dec - declination
 * @returns {number} hour angle
 */
function hourAngle(h, phi, dec) {
  return acos((sin(h) - sin(phi) * sin(dec)) / (cos(phi) * cos(dec)));
}

/**
 * calculates the obderver angle
 * @param {number} height  the observer height (in meters) relative to the horizon
 * @returns {number} height for further calculations
 */
function observerAngle(height) {
  return (-2.076 * Math.sqrt(height)) / 60;
}

/**
 * returns set time for the given sun altitude
 * @param {number} h - heigh at 0
 * @param {number} lw - rad * -lng
 * @param {number} phi -  rad * lat;
 * @param {number} dec - declination
 * @param {number} n - Julian cycle
 * @param {number} M - solar mean anomal
 * @param {number} L - ecliptic longitude
 * @returns
 */
function getSetJ(h, lw, phi, dec, n, M, L) {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  // console.log(`h=${h} lw=${lw} phi=${phi} dec=${dec} n=${n} M=${M} L=${L} w=${w} a=${a}`);
  return solarTransitJ(a, M, L);
}

/**
 * calculates sun times for a given date and latitude/longitude
 * @param {number|Date} dateValue Date object or timestamp for calculating sun-times
 * @param {number} lat latitude for calculating sun-times
 * @param {number} lng longitude for calculating sun-times
 * @param {number} [height=0]  the observer height (in meters) relative to the horizon
 * @param {boolean} [addDeprecated=false] if true to times from timesDeprecated array will be added to the object
 * @param {boolean} [inUTC=false] defines if the calculation should be in utc or local time (default is local)
 * @return {ISunTimeList} result object of sunTime
 */
SunCalc.getSunTimes = function (
  dateValue,
  lat,
  lng,
  height,
  addDeprecated,
  inUTC
) {
  // console.log(`getSunTimes dateValue=${dateValue}  lat=${lat}, lng=${lng}, height={height}, noDeprecated=${noDeprecated}`);
  if (isNaN(lat)) {
    throw new Error("latitude missing");
  }
  if (isNaN(lng)) {
    throw new Error("longitude missing");
  }
  // @ts-ignore
  const t = new Date(dateValue);
  if (inUTC) {
    t.setUTCHours(12, 0, 0, 0);
  } else {
    t.setHours(12, 0, 0, 0);
  }

  const lw = rad * -lng;
  const phi = rad * lat;
  const dh = observerAngle(height || 0);
  const d = toDays(t.valueOf());
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);

  const Jnoon = solarTransitJ(ds, M, L);
  const noonVal = fromJulianDay(Jnoon);
  const nadirVal = fromJulianDay(Jnoon + 0.5);

  const result = {
    solarNoon: {
      value: new Date(noonVal),
      ts: noonVal,
      name: "solarNoon",
      // elevation: 90,
      julian: Jnoon,
      valid: !isNaN(Jnoon),
      pos: sunTimes.length,
    },
    nadir: {
      value: new Date(nadirVal),
      ts: nadirVal,
      name: "nadir",
      // elevation: 270,
      julian: Jnoon + 0.5,
      valid: !isNaN(Jnoon),
      pos: sunTimes.length * 2 + 1,
    },
  };
  for (let i = 0, len = sunTimes.length; i < len; i += 1) {
    const time = sunTimes[i];
    const sa = time.angle;
    const h0 = (sa + dh) * rad;
    let valid = true;

    let Jset = getSetJ(h0, lw, phi, dec, n, M, L);
    if (isNaN(Jset)) {
      Jset = Jnoon + 0.5;
      valid = false;
      /* Näherung an Wert
            const b = Math.abs(time[0]);
            while (isNaN(Jset) && ((Math.abs(sa) - b) < 2)) {
                sa += 0.005;
                Jset = getSetJ(sa * rad, lw, phi, dec, n, M, L);
            } /* */
    }

    const Jrise = Jnoon - (Jset - Jnoon);
    const v1 = fromJulianDay(Jset);
    const v2 = fromJulianDay(Jrise);

    result[time.setName] = {
      value: new Date(v1),
      ts: v1,
      name: time.setName,
      elevation: sa,
      julian: Jset,
      valid,
      pos: len + i + 1,
    };
    result[time.riseName] = {
      value: new Date(v2),
      ts: v2,
      name: time.riseName,
      elevation: sa, // (180 + (sa * -1)),
      julian: Jrise,
      valid,
      pos: len - i - 1,
    };
  }

  if (addDeprecated) {
    // for backward compatibility
    for (let i = 0, len = suntimesDeprecated.length; i < len; i += 1) {
      const time = suntimesDeprecated[i];
      result[time[0]] = Object.assign({}, result[time[1]]);
      result[time[0]].deprecated = true;
      result[time[0]].nameOrg = result[time[1]].pos;
      result[time[0]].posOrg = result[time[0]].pos;
      result[time[0]].pos = -2;
    }
  }
  // @ts-ignore
  return result;
};

/**
 * calculates the time at which the sun will have a given elevation angle when rising and when setting for a given date and latitude/longitude.
 * @param {number|Date} dateValue Date object or timestamp for calculating sun-times
 * @param {number} lat latitude for calculating sun-times
 * @param {number} lng longitude for calculating sun-times
 * @param {number} elevationAngle sun angle for calculating sun-time
 * @param {number} [height=0]  the observer height (in meters) relative to the horizon
 * @param {boolean} [degree] defines if the elevationAngle is in degree not in radians
 * @param {boolean} [inUTC] defines if the calculation should be in utc or local time (default is local)
 * @return {ISunTimeSingle} result object of single sunTime
 */
SunCalc.getSunTime = function (
  dateValue,
  lat,
  lng,
  elevationAngle,
  height,
  degree,
  inUTC
) {
  // console.log(`getSunTime dateValue=${dateValue}  lat=${lat}, lng=${lng}, elevationAngle=${elevationAngle}`);
  if (isNaN(lat)) {
    throw new Error("latitude missing");
  }
  if (isNaN(lng)) {
    throw new Error("longitude missing");
  }
  if (isNaN(elevationAngle)) {
    throw new Error("elevationAngle missing");
  }
  if (degree) {
    elevationAngle = elevationAngle * rad;
  }
  const t = new Date(dateValue);
  if (inUTC) {
    t.setUTCHours(12, 0, 0, 0);
  } else {
    t.setHours(12, 0, 0, 0);
  }
  const lw = rad * -lng;
  const phi = rad * lat;
  const dh = observerAngle(height || 0);
  const d = toDays(t.valueOf());
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L, 0);
  const Jnoon = solarTransitJ(ds, M, L);

  const h0 = (elevationAngle - 0.833 + dh) * rad;

  const Jset = getSetJ(h0, lw, phi, dec, n, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);
  const v1 = fromJulianDay(Jset);
  const v2 = fromJulianDay(Jrise);

  return {
    set: {
      name: "set",
      value: new Date(v1),
      ts: v1,
      elevation: elevationAngle,
      julian: Jset,
      valid: !isNaN(Jset),
      pos: 0,
    },
    rise: {
      name: "rise",
      value: new Date(v2),
      ts: v2,
      elevation: elevationAngle, // (180 + (elevationAngle * -1)),
      julian: Jrise,
      valid: !isNaN(Jrise),
      pos: 1,
    },
  };
};

export default SunCalc;
