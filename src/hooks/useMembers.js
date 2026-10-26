import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// V1: jedno wspólne gospodarstwo. Zwraca jego id (pierwszy wiersz).
async function getHouseholdId() {
  const { data } = await supabase
    .from('households')
    .select('id')
    .order('created_at')
    .limit(1)
    .single()
  return data?.id ?? null
}

const loadMembers = () => supabase.from('household_members').select('*').order('created_at')

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  // Stan zmieniany dopiero po odpowiedzi z bazy
  const apply = useCallback(({ data, error }) => {
    setError(error ?? null)
    if (!error) setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    let stale = false
    loadMembers().then(r => { if (!stale) apply(r) })
    return () => { stale = true }
  }, [apply])

  const fetchMembers = useCallback(async () => apply(await loadMembers()), [apply])

  async function addMember(member) {
    const household_id = await getHouseholdId()
    const { data, error } = await supabase
      .from('household_members')
      .insert({ ...member, household_id })
      .select()
      .single()
    if (!error) fetchMembers()
    return { data, error }
  }

  async function updateMember(id, changes) {
    const { data, error } = await supabase
      .from('household_members')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) fetchMembers()
    return { data, error }
  }

  async function deleteMember(id) {
    const { error } = await supabase.from('household_members').delete().eq('id', id)
    if (!error) fetchMembers()
    return { error }
  }

  return { members, loading, error, addMember, updateMember, deleteMember, refetch: fetchMembers }
}

export function useMember(id) {
  // Wynik z bazy razem z id, którego dotyczy — „ładuję”, dopóki nie przyszedł wynik dla bieżącego id
  const [result, setResult] = useState({ id: null, member: null, error: null })

  useEffect(() => {
    if (!id) return
    let stale = false
    supabase.from('household_members').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (!stale) setResult({ id, member: error ? null : data, error: error ?? null })
      })
    return () => { stale = true }
  }, [id])

  const current = result.id === id
  const member = current ? result.member : null
  const loading = !!id && !current

  async function updateMember(changes) {
    const { data, error } = await supabase
      .from('household_members')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) setResult({ id, member: data, error: null })
    return { data, error }
  }

  async function deleteMember() {
    return supabase.from('household_members').delete().eq('id', id)
  }

  return { member, loading, error: current ? result.error : null, updateMember, deleteMember }
}
