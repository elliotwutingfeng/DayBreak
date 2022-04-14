import { existsSync, writeFileSync, readFileSync } from "fs";

import { me as appbit } from "appbit";
import { BodyPresenceSensor } from "body-presence";
import clock from "clock";
import * as document from "document";
import { geolocation } from "geolocation";
import { HeartRateSensor } from "heart-rate";

import * as datetimeutils from "../common/datetimeutils";
import * as partofdayutils from "../common/partofdayutils";
import * as printutils from "../common/printutils";

const gps_coords_filename = "gps-coords.txt";
let hrm;
let heartRate = "-";
let locationIsUpToDate = false;
let geoWatchID;

// create CBOR file with default GPS coordinates values if not exists
if (!existsSync(`/private/data/${gps_coords_filename}`)) {
  writeFileSync(
    gps_coords_filename,
    {
      latitude: 1.3521,
      longitude: 103.8198,
      unixMillis: 0,
    },
    "cbor"
  );
}

// configure heart rate sensor
if (HeartRateSensor && appbit.permissions.granted("access_heart_rate")) {
  hrm = new HeartRateSensor({ frequency: 1, batch: 5 });
  // update heartRate with the mean value
  // when new batch of readings is received
  hrm.onreading = function () {
    heartRate = Math.round(
      hrm.readings.heartRate.reduce((a, b) => a + b, 0) /
        hrm.readings.heartRate.length || 0
    );
  };
}

if (BodyPresenceSensor) {
  const body = new BodyPresenceSensor();
  body.addEventListener("reading", () => {
    if (!body.present) {
      // when user is not wearing fitbit
      if (hrm !== undefined) {
        // disable heart rate monitor
        hrm.stop();
        // stop heart icon animation loop
        document.getElementById("heartRateIconAnimate").to = 1;
        heartRate = "-";
      }
      if (typeof geoWatchID === "number") {
        // disable gps receiver
        geolocation.clearWatch(geoWatchID);
      }
    } else {
      // when user is wearing fitbit
      if (hrm !== undefined) {
        // enable heart rate monitor
        hrm.start();
        // start heart icon animation loop
        document.getElementById("heartRateIconAnimate").to = 0.7;
      }
      if (
        appbit.permissions.granted("access_location") &&
        appbit.permissions.granted("run_background")
      ) {
        // enable gps receiver
        // scan for new coordinates every 2 min, cache coordinates for up to 15 min
        geoWatchID = geolocation.watchPosition(locationSuccess, locationError, {
          timeout: 120_000, // 120 s => 2 mins
          maximumAge: 900_000, // 900 s => 15 min
        });
      }
    }
  });
  body.start();
}

function locationSuccess(position) {
  // save coordinates to file
  const { longitude, latitude } = position.coords;
  const unixMillis = new Date().getTime();
  writeFileSync(
    gps_coords_filename,
    {
      latitude,
      longitude,
      unixMillis,
    },
    "cbor"
  );
}
// eslint-disable-next-line no-unused-vars
function locationError(error) {
  // console.error("Error: " + error.code, "Message: " + error.message);
}

// whenever a second passes
clock.granularity = "seconds";
clock.ontick = (evt) => {
  const { now, year, month, date, day, hours, minutes, seconds, ampm } =
    datetimeutils.getDateTimeComponents(evt.date);
  const { longitude, latitude, unixMillis } = readFileSync(
    gps_coords_filename,
    "cbor"
  );
  const { currentPart, upcomingPart } = partofdayutils.updateSunTimes(
    now,
    latitude,
    longitude
  );
  const timeLeftToUpcomingPart = datetimeutils.calcTimeInterval(
    upcomingPart[1],
    now
  );
  const currentPhaseDuration = datetimeutils.calcTimeInterval(
    upcomingPart[1],
    currentPart[1]
  );

  // Last known GPS reading was less than 20 min ago
  locationIsUpToDate = now.getTime() - unixMillis < 1_200_000; // 1200 s => 20 min

  printutils.printHeartRate(heartRate);
  printutils.printSteps();
  printutils.printBatteryLife();

  printutils.printDatestamp(day, date, month);
  printutils.printTimestamp(hours, minutes, seconds, ampm);

  printutils.printGPS(longitude, latitude, locationIsUpToDate);

  printutils.printCurrentPart(currentPart);
  printutils.printUpcomingPart(upcomingPart);

  printutils.updateProgressBar(timeLeftToUpcomingPart, currentPhaseDuration);

  printutils.printTimeLeftToUpcomingPart(timeLeftToUpcomingPart);
};
