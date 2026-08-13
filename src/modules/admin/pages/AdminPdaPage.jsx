import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "../../auth/context/AuthContext.jsx"
import { useI18n } from "../../../i18n/I18nProvider.jsx"

import AdminDashboardSidebar from "../dashboard/components/AdminDashboardSidebar.jsx"
import AdminMobileNav from "../dashboard/components/AdminMobileNav.jsx"
import { getAdminDashboardCopy } from "../dashboard/i18n/adminDashboardCopy.js"

import AdminPdaHeader from "../pda/components/AdminPdaHeader.jsx"
import AdminPdaSummary from "../pda/components/AdminPdaSummary.jsx"
import AdminPdaWorkspace from "../pda/components/AdminPdaWorkspace.jsx"
import {
  PdaEditionModal,
  PdaFeedbackPopup,
  PdaResultModal,
  PdaWodModal,
} from "../pda/components/AdminPdaModals.jsx"
import { getAdminPdaCopy } from "../pda/i18n/adminPdaCopy.js"
import {
  createPdaEdition,
  createPdaWod,
  deletePdaResult,
  deletePdaWod,
  fetchCurrentPdaAdminProfile,
  fetchPdaEditionData,
  fetchPdaEditions,
  fetchPdaGeneralRanking,
  fetchPdaWodRanking,
  savePdaResult,
  setPdaEditionState,
  setPdaWodPublished,
  updatePdaEdition,
  updatePdaWod,
} from "../pda/services/adminPdaService.js"
import {
  buildPdaSummary,
  mapPdaError,
  sortWods,
} from "../pda/utils/adminPdaUtils.js"

import "../../../styles/adminDashboard.css"
import "../../../styles/adminPda.css"

const EMPTY_DATA = {
  categories: [],
  wods: [],
  athletes: [],
  results: [],
  pointsTable: [],
}

const EMPTY_SUMMARY = {
  totalWods: 0,
  publishedWods: 0,
  activeAthletes: 0,
  completedResults: 0,
}

