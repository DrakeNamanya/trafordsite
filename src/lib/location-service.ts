/**
 * Location service for the website — mirrors the Flutter app's LocationService.
 *
 * IMPORTANT: PostgREST caps every response at 1000 rows by default. Uganda
 * has ~2,190 subcounties and ~10,552 parishes, so eagerly fetching them all
 * silently truncates the lists (the user sees only districts/subcounties
 * and the parish/village dropdowns stay empty for many subcounties).
 *
 * To keep the cascade correct we now lazy-load:
 *   • Districts: eager (only ~134 rows, well under the cap)
 *   • Subcounties: lazy by district_id
 *   • Parishes:   lazy by subcounty_id
 *   • Villages:   lazy by parish_id (~70k rows total, never bulk load)
 *
 * Used by the website signup form so the cascading
 * district → subcounty → parish → village dropdowns match the mobile app
 * exactly, and the foreign keys written to profiles.{district,subcounty,
 * parish,village}_id stay consistent across platforms.
 */

import { createClient } from './supabase/client';

export interface District {
  id: number;
  name: string;
  region: string;
}

export interface Subcounty {
  id: number;
  name: string;
  district_id: number;
}

export interface Parish {
  id: number;
  name: string;
  subcounty_id: number;
}

export interface Village {
  id: number;
  name: string;
  parish_id: number;
}

export interface LocationBundle {
  districts: District[];
}

/** Eager-load only the districts list (small enough to fit under PostgREST's 1k cap). */
export async function loadLocationBundle(): Promise<LocationBundle> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('districts')
    .select('id, name, region')
    .order('name');
  if (error) throw error;
  return { districts: (data ?? []) as District[] };
}

/** Lazy-load subcounties for a single district. */
export async function loadSubcountiesFor(
  districtId: number,
): Promise<Subcounty[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subcounties')
    .select('id, name, district_id')
    .eq('district_id', districtId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Subcounty[];
}

/** Lazy-load parishes for a single subcounty. */
export async function loadParishesFor(
  subcountyId: number,
): Promise<Parish[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('parishes')
    .select('id, name, subcounty_id')
    .eq('subcounty_id', subcountyId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Parish[];
}

/** Lazy-load villages for a single parish. */
export async function loadVillagesFor(parishId: number): Promise<Village[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('villages')
    .select('id, name, parish_id')
    .eq('parish_id', parishId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Village[];
}
