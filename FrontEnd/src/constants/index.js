export const CRIME_GROUPS = [
  "Murder","Attempt to Murder","Robbery","Dacoity","Theft","Burglary",
  "Kidnapping & Abduction","Assault","Rioting","Cheating & Fraud",
  "Criminal Breach of Trust","Counterfeiting","Arson","Dowry Death",
  "Cybercrime","Sexual Offences","Narcotics (NDPS Act)","Arms Act Violations",
  "SC/ST Atrocities","Motor Vehicle Theft"
];
export const FIR_STATUSES = ["Under Investigation","Chargesheeted","Closed","Convicted","Acquitted"];
export const GENDERS = ["Male","Female","Other"];
export const INVOLVEMENT_TYPES = ["Primary","Accomplice","Abettor","Conspirator"];
export const SES_LEVELS = ["Lower","Lower-Middle","Middle","Upper-Middle","Upper"];
export const KARNATAKA_CENTER = { lat: 15.3173, lng: 75.7139 };
export const KARNATAKA_BOUNDS = { latMin: 11.5, latMax: 18.5, lonMin: 74.0, lonMax: 78.5 };
export const ROLES = { OFFICER: "Officer", SHO: "SHO", ANALYST: "SCRB Analyst", ADMIN: "Admin" };
export const STATUS_COLORS = {
  "Under Investigation": "--warning", "Chargesheeted": "--accent",
  "Closed": "--success", "Convicted": "--success", "Acquitted": "--danger"
};
export const CRIME_COLOR_MAP = {
  "Murder":"#ff4d4d","Attempt to Murder":"#ff8080","Robbery":"#ff9933","Dacoity":"#ffcc00",
  "Theft":"#ffff66","Burglary":"#ccff33","Kidnapping & Abduction":"#33cc33","Assault":"#3399ff",
  "Rioting":"#9933ff","Cheating & Fraud":"#ff33cc","Cybercrime":"#00ffff","Narcotics (NDPS Act)":"#a0db8d"
};
