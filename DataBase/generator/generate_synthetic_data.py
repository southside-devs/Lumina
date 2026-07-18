"""
=============================================================================
Lumina — Synthetic Crime Data Generator
Crime Intelligence & Analytical Platform (KSP Datathon 2026)
=============================================================================

Generates realistic synthetic crime data for all 7 Catalyst Data Store tables:
  1. District        — 31 real Karnataka districts
  2. Police_Station   — ~200 real station names
  3. FIR             — ~5,000 First Information Reports
  4. Accused         — ~3,000 offender profiles
  5. Victim          — ~4,500 victim profiles
  6. Case_Accused    — ~6,000 FIR–Accused links
  7. Risk_Score      — 620 district × crime type scores

Output: 7 CSV files written to ../synthetic/

Usage:
    python generate_synthetic_data.py
"""

import os
import random
import math
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd
from faker import Faker

# ── Configuration ───────────────────────────────────────────────────────────
SEED = 42
NUM_FIRS = 5000
NUM_ACCUSED = 3000
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "synthetic"

random.seed(SEED)
np.random.seed(SEED)
fake = Faker("en_IN")
Faker.seed(SEED)


# =============================================================================
# 1. DISTRICT DATA — Real Karnataka Districts
# =============================================================================
DISTRICTS = [
    {"Name": "Bengaluru Urban",     "Code": "BLR-U", "Population": 12765000, "Latitude": 12.9716, "Longitude": 77.5946},
    {"Name": "Bengaluru Rural",     "Code": "BLR-R", "Population": 1112000,  "Latitude": 13.2257, "Longitude": 77.5750},
    {"Name": "Mysuru",              "Code": "MYS",   "Population": 3152000,  "Latitude": 12.2958, "Longitude": 76.6394},
    {"Name": "Mangaluru (DK)",      "Code": "DK",    "Population": 2089000,  "Latitude": 12.9141, "Longitude": 74.8560},
    {"Name": "Hubballi-Dharwad",    "Code": "DHW",   "Population": 1847000,  "Latitude": 15.3647, "Longitude": 75.1240},
    {"Name": "Belagavi",            "Code": "BGM",   "Population": 4779000,  "Latitude": 15.8497, "Longitude": 74.4977},
    {"Name": "Kalaburagi",          "Code": "GUL",   "Population": 2566000,  "Latitude": 17.3297, "Longitude": 76.8343},
    {"Name": "Ballari",             "Code": "BLY",   "Population": 2533000,  "Latitude": 15.1394, "Longitude": 76.9214},
    {"Name": "Tumakuru",            "Code": "TMK",   "Population": 2681000,  "Latitude": 13.3379, "Longitude": 77.1173},
    {"Name": "Shivamogga",          "Code": "SHM",   "Population": 1756000,  "Latitude": 13.9299, "Longitude": 75.5681},
    {"Name": "Raichur",             "Code": "RCR",   "Population": 1924000,  "Latitude": 16.2076, "Longitude": 77.3590},
    {"Name": "Vijayapura",          "Code": "VJP",   "Population": 2177000,  "Latitude": 16.8302, "Longitude": 75.7100},
    {"Name": "Davangere",           "Code": "DVG",   "Population": 1946000,  "Latitude": 14.4644, "Longitude": 75.9218},
    {"Name": "Hassan",              "Code": "HSN",   "Population": 1777000,  "Latitude": 13.0033, "Longitude": 76.0996},
    {"Name": "Uttara Kannada",      "Code": "UKD",   "Population": 1437000,  "Latitude": 14.6819, "Longitude": 74.6899},
    {"Name": "Chikkamagaluru",      "Code": "CKM",   "Population": 1138000,  "Latitude": 13.3153, "Longitude": 75.7754},
    {"Name": "Udupi",               "Code": "UDP",   "Population": 1178000,  "Latitude": 13.3409, "Longitude": 74.7421},
    {"Name": "Chitradurga",         "Code": "CTD",   "Population": 1660000,  "Latitude": 14.2226, "Longitude": 76.3980},
    {"Name": "Mandya",              "Code": "MND",   "Population": 1808000,  "Latitude": 12.5218, "Longitude": 76.8951},
    {"Name": "Kolar",               "Code": "KLR",   "Population": 1540000,  "Latitude": 13.1360, "Longitude": 78.1292},
    {"Name": "Ramanagara",          "Code": "RMN",   "Population": 1082000,  "Latitude": 12.7159, "Longitude": 77.2810},
    {"Name": "Chamarajanagar",      "Code": "CMR",   "Population": 1020000,  "Latitude": 11.9261, "Longitude": 76.9437},
    {"Name": "Chikkaballapur",      "Code": "CKB",   "Population": 1255000,  "Latitude": 13.4355, "Longitude": 77.7315},
    {"Name": "Kodagu",              "Code": "KDG",   "Population": 554000,   "Latitude": 12.4244, "Longitude": 75.7382},
    {"Name": "Dharwad",             "Code": "DWD",   "Population": 1847000,  "Latitude": 15.4589, "Longitude": 75.0078},
    {"Name": "Haveri",              "Code": "HVR",   "Population": 1598000,  "Latitude": 14.7951, "Longitude": 75.4006},
    {"Name": "Gadag",               "Code": "GDG",   "Population": 1065000,  "Latitude": 15.4166, "Longitude": 75.6355},
    {"Name": "Koppal",              "Code": "KPL",   "Population": 1391000,  "Latitude": 15.3547, "Longitude": 76.1548},
    {"Name": "Bagalkot",            "Code": "BGK",   "Population": 1891000,  "Latitude": 16.1691, "Longitude": 75.6615},
    {"Name": "Bidar",               "Code": "BDR",   "Population": 1703000,  "Latitude": 17.9104, "Longitude": 77.5199},
    {"Name": "Yadgir",              "Code": "YDG",   "Population": 1174000,  "Latitude": 16.7701, "Longitude": 77.1383},
]


