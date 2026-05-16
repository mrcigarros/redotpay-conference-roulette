import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============ EVENTS ============
export async function getEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createEvent(event) {
  const { data, error } = await supabase
    .from("events")
    .insert([event])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id, updates) {
  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id) {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ============ PLAYS ============
export async function getPlays(eventId) {
  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .eq("event_id", eventId)
    .order("played_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function checkUidPlayed(eventId, uid) {
  const { data, error } = await supabase
    .from("plays")
    .select("*")
    .eq("event_id", eventId)
    .eq("uid", uid)
    .maybeSingle();
  if (error) throw error;
  return data; // null if not played, object if played
}

export async function recordPlay(eventId, uid, prizeName, prizeIcon, prizeIndex) {
  const { data, error } = await supabase
    .from("plays")
    .insert([{
      event_id: eventId,
      uid,
      prize_name: prizeName,
      prize_icon: prizeIcon,
      prize_index: prizeIndex,
    }])
    .select()
    .single();
  if (error) {
    if (error.code === "23505") return null; // duplicate UID
    throw error;
  }
  return data;
}

export async function getAllPlays() {
  const { data, error } = await supabase
    .from("plays")
    .select("*, events(name, location)")
    .order("played_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ============ CONFIG (PINs) ============
export async function getConfig(key) {
  const { data, error } = await supabase
    .from("config")
    .select("value")
    .eq("key", key)
    .single();
  if (error) return null;
  return data?.value;
}

export async function setConfig(key, value) {
  const { error } = await supabase
    .from("config")
    .upsert({ key, value });
  if (error) throw error;
}