export default function AdminPdaPage() {
  const navigate = useNavigate()
  const { locale, setLocale } = useI18n()
  const { user, nombre, rol, logout } = useAuth()
  const dashboardCopy = useMemo(() => getAdminDashboardCopy(locale), [locale])
  const copy = useMemo(() => getAdminPdaCopy(locale), [locale])

  const [profile, setProfile] = useState(null)
  const [editions, setEditions] = useState([])
  const [selectedEditionId, setSelectedEditionId] = useState("")
  const [data, setData] = useState(EMPTY_DATA)
  const [loading, setLoading] = useState(true)
  const [loadingEdition, setLoadingEdition] = useState(false)
  const [error, setError] = useState("")
  const [tab, setTab] = useState("wods")
  const [selectedWodId, setSelectedWodId] = useState("")

  const [wodRanking, setWodRanking] = useState([])
  const [generalRanking, setGeneralRanking] = useState([])
  const [loadingRanking, setLoadingRanking] = useState(false)

  const [editionModal, setEditionModal] = useState(undefined)
  const [wodModal, setWodModal] = useState(undefined)
  const [resultModal, setResultModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const selectedEdition = useMemo(
    () => editions.find((edition) => edition.id === selectedEditionId) || null,
    [editions, selectedEditionId]
  )

  const wods = useMemo(() => sortWods(data.wods), [data.wods])
  const summary = useMemo(
    () => (selectedEdition ? buildPdaSummary({ wods, athletes: data.athletes, results: data.results }) : EMPTY_SUMMARY),
    [data.athletes, data.results, selectedEdition, wods]
  )

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await fetchCurrentPdaAdminProfile(user, { nombre, rol }))
    } catch (profileError) {
      console.error("ADMIN PDA PROFILE ERROR:", profileError)
      setProfile({ nombre: nombre || user?.email || "PHO3NIX", email: user?.email, role: rol || "admin" })
    }
  }, [nombre, rol, user])

  const loadEditions = useCallback(async (preferredId = "") => {
    try {
      setLoading(true)
      setError("")
      const rows = await fetchPdaEditions()
      setEditions(rows)
      setSelectedEditionId((current) => {
        if (preferredId && rows.some((row) => row.id === preferredId)) return preferredId
        if (current && rows.some((row) => row.id === current)) return current
        return rows[0]?.id || ""
      })
    } catch (loadError) {
      console.error("ADMIN PDA EDITIONS ERROR:", loadError)
      setError(mapPdaError(loadError, copy))
    } finally {
      setLoading(false)
    }
  }, [copy])

  const loadEditionData = useCallback(async (editionId) => {
    if (!editionId) {
      setData(EMPTY_DATA)
      return
    }

    try {
      setLoadingEdition(true)
      setError("")
      const nextData = await fetchPdaEditionData(editionId)
      setData(nextData)
      setSelectedWodId((current) => {
        if (current && nextData.wods.some((row) => row.id === current)) return current
        return nextData.wods[0]?.id || ""
      })
    } catch (loadError) {
      console.error("ADMIN PDA DATA ERROR:", loadError)
      setError(mapPdaError(loadError, copy))
    } finally {
      setLoadingEdition(false)
    }
  }, [copy])

  useEffect(() => { loadProfile() }, [loadProfile])
  useEffect(() => { loadEditions() }, [loadEditions])
  useEffect(() => { loadEditionData(selectedEditionId) }, [loadEditionData, selectedEditionId])

  const loadRankings = useCallback(async () => {
    if (!selectedEditionId) return
    try {
      setLoadingRanking(true)
      const [wodRows, generalRows] = await Promise.all([
        selectedWodId ? fetchPdaWodRanking(selectedWodId) : Promise.resolve([]),
        fetchPdaGeneralRanking(selectedEditionId),
      ])
      setWodRanking(wodRows)
      setGeneralRanking(generalRows)
    } catch (rankingError) {
      console.error("ADMIN PDA RANKING ERROR:", rankingError)
      setFeedback({ tone: "error", message: mapPdaError(rankingError, copy) })
    } finally {
      setLoadingRanking(false)
    }
  }, [copy, selectedEditionId, selectedWodId])

  useEffect(() => {
    if (tab !== "results" && tab !== "ranking") return
    loadRankings()
  }, [loadRankings, tab, data.results])

  async function handleLogout() {
    try {
      await logout()
    } catch (logoutError) {
      console.error("ADMIN PDA LOGOUT ERROR:", logoutError)
      window.location.href = "/"
    }
  }

  async function handleSaveEdition(payload) {
    try {
      setSaving(true)
      if (editionModal?.id) {
        const updated = await updatePdaEdition(editionModal.id, payload)
        setFeedback({ tone: "success", message: copy.successEditionUpdated })
        setEditionModal(undefined)
        await loadEditions(updated.id)
      } else {
        const created = await createPdaEdition(payload)
        setFeedback({ tone: "success", message: copy.successEditionCreated })
        setEditionModal(undefined)
        await loadEditions(created.id)
      }
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  async function handleEditionAction(action) {
    if (!selectedEdition) return

    const payload = {
      publish: { publicada: true },
      activate: { estado: "activa", publicada: true },
      close: { estado: "cerrada" },
      reopen: { estado: "borrador", publicada: false },
    }[action]

    if (!payload) return

    try {
      setSaving(true)
      await setPdaEditionState(selectedEdition.id, payload)
      await loadEditions(selectedEdition.id)
      const successMessage = {
        publish: copy.successEditionPublished,
        activate: copy.successEditionActivated,
        close: copy.successEditionClosed,
        reopen: copy.successEditionReopened,
      }[action] || copy.successEditionUpdated
      setFeedback({ tone: "success", message: successMessage })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveWod(payload) {
    try {
      setSaving(true)
      const isEditing = Boolean(wodModal?.id)
      if (isEditing) await updatePdaWod(wodModal.id, payload)
      else await createPdaWod(payload)
      setWodModal(undefined)
      await loadEditionData(selectedEditionId)
      setFeedback({
        tone: "success",
        message: isEditing ? copy.successWodUpdated : copy.successWodCreated,
      })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteWod(wod) {
    if (!window.confirm(copy.confirmDeleteWod)) return

    try {
      setSaving(true)
      await deletePdaWod(wod.id)
      await loadEditionData(selectedEditionId)
      setFeedback({ tone: "success", message: copy.successWodDeleted })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleWodPublished(wod) {
    try {
      setSaving(true)
      const nextPublished = !wod.publicado
      await setPdaWodPublished(wod.id, nextPublished)
      await loadEditionData(selectedEditionId)
      setFeedback({
        tone: "success",
        message: nextPublished ? copy.successWodPublished : copy.successWodHidden,
      })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }


  async function handleSaveResult(payload) {
    try {
      setSaving(true)
      const isEditing = Boolean(payload.id)
      const nextPayload = { ...payload }
      delete nextPayload.id
      await savePdaResult(nextPayload)
      setResultModal(null)
      await loadEditionData(selectedEditionId)
      await loadRankings()
      setFeedback({
        tone: "success",
        message: isEditing ? copy.successResultUpdated : copy.successResultCreated,
      })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteResult(result) {
    if (!result?.id || !window.confirm(copy.delete)) return

    try {
      setSaving(true)
      await deletePdaResult(result.id)
      setResultModal(null)
      await loadEditionData(selectedEditionId)
      await loadRankings()
      setFeedback({ tone: "success", message: copy.successResultDeleted })
    } catch (operationError) {
      setFeedback({ tone: "error", message: mapPdaError(operationError, copy) })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-dashboard-screen admin-pda-screen">
      <div className="admin-dashboard-orb admin-dashboard-orb-a" aria-hidden="true" />
      <div className="admin-dashboard-orb admin-dashboard-orb-b" aria-hidden="true" />

      <AdminDashboardSidebar
        copy={dashboardCopy}
        profile={profile}
        locale={locale}
        setLocale={setLocale}
        navigate={navigate}
        onLogout={handleLogout}
      />

      <div className="admin-dashboard-main">
        <AdminPdaHeader
          dashboardCopy={dashboardCopy}
          copy={copy}
          locale={locale}
          setLocale={setLocale}
          profile={profile}
          loading={loading}
          onLogout={handleLogout}
        />

        <main className="admin-dashboard-content admin-pda-content">
          {error ? (
            <section className="admin-dashboard-error" role="alert">
              <div><strong>{copy.loadError}</strong><p>{error}</p></div>
              <button type="button" onClick={() => loadEditions(selectedEditionId)}>{copy.retry}</button>
            </section>
          ) : null}

          {selectedEdition ? (
            <AdminPdaSummary copy={copy} summary={summary} loading={loadingEdition} />
          ) : null}

          <AdminPdaWorkspace
            copy={copy}
            locale={locale}
            editions={editions}
            selectedEdition={selectedEdition}
            selectedEditionId={selectedEditionId}
            onEditionChange={setSelectedEditionId}
            onCreateEdition={() => setEditionModal(null)}
            onEditEdition={setEditionModal}
            onEditionAction={handleEditionAction}
            tab={tab}
            onTabChange={setTab}
            wods={wods}
            results={data.results}
            athletes={data.athletes}
            selectedWodId={selectedWodId}
            onWodChange={setSelectedWodId}
            wodRanking={wodRanking}
            generalRanking={generalRanking}
            loadingRanking={loadingRanking}
            onAddWod={() => setWodModal(null)}
            onEditWod={setWodModal}
            onDeleteWod={handleDeleteWod}
            onToggleWodPublished={handleToggleWodPublished}
            onEditResult={(athlete, result, wod) => setResultModal({ athlete, result, wod })}
          />
        </main>
      </div>

      <AdminMobileNav copy={dashboardCopy} navigate={navigate} />

      {editionModal !== undefined ? (
        <PdaEditionModal
          copy={copy}
          edition={editionModal}
          saving={saving}
          onClose={() => !saving && setEditionModal(undefined)}
          onSave={handleSaveEdition}
        />
      ) : null}

      {wodModal !== undefined && selectedEdition ? (
        <PdaWodModal
          copy={copy}
          edition={selectedEdition}
          wod={wodModal}
          saving={saving}
          onClose={() => !saving && setWodModal(undefined)}
          onSave={handleSaveWod}
        />
      ) : null}


      {resultModal ? (
        <PdaResultModal
          copy={copy}
          athlete={resultModal.athlete}
          wod={resultModal.wod}
          result={resultModal.result}
          saving={saving}
          onClose={() => !saving && setResultModal(null)}
          onSave={handleSaveResult}
          onDelete={handleDeleteResult}
        />
      ) : null}

      {feedback ? (
        <PdaFeedbackPopup
          copy={copy}
          feedback={feedback}
          onClose={() => setFeedback(null)}
        />
      ) : null}
    </div>
  )
}
