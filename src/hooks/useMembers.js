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

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('household_members')
      .select('*')
      .order('created_at')
    if (error) setError(error)
    else setMembers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

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
  const [member,  setMember]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('household_members').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) setError(error)
        else setMember(data)
        setLoading(false)
      })
  }, [id])

  async function updateMember(changes) {
    const { data, error } = await supabase
      .from('household_members')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error) setMember(data)
    return { data, error }
  }

  async function deleteMember() {
    return supabase.from('household_members').delete().eq('id', id)
  }

  return { member, loading, error, updateMember, deleteMember }
}
