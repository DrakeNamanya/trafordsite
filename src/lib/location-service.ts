/**
 * Location service for the website — mirrors the Flutter app's LocationService.
 *
 * Loads districts/subcounties/parishes eagerly via PostgREST and villages
 * lazily per parish (the villages table has ~70k rows, never load all).
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
  subcounties: Subcounty[];
  parishes: Parish[];
}

/** One-shot load of districts + subcounties + parishes. */
export async function loadLocationBundle(): Promise<LocationBundle> {
  const supabase = createClient();

  const [districtsRes, subcountiesRes, parishesRes] = await Promise.all([
    supabase.from('districts').select('id, name, region').order('name'),
    supabase
      .from('subcounties')
      .select('id, name, district_id')
      .order('name'),
    supabase.from('parishes').select('id, name, subcounty_id').order('name'),
  ]);

  return {
    districts: (districtsRes.data ?? []) as District[],
    subcounties: (subcountiesRes.data ?? []) as Subcounty[],
    parishes: (parishesRes.data ?? []) as Parish[],
  };
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