# =============================================================================
# 2. POLICE STATION DATA — Real Station Names per District
# =============================================================================
STATIONS_BY_DISTRICT = {
    "Bengaluru Urban": [
        "Cubbon Park", "Koramangala", "HSR Layout", "Whitefield", "Indiranagar",
        "Jayanagar", "Basavanagudi", "Yeshwanthpur", "Rajajinagar", "Vijayanagar",
        "Marathahalli", "Electronic City", "Yelahanka", "Hebbal", "Peenya",
        "K.R. Puram", "Mahadevapura", "Bommanahalli", "Banashankari", "Malleswaram",
    ],
    "Bengaluru Rural": [
        "Devanahalli", "Doddaballapur", "Hosakote", "Nelamangala", "Anekal",
        "Sarjapur", "Bidadi",
    ],
    "Mysuru": [
        "Nazarbad", "Devaraja", "K.R. Nagar", "Hunsur", "T. Narsipur",
        "Nanjangud", "Periyapatna", "H.D. Kote",
    ],
    "Mangaluru (DK)": [
        "Mangaluru North", "Mangaluru South", "Surathkal", "Bantwal",
        "Puttur", "Sullia", "Belthangady", "Kadaba",
    ],
    "Hubballi-Dharwad": [
        "Hubballi Old", "Hubballi New", "Gokul Road", "Vidyanagar",
        "Keshwapur", "Dharwad City",
    ],
    "Belagavi": [
        "Belagavi City", "Belagavi Rural", "Gokak", "Athani", "Chikkodi",
        "Ramdurg", "Khanapur", "Bailhongal", "Saundatti",
    ],
    "Kalaburagi": [
        "Kalaburagi City", "Kalaburagi Rural", "Aland", "Afzalpur",
        "Chincholi", "Sedam", "Jewargi",
    ],
    "Ballari": [
        "Ballari City", "Ballari Rural", "Hospet", "Sandur",
        "Siruguppa", "Kudligi",
    ],
    "Tumakuru": [
        "Tumakuru City", "Tumakuru Rural", "Tiptur", "Turuvekere",
        "Kunigal", "Madhugiri", "Sira", "Gubbi",
    ],
    "Shivamogga": [
        "Shivamogga City", "Shivamogga Rural", "Bhadravathi", "Sagar",
        "Shikaripura", "Sorab", "Hosanagara",
    ],
    "Raichur": [
        "Raichur City", "Raichur Rural", "Manvi", "Sindhanur",
        "Devadurga", "Lingasugur",
    ],
    "Vijayapura": [
        "Vijayapura City", "Vijayapura Rural", "Indi", "Muddebihal",
        "Sindagi", "Basavana Bagevadi",
    ],
    "Davangere": [
        "Davangere City", "Davangere Rural", "Harihar", "Jagalur",
        "Channagiri", "Honnali",
    ],
    "Hassan": [
        "Hassan City", "Hassan Rural", "Belur", "Sakleshpur",
        "Arsikere", "Channarayapatna", "Holenarasipura",
    ],
    "Uttara Kannada": [
        "Karwar", "Sirsi", "Kumta", "Ankola", "Honnavar",
        "Bhatkal", "Dandeli", "Joida",
    ],
    "Chikkamagaluru": [
        "Chikkamagaluru City", "Kadur", "Tarikere", "Mudigere",
        "Koppa", "Sringeri", "N.R. Pura",
    ],
    "Udupi": [
        "Udupi City", "Kundapura", "Karkala", "Brahmavar",
        "Kaup", "Hebri",
    ],
    "Chitradurga": [
        "Chitradurga City", "Chitradurga Rural", "Challakere",
        "Hiriyur", "Holalkere", "Hosadurga",
    ],
    "Mandya": [
        "Mandya City", "Mandya Rural", "Srirangapatna", "Pandavapura",
        "Maddur", "Malavalli", "Nagamangala",
    ],
    "Kolar": [
        "Kolar City", "Kolar Rural", "KGF", "Bangarpet",
        "Malur", "Mulbagal", "Srinivaspur",
    ],
    "Ramanagara": [
        "Ramanagara City", "Channapatna", "Magadi", "Kanakapura",
    ],
    "Chamarajanagar": [
        "Chamarajanagar City", "Gundlupet", "Kollegal", "Yelandur",
    ],
    "Chikkaballapur": [
        "Chikkaballapur City", "Chintamani", "Gauribidanur",
        "Sidlaghatta", "Gudibanda", "Bagepalli",
    ],
    "Kodagu": [
        "Madikeri", "Virajpet", "Somwarpet", "Kushalnagar",
    ],
    "Dharwad": [
        "Dharwad City", "Dharwad Rural", "Navalgund", "Kundgol",
    ],
    "Haveri": [
        "Haveri City", "Haveri Rural", "Ranebennur", "Byadgi",
        "Savanur", "Shiggaon", "Hirekerur",
    ],
    "Gadag": [
        "Gadag City", "Gadag Rural", "Ron", "Mundargi", "Nargund",
    ],
    "Koppal": [
        "Koppal City", "Koppal Rural", "Gangavathi", "Kushtagi",
        "Yelburga",
    ],
    "Bagalkot": [
        "Bagalkot City", "Bagalkot Rural", "Badami", "Mudhol",
        "Jamkhandi", "Bilgi", "Hunagund",
    ],
    "Bidar": [
        "Bidar City", "Bidar Rural", "Bhalki", "Aurad",
        "Basavakalyan", "Humnabad",
    ],
    "Yadgir": [
        "Yadgir City", "Yadgir Rural", "Shahapur", "Shorapur", "Gurmatkal",
    ],
}


