import { preferences } from "user-settings";

// add zero in front of numbers < 10
export function zeroPad(i) {
  return i < 10 ? "0" + i : i;
}

// pretty printing datetime
export function getDateTimeComponents(now) {
  const year = now.getFullYear();
  const month = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ][now.getMonth()];
  const date = now.getDate();
  const day = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][now.getDay()];

  const hours_ = now.getHours();
  const ampm =
    preferences.clockDisplay === "12h" ? (hours_ > 11 ? "PM" : "AM") : "";
  // 12h or 24h format
  const hours =
    preferences.clockDisplay === "12h"
      ? String(hours_ % 12 || 12)
      : zeroPad(hours_);

  const minutes = zeroPad(now.getMinutes());

  const seconds = zeroPad(now.getSeconds());

  return { now, year, month, date, day, hours, minutes, seconds, ampm };
}

export function calcTimeInterval(future, current) {
  let delta = Math.abs(future - current) / 1000;
  const days = Math.floor(delta / 86400);
  delta -= days * 86400;
  const hours = Math.floor(delta / 3600) % 24;
  delta -= hours * 3600;
  const minutes = Math.floor(delta / 60) % 60;
  delta -= minutes * 60;
  const seconds = Math.floor(delta % 60);

  return {
    hours: zeroPad(hours),
    minutes: zeroPad(minutes),
    seconds: zeroPad(seconds),
  };
}
