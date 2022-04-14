import * as document from "document";
import { battery } from "power";
import { today } from "user-activity";

import * as datetimeutils from "../common/datetimeutils";
import { partsOfDayNames } from "./partofdayutils";

export function printHeartRate(heartRate) {
  document.getElementById("heartRateLabel").text = heartRate;
}

export function printSteps() {
  document.getElementById("stepCountLabel").text = `${today.adjusted.steps}`;
}

export function printBatteryLife() {
  document.getElementById("batteryIcon").href = battery.charging
    ? "img/battery_charging.png"
    : battery.chargeLevel > 60
    ? "img/battery_full.png"
    : battery.chargeLevel > 20
    ? "img/battery_half_full.png"
    : "img/battery_empty.png";

  document.getElementById("batteryLabel").text = `${Math.floor(
    battery.chargeLevel
  )}%`;
}

export function printDatestamp(day, date, month) {
  document.getElementById("datestampLabel").text = `${day} ${date} ${month}`;
}

export function printTimestamp(hours, minutes, seconds, ampm) {
  document.getElementById(
    "timestampLabel"
  ).text = `${hours}:${minutes}:${seconds} ${ampm}`;
}

export function printGPS(longitude, latitude, locationIsUpToDate) {
  document.getElementById("gpsLabel").text = `LON: ${longitude.toFixed(
    4
  )} LAT: ${latitude.toFixed(4)}`;
  document.getElementById("gpsIcon").href = locationIsUpToDate
    ? "img/gps.png"
    : "img/gps_unavailable.png";
  document.getElementById("gpsIconAnimate").to = locationIsUpToDate ? 0.7 : 1;
}

export function printCurrentPart(currentPart) {
  const { hours, minutes, ampm } = datetimeutils.getDateTimeComponents(
    currentPart[1]
  );
  const partLabel = splitTo2Lines(partsOfDayNames[currentPart[0]]);
  for (let idx = 0; idx < 2; idx++) {
    document.getElementById(`currentPartLabel_${idx}`).textContent =
      idx >= partLabel.length ? "" : `${partLabel[idx]}`;
  }
  document.getElementById("currentPartTimeLabel").text = `${hours}:${minutes}${
    ampm ? ` ${ampm}` : ""
  }`;
}

export function printUpcomingPart(upcomingPart) {
  const { hours, minutes, ampm } = datetimeutils.getDateTimeComponents(
    upcomingPart[1]
  );
  const partLabel = splitTo2Lines(partsOfDayNames[upcomingPart[0]]);
  for (let idx = 0; idx < 2; idx++) {
    document.getElementById(`upcomingPartLabel_${idx}`).textContent =
      idx >= partLabel.length ? "" : `${partLabel[idx]}`;
  }
  document.getElementById("upcomingPartTimeLabel").text = `${hours}:${minutes}${
    ampm ? ` ${ampm}` : ""
  }`;
}

export function updateProgressBar(
  timeLeftToUpcomingPart,
  currentPhaseDuration
) {
  const progressInner = document.getElementById("progressInner");
  const progressBar = document.getElementById("progressBar");
  // Calculate percentage of current phase completed
  let { hours, minutes, seconds } = timeLeftToUpcomingPart;
  const secondsLeftToNextPhase =
    Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
  ({ hours, minutes, seconds } = currentPhaseDuration);
  const secondsFromCurrentToNextPhase =
    Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
  // percentage is on scale of 0 to 1
  const percentageCompleted =
    1 - secondsLeftToNextPhase / secondsFromCurrentToNextPhase;

  // Scale and color progressBar according to this percentage
  const maxWidth = progressInner.getBBox().width;
  progressBar.width = percentageCompleted * maxWidth;
  progressBar.style.fill =
    percentageCompleted < 0.25
      ? "cyan"
      : percentageCompleted < 0.5
      ? "gold"
      : percentageCompleted < 0.75
      ? "orange"
      : "red";
}

export function printTimeLeftToUpcomingPart(timeLeftToUpcomingPart) {
  const { hours, minutes, seconds } = timeLeftToUpcomingPart;
  document.getElementById("timeLeftToUpcomingPartLabel").text =
    "Next Phase In " +
    (Number(hours) > 23 ? ">24H" : `${hours}:${minutes}:${seconds}`);
}

function splitTo2Lines(sentence) {
  const words = sentence.split(" ");
  if (words.length === 2) {
    return words;
  } else if (words.length === 4) {
    return [words.slice(0, 2).join(" "), words.slice(2).join(" ")];
  } else {
    // this should not happen
    return ["ERROR", "ERROR"];
  }
}
