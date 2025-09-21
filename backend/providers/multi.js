// backend/providers/multi.js
import db from "./db.js";
import * as carquery from "./carquery.js";
import * as rdw from "./rdw.js";

// ----- MAKES -----
export async function getMakes() {
  try {
    const makes = await carquery.getMakes();
    if (makes?.length) return makes;
    console.warn("CarQuery.getMakes renvoie vide -> fallback DB");
  } catch (e) {
    console.warn("CarQuery.getMakes ERROR:", e.message);
  }
  try {
    const rows = await db(`SELECT DISTINCT make FROM v_catalogue ORDER BY make`);
    if (rows?.length) return rows.map(r => r.make);
  } catch (e) {
    console.warn("DB v_catalogue indisponible, fallback v_trim_quote:", e.message);
    const rows2 = await db(`SELECT DISTINCT make FROM v_trim_quote ORDER BY make`);
    return rows2.map(r => r.make);
  }
  return [];
}

// ----- MODELS -----
export async function getModels(make) {
  if (!make) return [];
  try {
    const models = await carquery.getModels(make);
    if (models?.length) return models;
    console.warn(`CarQuery.getModels(${make}) vide -> fallback DB`);
  } catch (e) {
    console.warn(`CarQuery.getModels(${make}) ERROR:`, e.message);
  }
  try {
    const rows = await db(`
      SELECT DISTINCT model FROM v_catalogue WHERE make=$1 ORDER BY model
    `, [make]);
    if (rows?.length) return rows.map(r => r.model);
  } catch (e) {
    const rows2 = await db(`
      SELECT DISTINCT model FROM v_trim_quote WHERE make=$1 ORDER BY model
    `, [make]);
    return rows2.map(r => r.model);
  }
  return [];
}

// ----- YEARS -----
export async function getYears(make, model) {
  if (!make || !model) return [];
  try {
    const years = await carquery.getYears(make, model);
    if (years?.length) return years;
    console.warn(`CarQuery.getYears(${make}, ${model}) vide -> fallback DB`);
  } catch (e) {
    console.warn(`CarQuery.getYears(${make}, ${model}) ERROR:`, e.message);
  }
  try {
    const rows = await db(`
      SELECT DISTINCT year FROM v_catalogue WHERE make=$1 AND model=$2 ORDER BY year DESC
    `, [make, model]);
    if (rows?.length) return rows.map(r => r.year);
  } catch (e) {
    const rows2 = await db(`
      SELECT DISTINCT year FROM v_trim_quote WHERE make=$1 AND model=$2 ORDER BY year DESC
    `, [make, model]);
    return rows2.map(r => r.year);
  }
  return [];
}

// ----- ENGINES (DB d'abord pour avoir trim_id, sinon fallback CarQuery) -----
export async function getEngines(make, model, year) {
  if (!make || !model || !year) return [];
  try {
    const rows = await db(`
      SELECT DISTINCT trim_id, engine
        FROM v_catalogue
       WHERE make=$1 AND model=$2 AND year=$3
       ORDER BY engine
    `, [make, model, year]);
    if (rows?.length) return rows;
  } catch (e) {
    // si v_catalogue n'existe pas, tente v_trim_quote
    const rows2 = await db(`
      SELECT DISTINCT trim_id, engine
        FROM v_trim_quote
       WHERE make=$1 AND model=$2 AND year=$3
       ORDER BY engine
    `, [make, model, year]);
    if (rows2?.length) return rows2;
  }
  // fallback CarQuery (sans trim_id)
  try {
    const trims = await carquery.getTrims(make, model, year);
    return trims;
  } catch (e) {
    console.warn(`CarQuery.getTrims(${make}, ${model}, ${year}) ERROR:`, e.message);
    return [];
  }
}

// ----- QUOTE -----
export async function getQuote({ trimId }) {
  if (!trimId) return { error: "trimId requis" };
  const rows = await db(`
    SELECT tmc_estimate AS tmc, annual_tax_estimate AS taxe_annuelle
      FROM v_trim_quote
     WHERE trim_id = $1
  `, [trimId]);
  if (!rows?.length) return { error: "Données introuvables pour ce moteur" };
  return rows[0];
}