# =============================================================================
# 3. CRIME TYPES — IPC/NCRB Categories
# =============================================================================
CRIME_GROUPS = [
    "Murder", "Attempt to Murder", "Robbery", "Dacoity", "Theft",
    "Burglary", "Kidnapping & Abduction", "Assault", "Rioting",
    "Cheating & Fraud", "Criminal Breach of Trust", "Counterfeiting",
    "Arson", "Dowry Death", "Cybercrime", "Sexual Offences",
    "Narcotics (NDPS Act)", "Arms Act Violations", "SC/ST Atrocities",
    "Motor Vehicle Theft",
]

# Weight distribution — theft and assault are more common than murder
CRIME_WEIGHTS = np.array([
    3, 2, 5, 1, 18, 12, 6, 15, 3,
    8, 3, 1, 1, 2, 7, 4, 3, 2, 2, 5,
], dtype=float)
CRIME_WEIGHTS /= CRIME_WEIGHTS.sum()


# =============================================================================
# 4. FIR NARRATIVE TEMPLATES — For downstream NER testing
# =============================================================================
NARRATIVE_TEMPLATES = [
    "On {date}, at approximately {time}, the complainant {victim} reported that {accused} committed {crime} near {location}. {weapon_detail}The accused fled towards {direction} on {vehicle}. Case registered under IPC Section {section}.",
    "The complainant {victim} stated that on {date} around {time}, while at {location}, {accused} along with {num_accomplices} unknown accomplices {crime_action}. {weapon_detail}Local witnesses identified the suspect. FIR filed under Section {section} IPC.",
    "Received complaint from {victim} regarding an incident on {date}. The accused {accused} allegedly {crime_action} at {location} during {time}. {weapon_detail}The accused was later identified through CCTV footage from nearby {cctv_source}. Charges framed under IPC {section}.",
    "On {date}, {victim} approached the station to report that {accused} {crime_action} near {location} at approximately {time}. {weapon_detail}Investigation revealed prior criminal history of the accused. Case booked under Section {section}.",
    "An incident of {crime} was reported on {date} at {location}. The victim {victim} sustained {injury_level} injuries. {accused} is identified as the primary suspect. {weapon_detail}The matter is being investigated under IPC Section {section}. Forensic team dispatched to the scene.",
]

