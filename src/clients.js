export const clientPaths = {
  Bestmed: {
    QA: "Q:\\BestMed\\qa\\sql",
    LIVE: "Q:\\BestMed\\live",
  },
  Ship: {
    QA: "Q:\\SHIP\\qa\\sql",
    LIVE: "Q:\\SHIP\\live\\sql",
  },
  ZMG: {
    QA: "Q:\\ZimGen\\qa\\sql",
    LIVE: "Q:\\ZimGen\\live\\sql",
  },
  ZMZ: {
    QA: "Q:\\ZSIC\\qa\\sql",
    LIVE: "Q:\\ZSIC\\live\\sql",
  },  
  HMS: {
    QA: "Q:\\Zimbabwe\\qa\\sql",
    LIVE: "Q:\\Zimbabwe\\live\\sql",
  },
  ZMC: {
    QA: "Q:\\CIMAS\\qa\\sql",
    LIVE: "Q:\\CIMAS\\live\\sql",
  },
  HIP: {
    QA: "Q:\\iThrive\\qa\\sql",
    LIVE: "Q:\\iThrive\\live\\sql",
  },
  MMI: {
    QA: "Q:\\MMI_Africa\\qa\\sql",
    LIVE: "Q:\\MMI_Africa\\live\\sql",
  },
  FML: {
    QA: "Q:\\FML\\qa\\sql",
    LIVE: "Q:\\FML\\live\\sql",
  },
  BONITAS: {
    QA: "Q:\\Bonitas\\qa\\sql",
    LIVE: "Q:\\Bonitas\\live\\sql",
  },
  Test: {
    TEST: "Q:\\iThrive\\test\\sql",
  },
  Regression: {
    REGRESSION: "Q:\\SHIP\\qa\\regression\\deployed\\sql",
  },
  ALL: {},
};

export const clients = Object.keys(clientPaths);
export const environments = ["QA", "LIVE"];