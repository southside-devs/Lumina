-- =============================================================================
-- Lumina — Catalyst Data Store Schema Reference
-- Crime Intelligence & Analytical Platform (KSP Datathon 2026)
-- =============================================================================
-- NOTE: This DDL is a reference for the relational schema.
-- Catalyst Data Store uses its own table creation API; this file documents
-- the intended structure for development and data generation.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. DISTRICT
-- All 31 Karnataka districts with population data.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE District (
    ID              INTEGER PRIMARY KEY,
    Name            VARCHAR(100)    NOT NULL UNIQUE,
    Code            VARCHAR(10)     NOT NULL UNIQUE,   -- e.g., 'BLR-U', 'MYS'
    Population      INTEGER         NOT NULL,
    Latitude        DECIMAL(9,6),                       -- District centroid
    Longitude       DECIMAL(9,6)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. POLICE_STATION
-- ~200 stations mapped to their parent district.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE Police_Station (
    ID                  INTEGER PRIMARY KEY,
    District_ID         INTEGER         NOT NULL REFERENCES District(ID),
    Name                VARCHAR(150)    NOT NULL,
    Jurisdiction_Area   VARCHAR(200),                   -- Descriptive area name
    Latitude            DECIMAL(9,6),
    Longitude           DECIMAL(9,6)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FIR (First Information Report)
-- Core incident records. Each FIR belongs to one police station.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE FIR (
    ID              INTEGER PRIMARY KEY,
    Station_ID      INTEGER         NOT NULL REFERENCES Police_Station(ID),
    FIR_Number      VARCHAR(30)     NOT NULL,           -- e.g., '0042/2025'
    Date            DATE            NOT NULL,
    Crime_Group     VARCHAR(100)    NOT NULL,           -- IPC crime category
    Crime_Subgroup  VARCHAR(100),                       -- Specific section
    Latitude        DECIMAL(9,6)    NOT NULL,
    Longitude       DECIMAL(9,6)    NOT NULL,
    Narrative       TEXT,                               -- FIR text for NER
    Status          VARCHAR(30)     NOT NULL DEFAULT 'Under Investigation'
                    CHECK (Status IN (
                        'Under Investigation',
                        'Chargesheeted',
                        'Closed',
                        'Convicted',
                        'Acquitted'
                    ))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ACCUSED
-- Offender profiles. One accused can appear in many FIRs via Case_Accused.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE Accused (
    ID              INTEGER PRIMARY KEY,
    Name            VARCHAR(150)    NOT NULL,
    DOB             DATE,
    Gender          VARCHAR(10)     CHECK (Gender IN ('Male', 'Female', 'Other')),
    Occupation      VARCHAR(100),
    Arrest_Count    INTEGER         NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VICTIM
-- Victim profiles linked to FIRs.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE Victim (
    ID                      INTEGER PRIMARY KEY,
    FIR_ID                  INTEGER         NOT NULL REFERENCES FIR(ID),
    Name                    VARCHAR(150)    NOT NULL,
    DOB                     DATE,
    Gender                  VARCHAR(10)     CHECK (Gender IN ('Male', 'Female', 'Other')),
    Socioeconomic_Status    VARCHAR(30)     CHECK (Socioeconomic_Status IN (
                                'Lower', 'Lower-Middle', 'Middle', 'Upper-Middle', 'Upper'
                            ))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CASE_ACCUSED (Junction Table)
-- Many-to-many mapping between FIRs and Accused.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE Case_Accused (
    ID                  INTEGER PRIMARY KEY,
    FIR_ID              INTEGER         NOT NULL REFERENCES FIR(ID),
    Accused_ID          INTEGER         NOT NULL REFERENCES Accused(ID),
    Involvement_Type    VARCHAR(50)     NOT NULL DEFAULT 'Primary'
                        CHECK (Involvement_Type IN (
                            'Primary', 'Accomplice', 'Abettor', 'Conspirator'
                        )),
    UNIQUE (FIR_ID, Accused_ID)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. RISK_SCORE
-- Precomputed AI risk scores per district × crime type.
-- Generated by Catalyst Zia AutoML forecasting pipeline.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE Risk_Score (
    ID              INTEGER PRIMARY KEY,
    District_ID     INTEGER         NOT NULL REFERENCES District(ID),
    Crime_Type      VARCHAR(100)    NOT NULL,
    Score           DECIMAL(5,2)    NOT NULL CHECK (Score >= 0 AND Score <= 100),
    Forecast_Date   DATE            NOT NULL,
    UNIQUE (District_ID, Crime_Type, Forecast_Date)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_fir_date          ON FIR (Date);
CREATE INDEX idx_fir_crime_group   ON FIR (Crime_Group);
CREATE INDEX idx_fir_station       ON FIR (Station_ID);
CREATE INDEX idx_fir_coords        ON FIR (Latitude, Longitude);
CREATE INDEX idx_victim_fir        ON Victim (FIR_ID);
CREATE INDEX idx_case_accused_fir  ON Case_Accused (FIR_ID);
CREATE INDEX idx_case_accused_acc  ON Case_Accused (Accused_ID);
CREATE INDEX idx_risk_district     ON Risk_Score (District_ID);