WEAPONS = [
    "a sharp-edged weapon (knife)", "a country-made firearm", "an iron rod",
    "a wooden stick (lathi)", "bare hands", "a sickle", "acid",
    "a glass bottle", "a machete", "no weapon (verbal threat)",
]

DIRECTIONS = ["north", "south", "east", "west", "northeast", "towards the highway", "towards the railway station", "towards the bus stand"]
VEHICLES = ["foot", "a motorcycle", "an auto-rickshaw", "a white Maruti car", "a bicycle", "a blue Tata Indica", "a goods tempo", "a scooter"]
CCTV_SOURCES = ["petrol bunk", "ATM", "apartment complex", "shop", "traffic signal", "bank branch", "medical store", "jewellery shop"]
INJURY_LEVELS = ["minor", "moderate", "grievous", "life-threatening", "fatal"]
IPC_SECTIONS = ["302", "307", "392", "395", "379", "457", "363", "323", "147", "420", "406", "489A", "435", "304B", "66C IT Act", "376", "21(b) NDPS", "25 Arms Act", "3(1)(r) SC/ST Act", "379 r/w 411"]

CRIME_ACTIONS = {
    "Murder": ["stabbed the victim", "attacked the victim fatally", "caused the death of the victim by assault"],
    "Attempt to Murder": ["attacked with intent to kill", "struck the victim on the head", "attempted to strangle the victim"],
    "Robbery": ["robbed gold ornaments from the victim", "snatched the mobile phone", "looted cash at knife-point"],
    "Dacoity": ["committed armed robbery with associates", "looted the premises with a group", "held up the establishment"],
    "Theft": ["stole a mobile phone", "pilfered cash from the counter", "committed theft of a two-wheeler", "stole valuables from the residence"],
    "Burglary": ["broke into the residence", "entered the shop by breaking the lock", "committed house-breaking at night"],
    "Kidnapping & Abduction": ["kidnapped the minor", "abducted the victim", "unlawfully confined the complainant"],
    "Assault": ["assaulted the victim", "caused hurt by punching", "attacked without provocation"],
    "Rioting": ["participated in an unlawful assembly", "engaged in rioting and stone pelting", "caused public disturbance"],
    "Cheating & Fraud": ["cheated the victim of Rs. {amount}", "committed online fraud", "duped the victim through a fake scheme"],
    "Criminal Breach of Trust": ["misappropriated funds", "committed breach of trust", "embezzled company funds"],
    "Counterfeiting": ["was found with counterfeit currency", "circulated fake notes", "manufactured spurious currency"],
    "Arson": ["set fire to the property", "committed arson at the victim's house", "torched the vehicle"],
    "Dowry Death": ["harassed the victim for dowry", "subjected the victim to cruelty for dowry", "caused death due to dowry harassment"],
    "Cybercrime": ["hacked the victim's bank account", "committed online impersonation", "sent phishing links to defraud the victim"],
    "Sexual Offences": ["outraged the modesty of the victim", "committed sexual assault", "engaged in criminal intimidation"],
    "Narcotics (NDPS Act)": ["was found in possession of ganja", "was caught selling narcotic substances", "was transporting illegal drugs"],
    "Arms Act Violations": ["was found carrying an unlicensed firearm", "possessed illegal ammunition", "brandished an unlicensed weapon"],
    "SC/ST Atrocities": ["used casteist slurs against the victim", "committed atrocity against a SC/ST individual", "denied access based on caste"],
    "Motor Vehicle Theft": ["stole a parked motorcycle", "committed theft of a car", "drove away with the victim's auto-rickshaw"],
}

