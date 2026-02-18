'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type ProfileRow = {
  user_id: string
  nome: string | null
  foto_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)

  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const canSave = useMemo(() => nome.trim().length >= 2, [nome])

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      setMsg(null)

      const { data: authData, error: authErr } = await supabase.auth.getUser()
      if (authErr || !authData?.user) {
        router.replace('/login')
        return
      }

      const uid = authData.user.id
      if (!mounted) return
      setUserId(uid)

      // Leggi profilo
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, nome, foto_url')
        .eq('user_id', uid)
        .maybeSingle()

      if (!mounted) return

      if (error) {
        setMsg({ type: 'err', text: `Errore caricamento profilo: ${error.message}` })
      } else {
        if (data) {
          setNome(data.nome ?? '')
          setFotoUrl(data.foto_url ?? null)
        } else {
          // Se non esiste riga profilo, la creiamo “vuota”
          const { error: insErr } = await supabase
            .from('profiles')
            .insert({ user_id: uid, nome: '', foto_url: null })
          if (insErr) setMsg({ type: 'err', text: `Errore creazione profilo: ${insErr.message}` })
        }
      }

      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [router])

  const saveNome = async () => {
    if (!userId) return
    setSaving(true)
    setMsg(null)

    const clean = nome.trim()

    const { error } = await supabase
      .from('profiles')
      .update({ nome: clean })
      .eq('user_id', userId)

    if (error) {
      setMsg({ type: 'err', text: `Errore salvataggio nome: ${error.message}` })
    } else {
      setMsg({ type: 'ok', text: 'Nome salvato ✅' })
    }

    setSaving(false)
  }

  const onUpload = async (file: File | null) => {
    if (!file || !userId) return

    setUploading(true)
    setMsg(null)

    try {
      // Estensione
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const filePath = `${userId}/avatar.${ext}`

      // Upload (upsert = sovrascrive)
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || 'image/*',
          cacheControl: '3600',
        })

      if (upErr) throw upErr

      // Se bucket è PUBLIC: uso public URL
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = pub?.publicUrl

      if (!publicUrl) throw new Error('Impossibile ottenere URL pubblico')

      // Salva su profiles.foto_url
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('user_id', userId)

      if (updErr) throw updErr

      setFotoUrl(publicUrl + `?t=${Date.now()}`) // bust cache
      setMsg({ type: 'ok', text: 'Foto aggiornata ✅' })
    } catch (e: any) {
      setMsg({ type: 'err', text: `Upload fallito: ${e?.message || e}` })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="opacity-80">Caricamento profilo…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-3xl">👤</div>
          <h1 className="text-3xl font-bold">Profilo</h1>
        </div>

        <p className="opacity-80 mb-6">
          Qui sistemi il tuo profilo prima di entrare in roda 😄
        </p>

        {msg && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 border ${
              msg.type === 'ok'
                ? 'border-green-500/40 bg-green-500/10'
                : 'border-red-500/40 bg-red-500/10'
            }`}
          >
            {msg.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* CARD FOTO */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="font-bold mb-3">📸 Foto profilo</div>

            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                {fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fotoUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="opacity-70 text-sm">Nessuna foto</span>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold mb-2">Carica foto</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/15"
                />
                <div className="text-xs opacity-70 mt-2">
                  {uploading ? 'Sto caricando…' : 'Formato consigliato: jpg/png, max 2-3MB'}
                </div>
              </div>
            </div>
          </div>

          {/* CARD NOME */}
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="font-bold mb-3">✍️ Il tuo nome</div>

            <label className="block text-sm font-semibold mb-2">Sarà il nome della tua squadra</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Aurora ✨"
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/30"
            />

            <button
              onClick={saveNome}
              disabled={!canSave || saving}
              className={`mt-4 w-full rounded-xl px-4 py-3 font-semibold transition ${
                !canSave || saving
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {saving ? 'Salvataggio…' : 'Salva nome'}
            </button>

            <div className="text-xs opacity-70 mt-3">
              Minimo 2 caratteri. (Sì, “A” da sola non vale 😄)
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/10"
          >
            ← Torna alla Home
          </button>
        </div>
      </div>
    </div>
  )
}