LOCATIONS_GENERIC = [
    "MG Road", "Bus Stand", "Market Area", "Railway Station Road",
    "Main Circle", "Temple Street", "Hospital Road", "College Road",
    "Industrial Area", "Ring Road", "Bypass Road", "Lake View Area",
    "Old Town", "New Extension", "Commercial Street", "Gandhi Nagar",
    "Nehru Road", "Station Road", "Court Complex Area", "Agricultural Market Yard",
]


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def jitter_coord(lat: float, lon: float, radius_km: float = 15.0) -> tuple:
    """Add random jitter to coordinates within a given radius."""
    # 1 degree ≈ 111 km
    delta = radius_km / 111.0
    new_lat = lat + np.random.uniform(-delta, delta)
    new_lon = lon + np.random.uniform(-delta, delta)
    # Clamp to Karnataka bounding box
    new_lat = np.clip(new_lat, 11.5, 18.5)
    new_lon = np.clip(new_lon, 74.0, 78.5)
    return round(new_lat, 6), round(new_lon, 6)


def generate_fir_number(station_code: str, year: int, seq: int) -> str:
    """Generate a realistic FIR number like '0042/2025'."""
    return f"{seq:04d}/{year}"


def generate_narrative(crime_group: str, victim_name: str, accused_name: str,
                       station_name: str, date_str: str) -> str:
    """Generate a realistic FIR narrative using templates."""
    template = random.choice(NARRATIVE_TEMPLATES)

    crime_action = random.choice(CRIME_ACTIONS.get(crime_group, ["committed the offence"]))
    if "{amount}" in crime_action:
        crime_action = crime_action.replace("{amount}", f"{random.randint(5, 50) * 1000:,}")

    weapon = random.choice(WEAPONS)
    weapon_detail = f"The accused was armed with {weapon}. " if random.random() > 0.3 else ""

    hour = random.randint(0, 23)
    minute = random.choice([0, 15, 30, 45])
    time_str = f"{hour:02d}:{minute:02d} hrs"

    crime_idx = CRIME_GROUPS.index(crime_group) if crime_group in CRIME_GROUPS else 0

    narrative = template.format(
        date=date_str,
        time=time_str,
        victim=victim_name,
        accused=accused_name,
        crime=crime_group.lower(),
        crime_action=crime_action,
        location=f"{random.choice(LOCATIONS_GENERIC)}, {station_name}",
        weapon_detail=weapon_detail,
        direction=random.choice(DIRECTIONS),
        vehicle=random.choice(VEHICLES),
        section=IPC_SECTIONS[crime_idx],
        num_accomplices=random.randint(2, 5),
        cctv_source=random.choice(CCTV_SOURCES),
        injury_level=random.choice(INJURY_LEVELS),
    )
    return narrative


# =============================================================================
# MAIN GENERATION PIPELINE
# =============================================================================

def generate_all():
    """Generate all 7 tables and write to CSV."""
    print("=" * 70)
    print("  Lumina -- Synthetic Crime Data Generator")
    print("=" * 70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ─── 1. Districts ───────────────────────────────────────────────────
    print("\n[1/7] Generating Districts...")
    df_districts = pd.DataFrame(DISTRICTS)
    df_districts.insert(0, "ID", range(1, len(df_districts) + 1))
    district_lookup = {row["Name"]: row["ID"] for _, row in df_districts.iterrows()}
    print(f"       -> {len(df_districts)} districts")

    # ─── 2. Police Stations ─────────────────────────────────────────────
    print("[2/7] Generating Police Stations...")
    stations = []
    station_id = 1
    for dist_name, station_names in STATIONS_BY_DISTRICT.items():
        dist_id = district_lookup[dist_name]
        dist_row = df_districts[df_districts["ID"] == dist_id].iloc[0]
        for sname in station_names:
            lat, lon = jitter_coord(dist_row["Latitude"], dist_row["Longitude"], radius_km=10.0)
            stations.append({
                "ID": station_id,
                "District_ID": dist_id,
                "Name": sname,
                "Jurisdiction_Area": f"{sname} Jurisdiction",
                "Latitude": lat,
                "Longitude": lon,
            })
            station_id += 1

    df_stations = pd.DataFrame(stations)
    print(f"       -> {len(df_stations)} police stations")

    # ─── 3. Accused ─────────────────────────────────────────────────────
    print("[3/7] Generating Accused profiles...")
    accused_list = []
    for i in range(1, NUM_ACCUSED + 1):
        gender = random.choices(["Male", "Female", "Other"], weights=[80, 18, 2])[0]
        if gender == "Male":
            name = fake.name_male()
        elif gender == "Female":
            name = fake.name_female()
        else:
            name = fake.name()

        dob = fake.date_of_birth(minimum_age=18, maximum_age=65)
        occupation = random.choice([
            "Labourer", "Unemployed", "Driver", "Farmer", "Shopkeeper",
            "Student", "Mechanic", "Auto Driver", "Daily Wage Worker",
            "Business", "Private Employee", "Vendor", "Mason", "Painter",
            "Electrician", "Security Guard", "Cook", "Tailor", "Unknown",
        ])
        # Repeat offenders: ~15% have 2+ arrests
        if random.random() < 0.15:
            arrest_count = random.randint(2, 12)
        else:
            arrest_count = random.randint(0, 1)

        accused_list.append({
            "ID": i,
            "Name": name,
            "DOB": dob.isoformat(),
            "Gender": gender,
            "Occupation": occupation,
            "Arrest_Count": arrest_count,
        })

    df_accused = pd.DataFrame(accused_list)
    print(f"       -> {len(df_accused)} accused profiles")

    # ─── 4. FIRs ────────────────────────────────────────────────────────
    print("[4/7] Generating FIR records...")
    today = datetime(2026, 7, 15)
    start_date = today - timedelta(days=730)  # 2 years back

    # Weighted station selection: urban districts get more FIRs
    station_weights = []
    for _, st in df_stations.iterrows():
        dist_pop = df_districts[df_districts["ID"] == st["District_ID"]].iloc[0]["Population"]
        station_weights.append(math.log(dist_pop + 1))
    station_weights = np.array(station_weights)
    station_weights /= station_weights.sum()

    fir_list = []
    fir_station_counter = {}  # Track FIR sequence per station per year
    statuses = ["Under Investigation", "Chargesheeted", "Closed", "Convicted", "Acquitted"]
    status_weights = [35, 25, 20, 12, 8]

    for i in range(1, NUM_FIRS + 1):
        # Pick station weighted by district population
        station_idx = np.random.choice(len(df_stations), p=station_weights)
        station = df_stations.iloc[station_idx]

        # Generate date with seasonal weighting (more crimes in March-June)
        days_offset = np.random.randint(0, 730)
        fir_date = start_date + timedelta(days=int(days_offset))
        month = fir_date.month
        # Summer bias: 30% more likely in months 3-6
        if month in [3, 4, 5, 6] and random.random() > 0.7:
            days_offset = np.random.randint(60, 180)  # Bias towards March-June
            fir_date = datetime(fir_date.year, 1, 1) + timedelta(days=int(days_offset))

        year = fir_date.year
        key = (station["ID"], year)
        fir_station_counter[key] = fir_station_counter.get(key, 0) + 1
        fir_number = generate_fir_number(station["Name"], year, fir_station_counter[key])

        # Crime type
        crime_group = np.random.choice(CRIME_GROUPS, p=CRIME_WEIGHTS)
        crime_idx = CRIME_GROUPS.index(crime_group)

        # Location: jitter around station
        lat, lon = jitter_coord(station["Latitude"], station["Longitude"], radius_km=5.0)

        # Pick a random accused for narrative
        accused_for_narrative = random.choice(accused_list)

        # Generate victim name for narrative
        victim_name = fake.name()

        # Narrative
        narrative = generate_narrative(
            crime_group, victim_name, accused_for_narrative["Name"],
            station["Name"], fir_date.strftime("%d-%m-%Y"),
        )

        status = random.choices(statuses, weights=status_weights)[0]

        fir_list.append({
            "ID": i,
            "Station_ID": int(station["ID"]),
            "FIR_Number": fir_number,
            "Date": fir_date.strftime("%Y-%m-%d"),
            "Crime_Group": crime_group,
            "Crime_Subgroup": f"IPC {IPC_SECTIONS[crime_idx]}",
            "Latitude": lat,
            "Longitude": lon,
            "Narrative": narrative,
            "Status": status,
        })

    df_firs = pd.DataFrame(fir_list)
    print(f"       -> {len(df_firs)} FIR records")

    # ─── 5. Victims ─────────────────────────────────────────────────────
    print("[5/7] Generating Victim profiles...")
    victim_list = []
    victim_id = 1
    ses_options = ["Lower", "Lower-Middle", "Middle", "Upper-Middle", "Upper"]
    ses_weights_v = [25, 30, 25, 15, 5]

    for _, fir in df_firs.iterrows():
        # 1-2 victims per FIR
        num_victims = random.choices([1, 2], weights=[75, 25])[0]
        for _ in range(num_victims):
            gender = random.choices(["Male", "Female", "Other"], weights=[55, 43, 2])[0]
            if gender == "Male":
                name = fake.name_male()
            elif gender == "Female":
                name = fake.name_female()
            else:
                name = fake.name()

            victim_list.append({
                "ID": victim_id,
                "FIR_ID": fir["ID"],
                "Name": name,
                "DOB": fake.date_of_birth(minimum_age=5, maximum_age=80).isoformat(),
                "Gender": gender,
                "Socioeconomic_Status": random.choices(ses_options, weights=ses_weights_v)[0],
            })
            victim_id += 1

    df_victims = pd.DataFrame(victim_list)
    print(f"       -> {len(df_victims)} victim profiles")

    # --- 6. Case_Accused (FIR <-> Accused links) -------------------------
    print("[6/7] Generating Case-Accused links...")
    case_accused_list = []
    ca_id = 1
    involvement_types = ["Primary", "Accomplice", "Abettor", "Conspirator"]
    involvement_weights = [50, 30, 12, 8]

    # Repeat offenders: accused with high arrest_count should appear in multiple FIRs
    repeat_offenders = [a for a in accused_list if a["Arrest_Count"] >= 2]
    regular_accused = [a for a in accused_list if a["Arrest_Count"] < 2]

    seen_pairs = set()

    for _, fir in df_firs.iterrows():
        # 1-3 accused per FIR
        num_accused_for_fir = random.choices([1, 2, 3], weights=[55, 30, 15])[0]

        # 30% chance of involving a repeat offender
        fir_accused = []
        for j in range(num_accused_for_fir):
            if j == 0 and repeat_offenders and random.random() < 0.30:
                chosen = random.choice(repeat_offenders)
            else:
                chosen = random.choice(accused_list)

            pair = (fir["ID"], chosen["ID"])
            if pair in seen_pairs:
                continue
            seen_pairs.add(pair)

            inv_type = "Primary" if j == 0 else random.choices(involvement_types, weights=involvement_weights)[0]
            case_accused_list.append({
                "ID": ca_id,
                "FIR_ID": fir["ID"],
                "Accused_ID": chosen["ID"],
                "Involvement_Type": inv_type,
            })
            ca_id += 1
            fir_accused.append(chosen)

    df_case_accused = pd.DataFrame(case_accused_list)
    print(f"       -> {len(df_case_accused)} case-accused links")

    # ─── 7. Risk Scores ─────────────────────────────────────────────────
    print("[7/7] Generating Risk Scores...")
    risk_list = []
    risk_id = 1
    forecast_date = today.strftime("%Y-%m-%d")

    for _, dist in df_districts.iterrows():
        for crime in CRIME_GROUPS:
            # Base score influenced by population
            base = 20 + 30 * (dist["Population"] / df_districts["Population"].max())
            noise = np.random.normal(0, 15)
            score = np.clip(base + noise, 0, 100)

            risk_list.append({
                "ID": risk_id,
                "District_ID": dist["ID"],
                "Crime_Type": crime,
                "Score": round(score, 2),
                "Forecast_Date": forecast_date,
            })
            risk_id += 1

    df_risk = pd.DataFrame(risk_list)
    print(f"       -> {len(df_risk)} risk scores")

    # --- Write CSV files ----------------------------------------------------
    print("\n" + "-" * 70)
    print("Writing CSV files to:", OUTPUT_DIR)
    print("-" * 70)

    outputs = {
        "districts.csv": df_districts,
        "police_stations.csv": df_stations,
        "firs.csv": df_firs,
        "accused.csv": df_accused,
        "victims.csv": df_victims,
        "case_accused.csv": df_case_accused,
        "risk_scores.csv": df_risk,
    }

    for filename, df in outputs.items():
        filepath = OUTPUT_DIR / filename
        df.to_csv(filepath, index=False)
        print(f"  [OK] {filename:<25s} -- {len(df):>6,} rows")

    # --- Summary ------------------------------------------------------------
    print("\n" + "=" * 70)
    print("  [DONE] Synthetic data generation complete!")
    print(f"  Output directory: {OUTPUT_DIR}")
    print("=" * 70)

    return outputs


if __name__ == "__main__":
    generate_all()
